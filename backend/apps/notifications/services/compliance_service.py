"""
ComplianceService — identifies expiring certificates and dispatches notifications.

Responsibilities:
    1. Find certificates expiring within the configured warning windows
       (default: 30 days and 7 days).
    2. Deduplicate — never send the same window notification twice on the same day.
    3. Dispatch per-employee COMPLIANCE_EXPIRY notifications.
    4. Dispatch a single COMPLIANCE_ALERT summary to all LMS_ADMIN users.

Rules:
    - This service is called exclusively by the management command.
    - It must never raise an exception that aborts the cron run.
    - Deduplication is done by checking whether a COMPLIANCE_EXPIRY notification
      for the same certificate already exists with sent_at on today's date.
    - Admin user resolution uses is_superuser as the fallback when no RBAC
      LMS_ADMIN role is assigned, so the command works even in a fresh install.
"""

import logging
from datetime import date, timedelta

from django.db.models import Q

logger = logging.getLogger(__name__)

# Warning windows in days — notifications are sent when expiry is within these thresholds.
EXPIRY_WINDOWS = [30, 7]


class ComplianceService:

    def __init__(self, notification_service=None):
        self._notification_service = notification_service

    @property
    def notification_service(self):
        if self._notification_service is None:
            from apps.notifications.services.notification_service import NotificationService
            self._notification_service = NotificationService()
        return self._notification_service

    # ------------------------------------------------------------------
    # Public entry point
    # ------------------------------------------------------------------

    def run_expiry_sweep(self, dry_run: bool = False) -> dict:
        """
        Main entry point called by the management command.

        Scans all certificates with a non-null expiry_date and dispatches
        notifications for those falling within any EXPIRY_WINDOWS threshold.

        Args:
            dry_run: If True, compute everything but send no notifications.
                     Useful for testing and --dry-run flag on the command.

        Returns:
            Summary dict:
            {
                "windows_checked": [30, 7],
                "employee_notifications_sent": int,
                "employee_notifications_skipped": int,   # already notified today
                "admin_alert_sent": bool,
                "total_expiring_count": int,
                "errors": int,
            }
        """
        today = date.today()
        summary = {
            "windows_checked": EXPIRY_WINDOWS,
            "employee_notifications_sent": 0,
            "employee_notifications_skipped": 0,
            "admin_alert_sent": False,
            "total_expiring_count": 0,
            "errors": 0,
        }

        # Collect all certificates expiring within the largest window
        expiring_certs = self._fetch_expiring_certificates(today, max(EXPIRY_WINDOWS))
        summary["total_expiring_count"] = len(expiring_certs)

        if not expiring_certs:
            logger.info("ComplianceService: no expiring certificates found.")
            return summary

        # Per-employee notifications
        for cert_data in expiring_certs:
            try:
                sent = self._process_certificate(cert_data, today, dry_run)
                if sent:
                    summary["employee_notifications_sent"] += 1
                else:
                    summary["employee_notifications_skipped"] += 1
            except Exception as exc:
                summary["errors"] += 1
                logger.error(
                    "ComplianceService: error processing cert_id=%s error=%s",
                    cert_data["cert_id"], exc,
                )

        # Admin summary alert — only if at least one notification was sent
        if summary["employee_notifications_sent"] > 0:
            try:
                admin_user_ids = self._get_admin_user_ids()
                if admin_user_ids and not dry_run:
                    self.notification_service.notify_compliance_alert_admin(
                        admin_user_ids=admin_user_ids,
                        expiring_count=summary["total_expiring_count"],
                    )
                    summary["admin_alert_sent"] = True
                    logger.info(
                        "ComplianceService: admin alert sent to %d admin(s).",
                        len(admin_user_ids),
                    )
            except Exception as exc:
                summary["errors"] += 1
                logger.error("ComplianceService: admin alert failed: %s", exc)

        return summary

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    def _fetch_expiring_certificates(self, today: date, max_days: int) -> list[dict]:
        """
        Return a flat list of dicts for all certificates expiring within max_days.

        Each dict contains everything the notification needs so we avoid
        repeated per-row DB queries inside the loop.
        """
        from apps.learning_progress.models import CourseCertificate

        cutoff = today + timedelta(days=max_days)

        certs = (
            CourseCertificate.objects
            .filter(
                expiry_date__isnull=False,
                expiry_date__gte=today,       # not already expired
                expiry_date__lte=cutoff,      # within the window
            )
            .select_related(
                "enrollment__employee__user",
                "enrollment__course",
            )
        )

        result = []
        for cert in certs:
            enrollment = cert.enrollment
            employee = enrollment.employee
            user_id = employee.user_id if employee else None
            if not user_id:
                continue  # employee has no linked user account — skip silently

            days_remaining = (cert.expiry_date - today).days
            result.append({
                "cert_id": cert.pk,
                "user_id": user_id,
                "course_title": enrollment.course.course_title,
                "course_id": enrollment.course_id,
                "expiry_date": cert.expiry_date,
                "days_remaining": days_remaining,
            })

        return result

    def _process_certificate(
        self, cert_data: dict, today: date, dry_run: bool
    ) -> bool:
        """
        Decide whether to send a notification for this certificate today.

        Deduplication logic:
            - A notification is sent only if the days_remaining falls within
              one of the EXPIRY_WINDOWS thresholds (30 or 7).
            - We check whether a COMPLIANCE_EXPIRY notification for this
              exact certificate (entity_id) was already sent today.
              If yes, skip to avoid duplicate alerts on repeated cron runs.

        Returns True if a notification was sent, False if skipped.
        """
        days_remaining = cert_data["days_remaining"]

        # Only notify on the exact threshold days (30 or 7), not every day
        if days_remaining not in EXPIRY_WINDOWS:
            return False

        # Deduplication: already notified today for this cert?
        if self._already_notified_today(cert_data["user_id"], cert_data["cert_id"], today):
            logger.debug(
                "ComplianceService: skipping cert_id=%s (already notified today)",
                cert_data["cert_id"],
            )
            return False

        if not dry_run:
            self.notification_service.notify_compliance_expiry(
                user_id=cert_data["user_id"],
                course_title=cert_data["course_title"],
                days_remaining=days_remaining,
                course_id=cert_data["course_id"],
            )

        logger.info(
            "ComplianceService: %s COMPLIANCE_EXPIRY for user_id=%s cert_id=%s "
            "days_remaining=%d",
            "[DRY RUN]" if dry_run else "sent",
            cert_data["user_id"],
            cert_data["cert_id"],
            days_remaining,
        )
        return True

    def _already_notified_today(
        self, user_id: int, cert_id: int, today: date
    ) -> bool:
        """
        Return True if a COMPLIANCE_EXPIRY notification for this cert was
        already created today for this user.
        """
        from apps.notifications.models import Notification
        from apps.notifications.constants import NotificationType

        return Notification.objects.filter(
            user_id=user_id,
            notification_type=NotificationType.COMPLIANCE_EXPIRY,
            entity_type="CourseCertificate",
            entity_id=str(cert_id),
            sent_at__date=today,
        ).exists()

    def _get_admin_user_ids(self) -> list[int]:
        """
        Resolve the list of AuthUser IDs that should receive the admin alert.

        Resolution order:
            1. Users with the LMS_ADMIN role code in UserRoleMaster (RBAC).
            2. Fallback: all is_superuser=True users (works on fresh installs).

        Returns a deduplicated list of user IDs.
        """
        from apps.auth_security.models import AuthUser

        user_ids: set[int] = set()

        # 1. RBAC-based admin lookup
        try:
            from apps.rbac.models import UserRoleMaster
            rbac_ids = (
                UserRoleMaster.objects
                .filter(role__role_code="LMS_ADMIN", is_active=True)
                .values_list("user_id", flat=True)
                .distinct()
            )
            user_ids.update(rbac_ids)
        except Exception as exc:
            logger.warning("ComplianceService: RBAC admin lookup failed: %s", exc)

        # 2. Superuser fallback
        if not user_ids:
            superuser_ids = (
                AuthUser.objects
                .filter(is_superuser=True, is_active=True)
                .values_list("id", flat=True)
            )
            user_ids.update(superuser_ids)

        return list(user_ids)
