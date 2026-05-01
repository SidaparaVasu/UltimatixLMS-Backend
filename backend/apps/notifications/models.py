"""
Notifications models.

Tables:
    Notification — Per-user in-app notification records.

Rules enforced:
    - Notifications are user-scoped; every query must filter by user.
    - is_read + read_at are updated together — never one without the other.
    - action_url stores a frontend route (e.g. /my-learning), not a full URL.
    - entity_type + entity_id allow deep-linking back to the source record.
    - Notifications are soft-retained; deletion is user-initiated only.
    - No sensitive data (passwords, tokens, OTPs) may appear in title/message.
"""

from django.conf import settings
from django.db import models
from django.utils import timezone

from .constants import NotificationType


class Notification(models.Model):
    """
    A single in-app notification delivered to one user.

    Lifecycle:
        created (is_read=False) → read (is_read=True, read_at=<timestamp>)

    Indexes:
        - (user, is_read)  — powers the unread count query and bell badge.
        - (user, sent_at)  — powers the paginated notification list.
    """

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="notifications",
        db_index=True,
        help_text="The user this notification belongs to.",
    )
    notification_type = models.CharField(
        max_length=50,
        choices=NotificationType.choices,
        db_index=True,
        help_text="Machine-readable type used for icon/color rendering on the frontend.",
    )
    title = models.CharField(
        max_length=255,
        help_text="Short heading shown in the notification bell dropdown.",
    )
    message = models.TextField(
        help_text="Full notification body text.",
    )
    action_url = models.CharField(
        max_length=500,
        blank=True,
        default="",
        help_text="Frontend route to navigate to when the notification is clicked, e.g. /my-learning.",
    )

    # ------------------------------------------------------------------
    # Source entity reference (for deep-linking and future audit trails)
    # ------------------------------------------------------------------
    entity_type = models.CharField(
        max_length=100,
        blank=True,
        default="",
        help_text="Model name of the source entity, e.g. UserCourseEnrollment.",
    )
    entity_id = models.CharField(
        max_length=50,
        blank=True,
        default="",
        help_text="Primary key of the source entity as a string.",
    )

    # ------------------------------------------------------------------
    # Read state
    # ------------------------------------------------------------------
    is_read = models.BooleanField(
        default=False,
        db_index=True,
        help_text="False until the user explicitly reads or dismisses the notification.",
    )
    read_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text="Timestamp when is_read was set to True. Null while unread.",
    )

    sent_at = models.DateTimeField(
        auto_now_add=True,
        db_index=True,
        help_text="Timestamp when the notification was created/delivered.",
    )

    class Meta:
        db_table = "notif_notification"
        verbose_name = "Notification"
        verbose_name_plural = "Notifications"
        ordering = ["-sent_at"]
        indexes = [
            models.Index(fields=["user", "is_read"], name="idx_notif_user_read"),
            models.Index(fields=["user", "sent_at"],  name="idx_notif_user_time"),
        ]

    def __str__(self):
        return f"[{self.notification_type}] {self.title} → {self.user_id}"

    # ------------------------------------------------------------------
    # Instance helpers
    # ------------------------------------------------------------------

    def mark_as_read(self) -> None:
        """
        Mark this notification as read and record the timestamp.
        Saves only the two changed fields for efficiency.
        """
        if not self.is_read:
            self.is_read = True
            self.read_at = timezone.now()
            self.save(update_fields=["is_read", "read_at"])
