from rest_framework import serializers
from .models import FileRegistry
from .constants import FileType


class FileRegistrySerializer(serializers.ModelSerializer):
    """
    Standard serializer for FileRegistry records.

    Extra computed fields:
      - file_url: the /media/... URL (for internal use only — not exposed to learners)
      - converted_pdf_ref: UUID of the converted PDF record (for PPT files)
      - is_pdf_ready: True if the file can be served as PDF (either IS a PDF, or has a converted PDF)
    """
    file_url = serializers.SerializerMethodField()
    uploader_name = serializers.CharField(
        source="uploaded_by.user.get_full_name", read_only=True
    )
    converted_pdf_ref = serializers.SerializerMethodField()
    is_pdf_ready = serializers.SerializerMethodField()

    class Meta:
        model = FileRegistry
        fields = [
            "id", "original_name", "file", "file_url", "file_type",
            "size_bytes", "upload_status", "uploaded_by", "uploader_name",
            "converted_from", "converted_pdf_ref", "is_pdf_ready",
            "created_at",
        ]
        read_only_fields = [
            "id", "file_type", "size_bytes", "upload_status",
            "converted_from", "created_at",
        ]

    def get_file_url(self, obj):
        if obj.file:
            return obj.file.url
        return None

    def get_converted_pdf_ref(self, obj):
        """
        For PPT records: returns the UUID of the converted PDF FileRegistry.
        For PDF records: returns None.
        """
        if obj.file_type == FileType.PPT:
            try:
                return str(obj.converted_pdf.pk)
            except FileRegistry.DoesNotExist:
                return None
        return None

    def get_is_pdf_ready(self, obj):
        """
        True if this file can be served as a PDF right now.
        """
        return obj.effective_pdf is not None
