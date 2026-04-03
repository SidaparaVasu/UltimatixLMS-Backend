from common.repositories.base import BaseRepository
from ..models import (
    TrainingPlan,
    TrainingPlanItem,
    TrainingPlanApproval,
    TrainingCalendar,
    TrainingSession,
    TrainingSessionTrainer,
    TrainingSessionEnrollment,
    TrainingAttendance
)


class TrainingPlanRepository(BaseRepository[TrainingPlan]):
    """
    Handles access to annual training strategy plans.
    """
    model = TrainingPlan

    def get_by_year_and_dept(self, year, department_id):
        """Finds specific plans for a year and department."""
        return self.filter(year=year, department_id=department_id, is_active=True)


class TrainingPlanItemRepository(BaseRepository[TrainingPlanItem]):
    """
    Handles data for individual components of a training plan.
    """
    model = TrainingPlanItem

    def get_by_plan(self, plan_id):
        """Fetch all items within a specific planning window."""
        return self.filter(training_plan_id=plan_id)


class TrainingPlanApprovalRepository(BaseRepository[TrainingPlanApproval]):
    """
    Tracks the history of strategy approvals.
    """
    model = TrainingPlanApproval


class TrainingCalendarRepository(BaseRepository[TrainingCalendar]):
    """
    Access to the annual structural container for training events.
    """
    model = TrainingCalendar


class TrainingSessionRepository(BaseRepository[TrainingSession]):
    """
    Access point for actual training batch executions.
    """
    model = TrainingSession

    def get_upcoming_sessions(self, department_id=None):
        """Fetch all sessions that are yet to start."""
        from django.utils import timezone
        now = timezone.now()
        queryset = self.filter(session_start_date__gt=now)
        if department_id:
            queryset = queryset.filter(calendar__department_id=department_id)
        return queryset


class TrainingSessionTrainerRepository(BaseRepository[TrainingSessionTrainer]):
    """
    Mapping for trainers assigned to sessions.
    """
    model = TrainingSessionTrainer


class TrainingSessionEnrollmentRepository(BaseRepository[TrainingSessionEnrollment]):
    """
    Operational data for employee sign-ups.
    """
    model = TrainingSessionEnrollment

    def get_enrollment_count(self, session_id):
        """Calculates total active enrollments for a specific session."""
        from ..constants import EnrollmentStatus
        return self.filter(
            training_session_id=session_id, 
            enrollment_status=EnrollmentStatus.ENROLLED
        ).count()


class TrainingAttendanceRepository(BaseRepository[TrainingAttendance]):
    """
    Persistence layer for post-session attendance records.
    """
    model = TrainingAttendance
