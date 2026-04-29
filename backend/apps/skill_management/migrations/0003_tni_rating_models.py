"""
Migration: TNI rating models

- Adds `identified_by` field to EmployeeSkill
- Creates EmployeeSkillRating (staging table for TNI cycle ratings)
- Creates EmployeeSkillRatingHistory (append-only audit log)
"""

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ("skill_management", "0002_delete_courseskillmapping"),
        ("org_management", "0001_initial"),
    ]

    operations = [
        # ── 1. Add identified_by to EmployeeSkill ──────────────────────────
        migrations.AddField(
            model_name="employeeskill",
            name="identified_by",
            field=models.CharField(
                choices=[
                    ("SELF",       "Self"),
                    ("MANAGER",    "Manager"),
                    ("SYSTEM",     "System"),
                    ("ASSESSMENT", "Assessment"),
                ],
                default="SELF",
                max_length=20,
                help_text="Who last set the current proficiency level.",
            ),
        ),

        # ── 2. Create EmployeeSkillRating ──────────────────────────────────
        migrations.CreateModel(
            name="EmployeeSkillRating",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                (
                    "employee",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="skill_ratings",
                        to="org_management.employeemaster",
                    ),
                ),
                (
                    "skill",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="employee_ratings",
                        to="skill_management.skillmaster",
                    ),
                ),
                (
                    "rated_by",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="given_skill_ratings",
                        to="org_management.employeemaster",
                        help_text="The person who performed the rating.",
                    ),
                ),
                (
                    "rated_level",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.PROTECT,
                        to="skill_management.skilllevelmaster",
                        help_text="The proficiency level assigned in this rating.",
                    ),
                ),
                (
                    "rating_type",
                    models.CharField(
                        choices=[("SELF", "Self"), ("MANAGER", "Manager")],
                        max_length=10,
                        help_text="Whether this is a self-rating or a manager-identified rating.",
                    ),
                ),
                (
                    "status",
                    models.CharField(
                        choices=[("DRAFT", "Draft"), ("SUBMITTED", "Submitted")],
                        default="DRAFT",
                        max_length=10,
                    ),
                ),
                (
                    "submitted_at",
                    models.DateTimeField(
                        blank=True,
                        null=True,
                        help_text="Timestamp when the rating was submitted. Null while in DRAFT.",
                    ),
                ),
                ("observations",    models.TextField(blank=True, default="")),
                ("accomplishments",  models.TextField(blank=True, default="")),
                ("notes",           models.CharField(blank=True, default="", max_length=500)),
                ("created_at",      models.DateTimeField(auto_now_add=True)),
                ("updated_at",      models.DateTimeField(auto_now=True)),
            ],
            options={
                "verbose_name": "Employee Skill Rating",
                "verbose_name_plural": "Employee Skill Ratings",
                "db_table": "employee_skill_rating",
                "ordering": ["-updated_at"],
            },
        ),
        migrations.AddConstraint(
            model_name="employeeskillrating",
            constraint=models.UniqueConstraint(
                fields=["employee", "skill", "rating_type"],
                name="uniq_employee_skill_rating_type",
            ),
        ),
        migrations.AddIndex(
            model_name="employeeskillrating",
            index=models.Index(fields=["employee"], name="idx_skill_rating_employee_id"),
        ),
        migrations.AddIndex(
            model_name="employeeskillrating",
            index=models.Index(fields=["skill"], name="idx_skill_rating_skill_id"),
        ),
        migrations.AddIndex(
            model_name="employeeskillrating",
            index=models.Index(fields=["status"], name="idx_skill_rating_status"),
        ),

        # ── 3. Create EmployeeSkillRatingHistory ───────────────────────────
        migrations.CreateModel(
            name="EmployeeSkillRatingHistory",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                (
                    "employee",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="skill_rating_history",
                        to="org_management.employeemaster",
                    ),
                ),
                (
                    "skill",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="rating_history",
                        to="skill_management.skillmaster",
                    ),
                ),
                (
                    "rated_by",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="given_rating_history",
                        to="org_management.employeemaster",
                    ),
                ),
                (
                    "old_level",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="rating_old_history",
                        to="skill_management.skilllevelmaster",
                        help_text="Level before this change. Null on first creation.",
                    ),
                ),
                (
                    "new_level",
                    models.ForeignKey(
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="rating_new_history",
                        to="skill_management.skilllevelmaster",
                        help_text="Level after this change.",
                    ),
                ),
                (
                    "rating_type",
                    models.CharField(
                        choices=[("SELF", "Self"), ("MANAGER", "Manager")],
                        max_length=10,
                    ),
                ),
                ("old_status",      models.CharField(blank=True, default="", max_length=10)),
                ("new_status",      models.CharField(max_length=10)),
                ("notes_snapshot",  models.CharField(blank=True, default="", max_length=500)),
                ("changed_at",      models.DateTimeField(auto_now_add=True)),
            ],
            options={
                "verbose_name": "Employee Skill Rating History",
                "verbose_name_plural": "Employee Skill Rating Histories",
                "db_table": "employee_skill_rating_history",
                "ordering": ["-changed_at"],
            },
        ),
        migrations.AddIndex(
            model_name="employeeskillratinghistory",
            index=models.Index(fields=["employee"],    name="idx_skill_rating_hist_emp"),
        ),
        migrations.AddIndex(
            model_name="employeeskillratinghistory",
            index=models.Index(fields=["skill"],       name="idx_skill_rating_hist_skill"),
        ),
        migrations.AddIndex(
            model_name="employeeskillratinghistory",
            index=models.Index(fields=["rating_type"], name="idx_skill_rating_hist_type"),
        ),
        migrations.AddIndex(
            model_name="employeeskillratinghistory",
            index=models.Index(fields=["changed_at"],  name="idx_skill_rating_hist_date"),
        ),
    ]
