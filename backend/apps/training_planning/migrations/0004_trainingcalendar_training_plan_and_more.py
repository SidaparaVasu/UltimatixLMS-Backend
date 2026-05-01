import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):
    """
    All columns, tables, and indexes added here already exist in the database
    from a prior direct operation. This migration only updates Django's internal
    state so subsequent migrations work correctly.
    """

    dependencies = [
        ('course_management', '0007_alter_courseparticipant_invited_by_and_more'),
        ('org_management', '0002_jobrolemaster_company_and_more'),
        ('skill_management', '0004_remove_employeeskillrating_uniq_employee_skill_rating_type_and_more'),
        ('training_planning', '0003_alter_trainingplanitem_course_and_more'),
    ]

    operations = [
        migrations.SeparateDatabaseAndState(
            database_operations=[],
            state_operations=[

                # ── TrainingPlan: 8 new fields ────────────────────────────────
                migrations.AddField(
                    model_name='trainingplan',
                    name='training_category',
                    field=models.CharField(blank=True, default='', max_length=100),
                ),
                migrations.AddField(
                    model_name='trainingplan',
                    name='training_provider',
                    field=models.CharField(blank=True, default='', max_length=255),
                ),
                migrations.AddField(
                    model_name='trainingplan',
                    name='training_scope',
                    field=models.TextField(blank=True, default=''),
                ),
                migrations.AddField(
                    model_name='trainingplan',
                    name='skills',
                    field=models.ManyToManyField(
                        blank=True,
                        related_name='training_plans',
                        to='skill_management.skillmaster',
                    ),
                ),
                migrations.AddField(
                    model_name='trainingplan',
                    name='budget_per_employee',
                    field=models.DecimalField(blank=True, decimal_places=2, max_digits=10, null=True),
                ),
                migrations.AddField(
                    model_name='trainingplan',
                    name='start_date',
                    field=models.DateField(blank=True, null=True),
                ),
                migrations.AddField(
                    model_name='trainingplan',
                    name='end_date',
                    field=models.DateField(blank=True, null=True),
                ),
                migrations.AddField(
                    model_name='trainingplan',
                    name='duration_hours',
                    field=models.DecimalField(blank=True, decimal_places=2, max_digits=6, null=True),
                ),

                # ── TrainingPlanApproval: submitted_by ────────────────────────
                migrations.AddField(
                    model_name='trainingplanapproval',
                    name='submitted_by',
                    field=models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name='submitted_plan_approvals',
                        to='org_management.employeemaster',
                    ),
                ),

                # ── TrainingCalendar: training_plan FK ────────────────────────
                migrations.AddField(
                    model_name='trainingcalendar',
                    name='training_plan',
                    field=models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name='calendars',
                        to='training_planning.trainingplan',
                    ),
                ),

                # ── TrainingSession: training_plan_item FK + index ────────────
                migrations.AddField(
                    model_name='trainingsession',
                    name='training_plan_item',
                    field=models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name='sessions',
                        to='training_planning.trainingplanitem',
                    ),
                ),
                migrations.AlterField(
                    model_name='trainingsession',
                    name='session_title',
                    field=models.CharField(max_length=255),
                ),
                migrations.AddIndex(
                    model_name='trainingsession',
                    index=models.Index(
                        fields=['training_plan_item'],
                        name='idx_tp_session_plan_item',
                    ),
                ),
            ],
        ),
    ]
