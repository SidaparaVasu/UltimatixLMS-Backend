"""
Migration: Add converted_from FK to FileRegistry and CONVERTING upload status.

- converted_from: OneToOneField pointing to the original PPT record
  (set on the resulting PDF record after conversion)
- CONVERTING: new FileUploadStatus choice for PPTs being processed
"""

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('file_management', '0001_initial'),
    ]

    operations = [
        # Add CONVERTING to upload_status choices
        migrations.AlterField(
            model_name='fileregistry',
            name='upload_status',
            field=models.CharField(
                choices=[
                    ('PENDING', 'Pending'),
                    ('UPLOADED', 'Uploaded'),
                    ('CONVERTING', 'Converting'),
                    ('FAILED', 'Failed'),
                ],
                default='PENDING',
                max_length=50,
            ),
        ),

        # Add converted_from FK
        migrations.AddField(
            model_name='fileregistry',
            name='converted_from',
            field=models.OneToOneField(
                blank=True,
                help_text='For PDF records that were converted from a PPT/PPTX, this points to the original.',
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='converted_pdf',
                to='file_management.fileregistry',
            ),
        ),
    ]
