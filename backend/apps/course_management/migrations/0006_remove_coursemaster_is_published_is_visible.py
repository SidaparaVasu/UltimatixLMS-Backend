"""
Migration 0006 — remove dead columns is_published and is_visible from course_master.

These fields were never read by any view, service, or repository.
Visibility is fully controlled by the `status` field (DRAFT/PUBLISHED/ARCHIVED).
`is_active` handles soft-delete / admin disable.
"""

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('course_management', '0005_coursemaster_dates_marks_courseparticipant'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='coursemaster',
            name='is_published',
        ),
        migrations.RemoveField(
            model_name='coursemaster',
            name='is_visible',
        ),
    ]
