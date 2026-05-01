import django.db.models.deletion
import django.utils.timezone
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='Notification',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('notification_type', models.CharField(
                    choices=[
                        ('ENROLLMENT',          'Course Enrolled'),
                        ('COMPLETION',          'Course Completed'),
                        ('CERTIFICATE',         'Certificate Issued'),
                        ('ASSESSMENT_RESULT',   'Assessment Result'),
                        ('TNI_APPROVAL',        'Training Need Approved'),
                        ('TNI_REJECTION',       'Training Need Rejected'),
                        ('TNI_PENDING_REVIEW',  'Training Need Pending Review'),
                        ('SKILL_RATING',        'Skill Rating Submitted'),
                        ('RATING_CYCLE_OPEN',   'Rating Cycle Opened'),
                        ('PLAN_PENDING_APPROVAL', 'Training Plan Pending Approval'),
                        ('PLAN_APPROVED',       'Training Plan Approved'),
                        ('PLAN_REJECTED',       'Training Plan Rejected'),
                        ('SESSION_ENROLLED',    'Training Session Enrolled'),
                        ('SESSION_REMINDER',    'Training Session Reminder'),
                        ('COMPLIANCE_EXPIRY',   'Compliance Training Expiring'),
                        ('COMPLIANCE_ALERT',    'Compliance Alert (Admin)'),
                        ('NEW_ENROLLMENT',      'New Enrollment (Admin)'),
                        ('TEAM_COMPLETION',     'Team Member Completed Course'),
                    ],
                    db_index=True,
                    max_length=50,
                    help_text='Machine-readable type used for icon/color rendering on the frontend.',
                )),
                ('title', models.CharField(
                    max_length=255,
                    help_text='Short heading shown in the notification bell dropdown.',
                )),
                ('message', models.TextField(
                    help_text='Full notification body text.',
                )),
                ('action_url', models.CharField(
                    blank=True,
                    default='',
                    max_length=500,
                    help_text='Frontend route to navigate to when the notification is clicked.',
                )),
                ('entity_type', models.CharField(
                    blank=True,
                    default='',
                    max_length=100,
                    help_text='Model name of the source entity.',
                )),
                ('entity_id', models.CharField(
                    blank=True,
                    default='',
                    max_length=50,
                    help_text='Primary key of the source entity as a string.',
                )),
                ('is_read', models.BooleanField(
                    db_index=True,
                    default=False,
                    help_text='False until the user explicitly reads or dismisses the notification.',
                )),
                ('read_at', models.DateTimeField(
                    blank=True,
                    null=True,
                    help_text='Timestamp when is_read was set to True.',
                )),
                ('sent_at', models.DateTimeField(
                    auto_now_add=True,
                    db_index=True,
                    help_text='Timestamp when the notification was created/delivered.',
                )),
                ('user', models.ForeignKey(
                    help_text='The user this notification belongs to.',
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='notifications',
                    to=settings.AUTH_USER_MODEL,
                )),
            ],
            options={
                'verbose_name': 'Notification',
                'verbose_name_plural': 'Notifications',
                'db_table': 'notif_notification',
                'ordering': ['-sent_at'],
            },
        ),
        migrations.AddIndex(
            model_name='notification',
            index=models.Index(fields=['user', 'is_read'], name='idx_notif_user_read'),
        ),
        migrations.AddIndex(
            model_name='notification',
            index=models.Index(fields=['user', 'sent_at'], name='idx_notif_user_time'),
        ),
    ]
