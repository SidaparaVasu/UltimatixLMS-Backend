from common.repositories.base import BaseRepository
from django.db.models import Count, Q
from ..models import (
    LearningPathMaster,
    LearningPathCourseMap,
    UserCourseEnrollment,
    UserLessonProgress,
    UserContentProgress,
    CourseCertificate
)


class LearningPathRepository(BaseRepository[LearningPathMaster]):
    model = LearningPathMaster


class UserCourseEnrollmentRepository(BaseRepository[UserCourseEnrollment]):
    model = UserCourseEnrollment

    def get_employee_active_courses(self, employee_id):
        """
        Fetches all courses currently being taken by an employee with 
        pre-fetched progress and deep-linked course metadata.
        """
        return self.model.objects.select_related("course", "course__category")\
            .filter(employee_id=employee_id, status__in=["NOT_STARTED", "IN_PROGRESS"])\
            .order_by("-enrolled_at")

    def get_enrollment_with_detailed_progress(self, enrollment_id):
        """
        Optimized fetch to get absolute progress hierarchy (Lessons + Content Completion).
        """
        return self.model.objects.select_related("course")\
            .prefetch_related(
                "lesson_progress",
                "lesson_progress__lesson",
                "lesson_progress__content_progress",
                "lesson_progress__content_progress__content"
            ).filter(id=enrollment_id).first()


class UserLessonProgressRepository(BaseRepository[UserLessonProgress]):
    model = UserLessonProgress


class UserContentProgressRepository(BaseRepository[UserContentProgress]):
    model = UserContentProgress

    def get_specific_artifact_progress(self, lesson_progress_id, content_id):
        """Fetches the heartbeat tracking record for a specific asset."""
        return self.model.objects.filter(
            lesson_progress_id=lesson_progress_id, 
            content_id=content_id
        ).first()


class CourseCertificateRepository(BaseRepository[CourseCertificate]):
    model = CourseCertificate
