"""
Management command: send_session_reminders

Sends SESSION_REMINDER notifications to all employees enrolled in a
TrainingSession that starts within the next 24 hours.

Usage:
    # Normal run
    python manage.py send_session_reminders

    # Dry run — prints what would be sent, sends nothing
    python manage.py send_session_reminders --dry-run

    # Override the look-ahead window (default: 24 hours)
    python manage.py send_session_reminders --hours-ahead 48

Scheduling:
    Run once daily, e.g. at 07:00 IST so reminders arrive before the workday:

        # crontab -e
        0 7 * * * /path/to/venv/bin/python /path/to/backend/manage.py send_session_reminders >> /var/log/lms_session_reminders.log 2>&1

Exit codes:
    0 — completed successfully
    1 — aborted due to unexpected error
"""

import logging
from datetime import timedelta

from django.core.management.base import BaseCommand, CommandError
from django.utils import timezone

logger = logging.getLogger(__name__)

# Default look-ahead window in hours
DEFAULT_HOURS_AHEAD = 24


class Command(BaseCommand):
    help = (
        "Send SESSION_REMINDER notifications to employees enrolled in "
        "training sessions starting within the next N hours."
    )

    def add_arguments(self, parser):
        parser.add_argument(
            "--dry-run",
            action="store_true",
            default=False,
            help="Simulate without sending any notifications.",
        )
        parser.add_argument(
            "--hours-ahead",
            type=int,
            default=DEFAULT_HOURS_AHEAD,
            help=(
                f"Look-ahead window in hours. "
                f"Default: {DEFAULT_HOURS_AHEAD}"
            ),
        )

    def handle(self, *args, **options):
        dry_run: bool = options["dry_run"]
        hours_ahead: int = options["hours_ahead"]

        if hours_ahead <= 0:
            raise CommandError("--hours-ahead must be a positive integer.")

        mode_label = "[DRY RUN] " if dry_run else ""
        self.stdout.write(
            self.style.MIGRATE_HEADING(
                f"\n{mode_label}Session Reminder Sweep"
            )
        )
        self.stdout.write(f"  Look-ahead window : {hours_ahead} hours")
        self.stdout.write(f"  Dry run           : {dry_run}")
        self.stdout.write("")

        try:
            summary = self._run_sweep(dry_run=dry_run, hours_ahead=hours_ahead)
        except Exception as exc:
            logger.exception("send_session_reminders: unexpected error: %s", exc)
            raise CommandError(f"Sweep aborted: {exc}") from exc

        self.stdout.write(self.style.SUCCESS("  Sweep complete"))
        self.stdout.write(f"  Sessions in window       : {summary['sessions_found']}")
        self.stdout.write(f"  Notifications sent       : {summary['sent']}")
        self.stdout.write(f"  Notifications skipped    : {summary['skipped']}")

        if summary["errors"] > 0:
            self.stdout.write(
                self.style.WARNING(
                    f"  Errors                   : {summary['errors']} "
                    "(check logs for details)"
                )
            )
        else:
            self.stdout.write(f"  Errors                   : 0")

        self.stdout.write("")

        logger.info(
            "send_session_reminders completed: dry_run=%s sessions=%d sent=%d "
            "skipped=%d errors=%d",
            dry_run,
            summary["sessions_found"],
            summary["sent"],
            summary["skipped"],
            summary["errors"],
        )

    # ------------------------------------------------------------------
    # Sweep logic (kept in the command for simplicity — no separate
    # service needed since this is a single, focused query)
    # ------------------------------------------------------------------

    def _run_sweep(self, dry_run: bool, hours_ahead: int) -> dict:
        from apps.training_planning.models import TrainingSessionEnrollment
        from apps.notifications.models import Notification
        from apps.notifications.constants import NotificationType
        from apps.notifications.services.notification_service import NotificationService

        now = timezone.now()
        window_end = now + timedelta(hours=hours_ahead)
        today = now.date()

        summary = {
            "sessions_found": 0,
            "sent": 0,
            "skipped": 0,
            "errors": 0,
        }

        svc = NotificationService()

        # Fetch all enrollments whose session starts within the window
        enrollments = (
            TrainingSessionEnrollment.objects
            .filter(
                training_session__session_start_date__gte=now,
                training_session__session_start_date__lte=window_end,
                enrollment_status="ENROLLED",
            )
            .select_related(
                "training_session",
                "employee__user",
            )
        )

        # Track unique session IDs for the sessions_found count
        session_ids_seen: set[int] = set()

        for enrollment in enrollments:
            session = enrollment.training_session
            session_ids_seen.add(session.pk)
            employee = enrollment.employee
            user_id = employee.user_id if employee else None

            if not user_id:
                continue

            try:
                # Deduplication: already reminded today for this session?
                already_sent = Notification.objects.filter(
                    user_id=user_id,
                    notification_type=NotificationType.SESSION_REMINDER,
                    entity_type="TrainingSession",
                    entity_id=str(session.pk),
                    sent_at__date=today,
                ).exists()

                if already_sent:
                    summary["skipped"] += 1
                    continue

                session_time = session.session_start_date.strftime("%I:%M %p")

                if not dry_run:
                    svc.notify_session_reminder(
                        user_id=user_id,
                        session_title=session.session_title,
                        session_time=session_time,
                        session_id=session.pk,
                    )

                logger.info(
                    "send_session_reminders: %s SESSION_REMINDER user_id=%s session_id=%s",
                    "[DRY RUN]" if dry_run else "sent",
                    user_id,
                    session.pk,
                )
                summary["sent"] += 1

            except Exception as exc:
                summary["errors"] += 1
                logger.error(
                    "send_session_reminders: error for enrollment_id=%s error=%s",
                    enrollment.pk, exc,
                )

        summary["sessions_found"] = len(session_ids_seen)
        return summary
