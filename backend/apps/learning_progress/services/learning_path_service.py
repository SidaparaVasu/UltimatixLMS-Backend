from common.services.base import BaseService
from django.utils import timezone
from django.db import transaction
from django.db.models import Count
from ..models import UserLessonProgress
from ..repositories import (
    LearningPathRepository,
    UserCourseEnrollmentRepository,
    UserLessonProgressRepository,
    UserContentProgressRepository,
    CourseCertificateRepository
)
from ..constants import ProgressStatus, EnrollmentType


class LearningPathService(BaseService):
    repository_class = LearningPathRepository


class UserCourseEnrollmentService(BaseService):
    repository_class = UserCourseEnrollmentRepository

    def enroll_employee_in_course(self, employee_id, course_id, enrollment_type=EnrollmentType.SELF_ENROLL):
        """
        Creates a new enrollment and initializes the progress hierarchy.
        """
        with transaction.atomic():
            # 1. Create Enrollment
            enrollment = self.repository.create(**{
                "employee_id": employee_id,
                "course_id": course_id,
                "enrollment_type": enrollment_type,
                "status": ProgressStatus.NOT_STARTED,
                "progress_percentage": 0.00
            })
            return enrollment

    def update_course_progress(self, enrollment_id):
        """
        Recalculates the master progress percentage for an enrollment.
        Logic: (Completed Lessons / Total Lessons) * 100
        """
        enrollment = self.repository.get_by_id(enrollment_id)
        if not enrollment:
            return

        total_lessons = enrollment.course.sections.all().aggregate(
            lesson_count=Count('lessons')
        )['lesson_count'] or 0

        if total_lessons == 0:
            return

        completed_lessons = enrollment.lesson_progress.filter(
            status=ProgressStatus.COMPLETED
        ).count()

        percentage = (completed_lessons / total_lessons) * 100
        enrollment.progress_percentage = percentage
        
        if percentage >= 100:
            enrollment.status = ProgressStatus.COMPLETED
            enrollment.completed_at = timezone.now()
            # Here we could trigger certificate generation
        elif percentage > 0:
            enrollment.status = ProgressStatus.IN_PROGRESS
            if not enrollment.started_at:
                enrollment.started_at = timezone.now()
        
        enrollment.save()
        return enrollment


class UserLessonProgressService(BaseService):
    repository_class = UserLessonProgressRepository


class UserContentProgressService(BaseService):
    repository_class = UserContentProgressRepository

    def record_heartbeat(self, enrollment_id, lesson_id, content_id, playhead):
        """
        Updates the playhead and marks content as 'completed' if requirements met.
        """
        with transaction.atomic():
            # 1. Ensure Lesson Progress exists
            # TODO: Implement caching for better performance
            enroll_service = UserCourseEnrollmentService()
            enrollment = enroll_service.repository.get_by_id(enrollment_id)
            
            lesson_progress, created = UserLessonProgress.objects.get_or_create(
                enrollment=enrollment,
                lesson_id=lesson_id,
                defaults={"status": ProgressStatus.IN_PROGRESS}
            )

            # 2. Update Content Progress
            content_progress, cp_created = self.repository.model.objects.get_or_create(
                lesson_progress=lesson_progress,
                content_id=content_id
            )
            content_progress.playhead_seconds = playhead
            
            # Simple logic: Moving playhead forward marks it as completed (stub for video logic)
            if playhead > 0:
                content_progress.is_completed = True
            
            content_progress.save()

            # 3. Check if all content in lesson is done
            total_content_in_lesson = lesson_progress.lesson.contents.count()
            completed_content_in_lesson = lesson_progress.content_progress.filter(is_completed=True).count()

            if completed_content_in_lesson >= total_content_in_lesson:
                if lesson_progress.status != ProgressStatus.COMPLETED:
                    lesson_progress.status = ProgressStatus.COMPLETED
                    lesson_progress.completed_at = timezone.now()
                    lesson_progress.save()
                    # Trigger Master Progress update
                    enroll_service.update_course_progress(enrollment_id)
            
            return content_progress


class CourseCertificateService(BaseService):
    repository_class = CourseCertificateRepository
