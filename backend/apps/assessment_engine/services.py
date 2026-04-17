import random
from datetime import timedelta
from django.utils import timezone
from django.db import transaction
from common.services.base import BaseService
from .repositories import (
    AssessmentRepository, AttemptRepository, 
    QuestionRepository, ResultRepository
)
from .models import AssessmentAttempt, AssessmentQuestionMapping


class AssessmentBuildService(BaseService):
    """
    Handles Studio-level operations for building quizzes.
    """
    repository_class = AssessmentRepository

    @transaction.atomic
    def bulk_sync_questions(self, assessment_id, question_data_list):
        """
        Syncs the curriculum of an assessment. 
        Accepts a list of question IDs and weights.
        """
        # Remove old mappings
        AssessmentQuestionMapping.objects.filter(assessment_id=assessment_id).delete()
        
        mappings = []
        for i, data in enumerate(question_data_list):
            mappings.append(AssessmentQuestionMapping(
                assessment_id=assessment_id,
                question_id=data['question_id'],
                weight_points=data.get('weight', 1.00),
                display_order=i + 1
            ))
        
        return AssessmentQuestionMapping.objects.bulk_create(mappings)


class AttemptService(BaseService):
    """
    Handles Learner-level operations for taking exams in a strictly linear flow.
    """
    repository_class = AttemptRepository

    @transaction.atomic
    def start_attempt(self, employee_id, assessment_id):
        """
        Initializes a new attempt and pre-populates the question shells.
        """
        assessment = AssessmentRepository().get_by_id(assessment_id)
        if not assessment:
            raise ValueError("Assessment not found.")

        # 1. Check for active attempt
        active = self.repository.get_active_attempt(employee_id, assessment_id)
        if active:
            return active

        # 2. Check retake limit
        history_count = self.repository.filter(
            employee_id=employee_id, 
            assessment_id=assessment_id
        ).count()
        
        if history_count >= assessment.retake_limit:
            raise ValueError(f"Retake limit reached. Maximum {assessment.retake_limit} attempts allowed.")

        # 3. Create attempt
        expires_at = timezone.now() + timedelta(minutes=assessment.duration_minutes)
        attempt = self.repository.create(**{
            "employee_id": employee_id,
            "assessment_id": assessment_id,
            "status": "IN_PROGRESS",
            "expires_at": expires_at
        })

        # 4. Pre-populate question shells (UserAnswer)
        mappings = list(assessment.question_mappings.all())
        if assessment.is_randomized:
            random.shuffle(mappings)
            
        from .models import UserAnswer
        shells = [
            UserAnswer(
                attempt=attempt,
                question_id=m.question_id,
                status="NOT_VISITED"
            ) for m in mappings
        ]
        UserAnswer.objects.bulk_create(shells)
        
        return attempt

    @transaction.atomic
    def get_next_question(self, attempt_id):
        """
        Atomically identifies the next not-visited question and starts its timer.
        """
        from .models import UserAnswer
        # Find the first not-visited question based on creation order/randomized order
        next_answer = UserAnswer.objects.filter(
            attempt_id=attempt_id, 
            status="NOT_VISITED"
        ).order_by('id').first()
        
        if not next_answer:
            return None # No more questions
            
        # Start the timer!
        next_answer.started_at = timezone.now()
        next_answer.save()
        return next_answer

    @transaction.atomic
    def submit_question_answer(self, attempt_id, question_id, selected_option_ids=None, answer_text="", file_ref=None):
        """
        Submits answer for a specific question with Hard-Timing enforcement.
        """
        from .models import UserAnswer
        answer = UserAnswer.objects.get(attempt_id=attempt_id, question_id=question_id)
        
        if answer.status != "NOT_VISITED" or not answer.started_at:
            raise ValueError("Question already submitted or timer not started.")
            
        # 1. Hard-Timing Check
        mapping = AssessmentQuestionMapping.objects.get(
            assessment_id=answer.attempt.assessment_id, 
            question_id=question_id
        )
        
        duration = (timezone.now() - answer.started_at).total_seconds()
        
        # 5s buffer for network latency
        if mapping.time_limit_seconds > 0 and duration > (mapping.time_limit_seconds + 5):
            answer.status = "TIMED_OUT"
            answer.finished_at = timezone.now()
            answer.save()
            return answer, False # Timed out

        # 2. Save Response
        if selected_option_ids:
            answer.selected_options.set(selected_option_ids)
        
        answer.answer_text = answer_text
        answer.uploaded_file = file_ref
        answer.status = "ATTEMPTED"
        answer.finished_at = timezone.now()
        answer.save()
        
        return answer, True


