"""
NotificationService — creates, reads, and manages in-app notifications.

Rules:
    - This is the ONLY entry point for creating notifications.
      Signals, cron jobs, and other services must call this — never the repo directly.
    - All methods are user-scoped; cross-user access is never permitted.
    - Notification creation must NEVER raise an exception that breaks the calling flow.
      Failures are logged and swallowed so a notification bug cannot break enrollment,
      grading, or any other core operation.
    - Sensitive data (passwords, tokens, OTPs) must never appear in title or message.
"""

import logging

from apps.notifications.constants import NotificationType
from apps.notifications.models import Notification

logger = logging.getLogger(__name__)


class NotificationService:

    def __init__(self, repo=None):
        self._repo = repo

    # ------------------------------------------------------------------
    # Lazy dependency resolution (avoids circular imports at module load)
    # ------------------------------------------------------------------

    @property
    def repo(self):
        if self._repo is None:
            from apps.notifications.repositories.notification_repository import NotificationRepository
            self._repo = NotificationRepository()
        return self._repo

    # ==================================================================
    # Creation
    # ==================================================================

    def create(
        self,
        user_id: int,
        notification_type: str,
        title: str,
        message: str,
        action_url: str = "",
        entity_type: str = "",
        entity_id: str = "",
    ) -> Notification | None:
        """
        Create a single in-app notification for one user.

        Called by Django signals on model save events.

        Args:
            user_id:           PK of the recipient AuthUser.
            notification_type: One of NotificationType choices.
            title:             Short heading (shown in bell dropdown).
            message:           Full body text.
            action_url:        Frontend route, e.g. '/my-learning'.
            entity_type:       Source model name for deep-linking.
            entity_id:         Source record PK as string.

        Returns:
            The created Notification, or None if creation failed.
        """
        try:
            notif = self.repo.create_notification(
                user_id=user_id,
                notification_type=notification_type,
                title=title,
                message=message,
                action_url=action_url,
                entity_type=entity_type,
                entity_id=str(entity_id) if entity_id else "",
            )
            logger.debug(
                "Notification created: user_id=%s type=%s",
                user_id, notification_type,
            )
            return notif
        except Exception as exc:
            # Notification failure must never break the calling flow.
            logger.error(
                "NotificationService.create failed: user_id=%s type=%s error=%s",
                user_id, notification_type, exc,
            )
            return None

    def bulk_create(
        self,
        user_ids: list[int],
        notification_type: str,
        title: str,
        message: str,
        action_url: str = "",
        entity_type: str = "",
        entity_id: str = "",
    ) -> int:
        """
        Create the same notification for multiple users in one DB round-trip.

        Used for admin broadcasts (e.g. rating cycle open) and compliance sweeps.

        Returns:
            Number of notifications created (0 on failure).
        """
        if not user_ids:
            return 0
        try:
            count = self.repo.bulk_create_notifications(
                user_ids=user_ids,
                notification_type=notification_type,
                title=title,
                message=message,
                action_url=action_url,
                entity_type=entity_type,
                entity_id=str(entity_id) if entity_id else "",
            )
            logger.info(
                "Bulk notifications created: type=%s count=%s",
                notification_type, count,
            )
            return count
        except Exception as exc:
            logger.error(
                "NotificationService.bulk_create failed: type=%s error=%s",
                notification_type, exc,
            )
            return 0

    # ==================================================================
    # Convenience factory methods — one per notification type
    # Each method encodes the correct title template and action_url so
    # callers (signals, cron jobs) only pass the dynamic values.
    # ==================================================================

    # ------------------------------------------------------------------
    # Learner notifications
    # ------------------------------------------------------------------

    def notify_enrollment(self, user_id: int, course_title: str, course_id: int, enrollment_id: int) -> None:
        self.create(
            user_id=user_id,
            notification_type=NotificationType.ENROLLMENT,
            title="Course Enrolled",
            message=f"You have been enrolled in \"{course_title}\". Start learning now.",
            action_url=f"/courses/{course_id}",
            entity_type="UserCourseEnrollment",
            entity_id=str(enrollment_id),
        )

    def notify_course_completed(self, user_id: int, course_title: str, enrollment_id: int) -> None:
        self.create(
            user_id=user_id,
            notification_type=NotificationType.COMPLETION,
            title="Course Completed",
            message=f"Congratulations! You have completed \"{course_title}\".",
            action_url="/my-learning",
            entity_type="UserCourseEnrollment",
            entity_id=str(enrollment_id),
        )

    def notify_certificate_issued(
        self, user_id: int, course_title: str, certificate_id: int
    ) -> None:
        self.create(
            user_id=user_id,
            notification_type=NotificationType.CERTIFICATE,
            title="Certificate Ready",
            message=f"Your certificate for \"{course_title}\" is ready. Download it now.",
            action_url="/my-certificates",
            entity_type="CourseCertificate",
            entity_id=str(certificate_id),
        )

    def notify_assessment_result(
        self, user_id: int, assessment_title: str, score: float, enrollment_id: int
    ) -> None:
        self.create(
            user_id=user_id,
            notification_type=NotificationType.ASSESSMENT_RESULT,
            title="Assessment Result Available",
            message=f"Your result for \"{assessment_title}\" is available. Score: {score:.0f}%.",
            action_url=f"/learn/{enrollment_id}",
            entity_type="AssessmentResult",
            entity_id=str(enrollment_id),
        )

    # ------------------------------------------------------------------
    # TNI / Skill notifications
    # ------------------------------------------------------------------

    def notify_tni_approved(
        self, user_id: int, skill_name: str, approval_id: int
    ) -> None:
        self.create(
            user_id=user_id,
            notification_type=NotificationType.TNI_APPROVAL,
            title="Training Need Approved",
            message=f"Your training need for \"{skill_name}\" has been approved.",
            action_url="/my-tni",
            entity_type="TrainingNeedApproval",
            entity_id=str(approval_id),
        )

    def notify_tni_rejected(
        self, user_id: int, skill_name: str, comments: str, approval_id: int
    ) -> None:
        reason = f" Reason: {comments}" if comments else ""
        self.create(
            user_id=user_id,
            notification_type=NotificationType.TNI_REJECTION,
            title="Training Need Not Approved",
            message=f"Your training need for \"{skill_name}\" was not approved.{reason}",
            action_url="/my-tni",
            entity_type="TrainingNeedApproval",
            entity_id=str(approval_id),
        )

    def notify_tni_pending_review(
        self, manager_user_id: int, employee_name: str, skill_name: str, approval_id: int
    ) -> None:
        self.create(
            user_id=manager_user_id,
            notification_type=NotificationType.TNI_PENDING_REVIEW,
            title="Training Need Awaiting Review",
            message=f"{employee_name} has a training need pending your review for \"{skill_name}\".",
            action_url="/manager/tni",
            entity_type="TrainingNeedApproval",
            entity_id=str(approval_id),
        )

    def notify_skill_rating_submitted(self, user_id: int) -> None:
        self.create(
            user_id=user_id,
            notification_type=NotificationType.SKILL_RATING,
            title="Skill Ratings Submitted",
            message="Your manager has submitted your skill ratings. View your updated skill matrix.",
            action_url="/my-skills",
        )

    def notify_rating_cycle_open(self, manager_user_ids: list[int]) -> None:
        self.bulk_create(
            user_ids=manager_user_ids,
            notification_type=NotificationType.RATING_CYCLE_OPEN,
            title="Skill Rating Cycle Open",
            message="The skill rating cycle is now open. Please rate your team members.",
            action_url="/manager/tni",
        )

    # ------------------------------------------------------------------
    # Training plan / approval notifications
    # ------------------------------------------------------------------

    def notify_plan_pending_approval(
        self, admin_user_id: int, plan_name: str, dept_name: str, approval_id: int
    ) -> None:
        self.create(
            user_id=admin_user_id,
            notification_type=NotificationType.PLAN_PENDING_APPROVAL,
            title="Training Plan Awaiting Approval",
            message=f"Training plan \"{plan_name}\" submitted by {dept_name} is awaiting your approval.",
            action_url="/admin/approvals",
            entity_type="TrainingPlanApproval",
            entity_id=str(approval_id),
        )

    def notify_plan_approved(
        self, user_id: int, plan_name: str, plan_id: int
    ) -> None:
        self.create(
            user_id=user_id,
            notification_type=NotificationType.PLAN_APPROVED,
            title="Training Plan Approved",
            message=f"Training plan \"{plan_name}\" has been approved.",
            action_url="/admin/training-plans",
            entity_type="TrainingPlan",
            entity_id=str(plan_id),
        )

    def notify_plan_rejected(
        self, user_id: int, plan_name: str, comments: str, plan_id: int
    ) -> None:
        reason = f" Reason: {comments}" if comments else ""
        self.create(
            user_id=user_id,
            notification_type=NotificationType.PLAN_REJECTED,
            title="Training Plan Rejected",
            message=f"Training plan \"{plan_name}\" was rejected.{reason}",
            action_url="/admin/training-plans",
            entity_type="TrainingPlan",
            entity_id=str(plan_id),
        )

    # ------------------------------------------------------------------
    # Session notifications
    # ------------------------------------------------------------------

    def notify_session_enrolled(
        self,
        user_id: int,
        session_title: str,
        session_date: str,
        session_enrollment_id: int,
    ) -> None:
        self.create(
            user_id=user_id,
            notification_type=NotificationType.SESSION_ENROLLED,
            title="Training Session Enrolled",
            message=f"You have been enrolled in the training session \"{session_title}\" on {session_date}.",
            action_url="/calendar",
            entity_type="TrainingSessionEnrollment",
            entity_id=str(session_enrollment_id),
        )

    def notify_session_reminder(
        self, user_id: int, session_title: str, session_time: str, session_id: int
    ) -> None:
        self.create(
            user_id=user_id,
            notification_type=NotificationType.SESSION_REMINDER,
            title="Training Session Tomorrow",
            message=f"Reminder: Your training session \"{session_title}\" starts tomorrow at {session_time}.",
            action_url="/calendar",
            entity_type="TrainingSession",
            entity_id=str(session_id),
        )

    # ------------------------------------------------------------------
    # Compliance / admin notifications
    # ------------------------------------------------------------------

    def notify_compliance_expiry(
        self, user_id: int, course_title: str, days_remaining: int, course_id: int
    ) -> None:
        self.create(
            user_id=user_id,
            notification_type=NotificationType.COMPLIANCE_EXPIRY,
            title="Compliance Training Expiring Soon",
            message=(
                f"Your compliance training \"{course_title}\" expires in {days_remaining} day"
                f"{'s' if days_remaining != 1 else ''}. Renew now."
            ),
            action_url=f"/courses/{course_id}",
            entity_type="CourseCertificate",
            entity_id=str(course_id),
        )

    def notify_compliance_alert_admin(
        self, admin_user_ids: list[int], expiring_count: int
    ) -> None:
        self.bulk_create(
            user_ids=admin_user_ids,
            notification_type=NotificationType.COMPLIANCE_ALERT,
            title="Compliance Alert",
            message=(
                f"{expiring_count} employee{'s' if expiring_count != 1 else ''} "
                f"{'have' if expiring_count != 1 else 'has'} compliance training expiring within 30 days."
            ),
            action_url="/admin/reports/compliance",
        )

    def notify_team_completion(
        self, manager_user_id: int, employee_name: str, course_title: str, enrollment_id: int
    ) -> None:
        self.create(
            user_id=manager_user_id,
            notification_type=NotificationType.TEAM_COMPLETION,
            title="Team Member Completed a Course",
            message=f"{employee_name} has completed \"{course_title}\".",
            action_url="/dashboard",
            entity_type="UserCourseEnrollment",
            entity_id=str(enrollment_id),
        )

    # ==================================================================
    # Read / query operations
    # ==================================================================

    def get_notifications(
        self,
        user_id: int,
        is_read: bool | None = None,
        notification_types: list[str] | None = None,
    ):
        """
        Return a queryset of notifications for a user.
        Callers (views) apply pagination on top of this queryset.
        """
        return self.repo.get_for_user(
            user_id=user_id,
            is_read=is_read,
            notification_types=notification_types,
        )

    def get_unread_count(self, user_id: int) -> int:
        """Return the unread notification count for the bell badge."""
        return self.repo.get_unread_count(user_id=user_id)

    # ==================================================================
    # Mark-read operations
    # ==================================================================

    def mark_read(self, notification_id: int, user_id: int) -> Notification | None:
        """
        Mark a single notification as read.

        Returns the updated instance, or None if not found / not owned by user.
        """
        return self.repo.mark_read(notification_id=notification_id, user_id=user_id)

    def mark_all_read(self, user_id: int) -> int:
        """
        Mark all unread notifications for a user as read.

        Returns:
            Number of notifications updated.
        """
        count = self.repo.mark_all_read(user_id=user_id)
        logger.debug("mark_all_read: user_id=%s updated=%s", user_id, count)
        return count

    # ==================================================================
    # Deletion
    # ==================================================================

    def delete_notification(self, notification_id: int, user_id: int) -> bool:
        """
        Delete a single notification owned by the user.

        Returns True if deleted, False if not found.
        """
        return self.repo.delete_for_user(
            notification_id=notification_id, user_id=user_id,
        )
