from django.contrib import admin
from .models import Notification


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ("user", "notification_type", "title", "is_read", "sent_at")
    list_filter  = ("notification_type", "is_read", "sent_at")
    search_fields = ("user__email", "user__username", "title", "message")
    readonly_fields = ("user", "notification_type", "title", "message",
                       "action_url", "entity_type", "entity_id", "sent_at", "read_at")
    ordering = ("-sent_at",)

    def has_add_permission(self, request):
        # Notifications are created programmatically only — never via admin.
        return False
