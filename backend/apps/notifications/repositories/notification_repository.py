"""
NotificationRepository — the only layer allowed to query the Notification model directly.

Rules:
    - Services must call this repository; no direct ORM in services or views.
    - Every query is scoped to a specific user_id — never return cross-user data.
    - bulk_create uses ignore_conflicts=False so failures surface immediately.
    - No raw SQL queries.
"""

from django.db import transaction
from django.utils import timezone

from common.repositories.base import BaseRepository
from apps.notifications.models import Notification
from apps.notifications.constants import NotificationType


class NotificationRepository(BaseRepository[Notification]):
    model = Notification

    # ------------------------------------------------------------------
    # Single-record creation
    # ------------------------------------------------------------------

    def create_notification(
        self,
        user_id: int,
        notification_type: str,
        title: str,
        message: str,
        action_url: str = "",
        entity_type: str = "",
        entity_id: str = "",
    ) -> Notification:
        """
        Persist a single notification for one user.

        Args:
            user_id:           PK of the recipient AuthUser.
            notification_type: One of NotificationType choices.
            title:             Short heading for the bell dropdown.
            message:           Full body text.
            action_url:        Frontend route, e.g. '/my-learning'.
            entity_type:       Source model name, e.g. 'UserCourseEnrollment'.
            entity_id:         Source record PK as string.

        Returns:
            The created Notification instance.
        """
        return self.model.objects.create(
            user_id=user_id,
            notification_type=notification_type,
            title=title,
            message=message,
            action_url=action_url,
            entity_type=entity_type,
            entity_id=str(entity_id) if entity_id else "",
        )

    # ------------------------------------------------------------------
    # Bulk creation
    # ------------------------------------------------------------------

    @transaction.atomic
    def bulk_create_notifications(
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
        Persist one notification per user in a single INSERT statement.

        Used for admin broadcasts and compliance sweeps where the same
        message goes to many users simultaneously.

        Returns:
            Number of notifications created.
        """
        if not user_ids:
            return 0

        notifications = [
            self.model(
                user_id=uid,
                notification_type=notification_type,
                title=title,
                message=message,
                action_url=action_url,
                entity_type=entity_type,
                entity_id=str(entity_id) if entity_id else "",
            )
            for uid in user_ids
        ]
        created = self.model.objects.bulk_create(notifications)
        return len(created)

    # ------------------------------------------------------------------
    # Read queries (always user-scoped)
    # ------------------------------------------------------------------

    def get_for_user(
        self,
        user_id: int,
        is_read: bool | None = None,
        notification_types: list[str] | None = None,
    ):
        """
        Return a queryset of notifications for a user, newest first.

        Args:
            user_id:             Filter to this user only.
            is_read:             If provided, filter by read state.
            notification_types:  If provided, filter to these types only.

        Returns:
            QuerySet — callers can further slice, paginate, or annotate.
        """
        qs = self.model.objects.filter(user_id=user_id)

        if is_read is not None:
            qs = qs.filter(is_read=is_read)

        if notification_types:
            qs = qs.filter(notification_type__in=notification_types)

        return qs.order_by("-sent_at")

    def get_unread_count(self, user_id: int) -> int:
        """
        Return the count of unread notifications for a user.
        Powers the bell badge — must be fast.
        Uses the (user, is_read) composite index.
        """
        return self.model.objects.filter(user_id=user_id, is_read=False).count()

    def get_by_id_and_user(self, notification_id: int, user_id: int) -> Notification | None:
        """
        Fetch a single notification only if it belongs to the given user.
        Returns None on any mismatch — never leaks other users' notifications.
        """
        try:
            return self.model.objects.get(pk=notification_id, user_id=user_id)
        except self.model.DoesNotExist:
            return None

    # ------------------------------------------------------------------
    # Mark-read operations
    # ------------------------------------------------------------------

    def mark_read(self, notification_id: int, user_id: int) -> Notification | None:
        """
        Mark a single notification as read.

        Returns the updated instance, or None if not found / not owned by user.
        Only touches the two changed fields for efficiency.
        """
        notif = self.get_by_id_and_user(notification_id, user_id)
        if notif and not notif.is_read:
            notif.is_read = True
            notif.read_at = timezone.now()
            notif.save(update_fields=["is_read", "read_at"])
        return notif

    def mark_all_read(self, user_id: int) -> int:
        """
        Mark every unread notification for a user as read in one UPDATE.

        Returns:
            Number of rows updated.
        """
        return self.model.objects.filter(
            user_id=user_id, is_read=False
        ).update(is_read=True, read_at=timezone.now())

    # ------------------------------------------------------------------
    # Deletion
    # ------------------------------------------------------------------

    def delete_for_user(self, notification_id: int, user_id: int) -> bool:
        """
        Hard-delete a single notification owned by the user.

        Returns True if a record was deleted, False if not found.
        """
        deleted_count, _ = self.model.objects.filter(
            pk=notification_id, user_id=user_id
        ).delete()
        return deleted_count > 0
