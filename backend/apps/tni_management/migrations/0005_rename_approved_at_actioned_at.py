"""
Migration: Rename TrainingNeedApproval.approved_at → actioned_at

The field records when an approval action was finalized (approve or reject).
Using a single neutral name avoids ambiguity for rejection timestamps.
"""

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("tni_management", "0004_alter_compliancetrainingrequirement_course_and_more"),
    ]

    operations = [
        migrations.RenameField(
            model_name="trainingneedapproval",
            old_name="approved_at",
            new_name="actioned_at",
        ),
    ]
