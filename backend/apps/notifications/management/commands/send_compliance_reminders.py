"""
Management command: send_compliance_reminders

Scans all CourseCertificate records with a non-null expiry_date and sends
COMPLIANCE_EXPIRY notifications to employees whose certificates are expiring
within the configured warning windows (default: 30 days and 7 days).

Also sends a single COMPLIANCE_ALERT summary notification to all LMS_ADMIN users.

Usage:
    # Normal run (sends real notifications)
    python manage.py send_compliance_reminders

    # Dry run — computes everything, sends nothing, prints what would happen
    python manage.py send_compliance_reminders --dry-run

    # Override warning windows (comma-separated days)
    python manage.py send_compliance_reminders --windows 30,14,7

Scheduling (no celery required):
    Add to the OS cron table to run once daily at 08:00 IST:

        # crontab -e
        0 8 * * * /path/to/venv/bin/python /path/to/backend/manage.py send_compliance_reminders >> /var/log/lms_compliance.log 2>&1

    Or use Windows Task Scheduler for Windows Server deployments.

Exit codes:
    0 — completed successfully (even if 0 notifications were sent)
    1 — command aborted due to an unexpected error
"""

import logging

from django.core.management.base import BaseCommand, CommandError

from apps.notifications.services.compliance_service import (
    ComplianceService,
    EXPIRY_WINDOWS,
)

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = (
        "Send compliance training expiry notifications to employees and "
        "a summary alert to LMS admins. Safe to run daily via cron."
    )

    def add_arguments(self, parser):
        parser.add_argument(
            "--dry-run",
            action="store_true",
            default=False,
            help=(
                "Simulate the sweep without sending any notifications. "
                "Prints what would be sent."
            ),
        )
        parser.add_argument(
            "--windows",
            type=str,
            default=",".join(str(w) for w in EXPIRY_WINDOWS),
            help=(
                "Comma-separated list of day thresholds for expiry warnings. "
                f"Default: {','.join(str(w) for w in EXPIRY_WINDOWS)}"
            ),
        )

    def handle(self, *args, **options):
        dry_run: bool = options["dry_run"]
        raw_windows: str = options["windows"]

        # ── Parse and validate --windows argument ────────────────────────
        try:
            windows = [int(w.strip()) for w in raw_windows.split(",") if w.strip()]
            if not windows or any(w <= 0 for w in windows):
                raise ValueError("All window values must be positive integers.")
        except ValueError as exc:
            raise CommandError(f"Invalid --windows value: {exc}") from exc

        # ── Header ────────────────────────────────────────────────────────
        mode_label = "[DRY RUN] " if dry_run else ""
        self.stdout.write(
            self.style.MIGRATE_HEADING(
                f"\n{mode_label}Compliance Expiry Sweep"
            )
        )
        self.stdout.write(f"  Warning windows : {windows} days")
        self.stdout.write(f"  Dry run         : {dry_run}")
        self.stdout.write("")

        # ── Run the sweep ─────────────────────────────────────────────────
        try:
            # Patch the service's window list if overridden via --windows
            import apps.notifications.services.compliance_service as cs_module
            original_windows = cs_module.EXPIRY_WINDOWS
            cs_module.EXPIRY_WINDOWS = windows

            svc = ComplianceService()
            summary = svc.run_expiry_sweep(dry_run=dry_run)

            # Restore original windows (important for tests that import the module)
            cs_module.EXPIRY_WINDOWS = original_windows

        except Exception as exc:
            logger.exception("send_compliance_reminders: unexpected error: %s", exc)
            raise CommandError(f"Sweep aborted due to unexpected error: {exc}") from exc

        # ── Print summary ─────────────────────────────────────────────────
        self.stdout.write(self.style.SUCCESS("  Sweep complete"))
        self.stdout.write(f"  Windows checked              : {summary['windows_checked']}")
        self.stdout.write(f"  Certificates expiring        : {summary['total_expiring_count']}")
        self.stdout.write(f"  Employee notifications sent  : {summary['employee_notifications_sent']}")
        self.stdout.write(f"  Employee notifications skipped (already sent today): {summary['employee_notifications_skipped']}")
        self.stdout.write(f"  Admin alert sent             : {summary['admin_alert_sent']}")

        if summary["errors"] > 0:
            self.stdout.write(
                self.style.WARNING(
                    f"  Errors encountered           : {summary['errors']} "
                    "(check logs for details)"
                )
            )
        else:
            self.stdout.write(f"  Errors                       : 0")

        self.stdout.write("")

        # Log structured summary for monitoring / log aggregators
        logger.info(
            "send_compliance_reminders completed: dry_run=%s sent=%d skipped=%d "
            "admin_alert=%s errors=%d total_expiring=%d",
            dry_run,
            summary["employee_notifications_sent"],
            summary["employee_notifications_skipped"],
            summary["admin_alert_sent"],
            summary["errors"],
            summary["total_expiring_count"],
        )