class GradingService(BaseService):
    """
    Core Evaluation Engine for Assessments.
    """
    repository_class = ResultRepository

    @transaction.atomic
    def grade_attempt(self, attempt_id):
        """
        Orchestrates the final scoring once the attempt is complete.
        """
        attempt = AttemptRepository().get_by_id(attempt_id)
        if not attempt:
            raise ValueError("Attempt not found.")
            
        if attempt.status == "COMPLETED":
            return attempt.result

        assessment = attempt.assessment
        mappings = {m.question_id: m for m in assessment.question_mappings.all()}
        # We only grade Attempted questions; Timed-out/Not-visited are 0 by default
        answers = attempt.answers.all().select_related('question')
        
        total_possible_points = sum(m.weight_points for m in mappings.values())
        earned_points = 0
        needs_manual_review = False

        for answer in answers:
            mapping = mappings.get(answer.question_id)
            if not mapping or answer.status != "ATTEMPTED":
                continue
                
            q_type = answer.question.question_type
            
            # 1. Handle Auto-gradable types
            if q_type in ["MCQ", "MSQ", "TRUE_FALSE"]:
                q_score = self.calculate_objective_score(answer, mapping, assessment)
                answer.earned_points = q_score
                answer.is_auto_graded = True
                answer.save()
                earned_points += q_score
            else:
                # Descriptive / File Upload
                needs_manual_review = True
                answer.is_auto_graded = False
                answer.save()

        # Final floor for negative scores (Never go below 0% for the final result)
        earned_points = max(0, earned_points)

        # 2. Finalize Result
        score_percentage = (earned_points / total_possible_points * 100) if total_possible_points > 0 else 0
        
        status = "PENDING" if needs_manual_review else ("PASS" if score_percentage >= assessment.passing_percentage else "FAIL")
        
        result = self.repository.create(**{
            "attempt": attempt,
            "total_score": earned_points,
            "score_percentage": score_percentage,
            "status": status,
            "grading_type": "PENDING" if needs_manual_review else "AUTO_GRADED",
            "graded_at": timezone.now() if not needs_manual_review else None
        })

        # 3. Mark attempt as completed
        attempt.status = "COMPLETED"
        attempt.submitted_at = timezone.now()
        attempt.save()

        return result

    def calculate_objective_score(self, answer, mapping, assessment):
        """
        Advanced scoring logic supporting MSQ (Set-based) and Negative Marking.
        """
        from decimal import Decimal
        weight = Decimal(str(mapping.weight_points))
        neg_enabled = assessment.negative_marking_enabled
        neg_perc = Decimal(str(assessment.negative_marking_percentage))
        
        question = answer.question
        correct_options = set(question.options.filter(is_correct=True).values_list('id', flat=True))
        selected_options = set(answer.selected_options.values_list('id', flat=True))

        # 1. Perfect Match (Works for MCQ, MSQ, TRUE_FALSE)
        if selected_options == correct_options and len(correct_options) > 0:
            return weight

        # 2. Incorrect / Partial
        if not neg_enabled:
            # Check for partial credit if MSQ
            if question.question_type == "MSQ" and len(selected_options) > 0:
                # Only award if NO incorrect options selected (Strict accuracy)
                all_selected_are_correct = selected_options.issubset(correct_options)
                if all_selected_are_correct:
                    return (Decimal(len(selected_options)) / Decimal(len(correct_options))) * weight
            return Decimal("0.00")
        else:
            # Negative Marking Enabled: Flat penalty for any mistake
            penalty = -(weight * (neg_perc / Decimal("100.00")))
            return penalty
