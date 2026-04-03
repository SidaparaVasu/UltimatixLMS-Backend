from django.db import models


class TrainingPlanStatus(models.TextChoices):
    DRAFT = "DRAFT", "Draft"
    PENDING_APPROVAL = "PENDING_APPROVAL", "Pending Approval"
    APPROVED = "APPROVED", "Approved"
    ACTIVE = "ACTIVE", "Active"
    COMPLETED = "COMPLETED", "Completed"


class TrainingPlanPriority(models.TextChoices):
    LOW = "LOW", "Low"
    MEDIUM = "MEDIUM", "Medium"
    HIGH = "HIGH", "High"


class TrainingApprovalStatus(models.TextChoices):
    PENDING = "PENDING", "Pending"
    APPROVED = "APPROVED", "Approved"
    REJECTED = "REJECTED", "Rejected"


class TrainingSessionType(models.TextChoices):
    ONLINE = "ONLINE", "Online"
    OFFLINE = "OFFLINE", "Offline"
    HYBRID = "HYBRID", "Hybrid"
    SELF_PACED = "SELF_PACED", "Self Paced"


class EnrollmentStatus(models.TextChoices):
    ENROLLED = "ENROLLED", "Enrolled"
    WAITLIST = "WAITLIST", "Waitlist"
    CANCELLED = "CANCELLED", "Cancelled"


class AttendanceStatus(models.TextChoices):
    PRESENT = "PRESENT", "Present"
    ABSENT = "ABSENT", "Absent"
    PARTIAL = "PARTIAL", "Partial"
