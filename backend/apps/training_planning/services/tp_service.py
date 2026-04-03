from django.db import transaction
from django.utils import timezone
from common.services.base import BaseService
from ..repositories import (
    TrainingPlanRepository,
    TrainingPlanItemRepository,
    TrainingPlanApprovalRepository,
    TrainingCalendarRepository,
    TrainingSessionRepository,
    TrainingSessionTrainerRepository,
    TrainingSessionEnrollmentRepository,
    TrainingAttendanceRepository
)
from ..constants import TrainingPlanStatus, TrainingApprovalStatus, EnrollmentStatus


class TrainingPlanService(BaseService):
    repository_class = TrainingPlanRepository


class TrainingPlanItemService(BaseService):
    repository_class = TrainingPlanItemRepository


class TrainingPlanApprovalService(BaseService):
    repository_class = TrainingPlanApprovalRepository

    @transaction.atomic
    def process_approval(self, approval_id, status, comments):
        """Finalizes training strategy approval and updates plan status."""
        approval = self.repository.get_by_id(approval_id)
        if not approval:
            return None

        # Update record
        self.repository.update(
            pk=approval_id,
            approval_status=status,
            comments=comments,
            approved_at=timezone.now()
        )

        # Update parent plan
        plan_repo = TrainingPlanRepository()
        new_plan_status = TrainingPlanStatus.APPROVED if status == TrainingApprovalStatus.APPROVED else TrainingPlanStatus.DRAFT
        plan_repo.update(pk=approval.training_plan_id, status=new_plan_status)

        return approval


class TrainingCalendarService(BaseService):
    repository_class = TrainingCalendarRepository


class TrainingSessionService(BaseService):
    repository_class = TrainingSessionRepository


class TrainingSessionTrainerService(BaseService):
    repository_class = TrainingSessionTrainerRepository


class TrainingSessionEnrollmentService(BaseService):
    repository_class = TrainingSessionEnrollmentRepository

    @transaction.atomic
    def enroll_employee(self, session_id, employee_id):
        """
        Business Logic: Handles enrollment with automatic capacity checking.
        If a session is full, the employee is added to the WAITLIST.
        """
        session_repo = TrainingSessionRepository()
        session = session_repo.get_by_id(session_id)
        
        if not session:
            return None

        current_enrollments = self.repository.get_enrollment_count(session_id)
        status = EnrollmentStatus.ENROLLED
        
        if current_enrollments >= session.capacity:
            status = EnrollmentStatus.WAITLIST

        enrollment, created = self.repository.model.objects.get_or_create(
            training_session_id=session_id,
            employee_id=employee_id,
            defaults={"enrollment_status": status}
        )
        
        return enrollment


class TrainingAttendanceService(BaseService):
    repository_class = TrainingAttendanceRepository
