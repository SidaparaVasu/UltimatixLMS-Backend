from django.contrib import admin
from .models import (
    TrainingPlan,
    TrainingPlanItem,
    TrainingPlanApproval,
    TrainingCalendar,
    TrainingSession,
    TrainingSessionTrainer,
    TrainingSessionEnrollment,
    TrainingAttendance
)


class TrainingPlanItemInline(admin.TabularInline):
    model = TrainingPlanItem
    extra = 1


@admin.register(TrainingPlan)
class TrainingPlanAdmin(admin.ModelAdmin):
    list_display = ("plan_name", "year", "department", "status", "created_at")
    list_filter = ("status", "year", "department")
    search_fields = ("plan_name", "department__department_name")
    inlines = [TrainingPlanItemInline]
    autocomplete_fields = ["department", "created_by"]


@admin.register(TrainingPlanItem)
class TrainingPlanItemAdmin(admin.ModelAdmin):
    list_display = ("training_plan", "course_id", "target_department", "planned_participants", "priority")
    list_filter = ("priority", "target_department")
    search_fields = ("training_plan__plan_name", "course_id")


@admin.register(TrainingPlanApproval)
class TrainingPlanApprovalAdmin(admin.ModelAdmin):
    list_display = ("training_plan", "approver", "approval_status", "approved_at")
    list_filter = ("approval_status", "approved_at")
    search_fields = ("training_plan__plan_name", "approver__employee_code")


@admin.register(TrainingCalendar)
class TrainingCalendarAdmin(admin.ModelAdmin):
    list_display = ("year", "department", "created_by", "created_at")
    list_filter = ("year", "department")
    search_fields = ("department__department_name",)


class TrainingSessionTrainerInline(admin.TabularInline):
    model = TrainingSessionTrainer
    extra = 1


class TrainingSessionEnrollmentInline(admin.TabularInline):
    model = TrainingSessionEnrollment
    extra = 1


@admin.register(TrainingSession)
class TrainingSessionAdmin(admin.ModelAdmin):
    list_display = ("session_title", "session_type", "session_start_date", "capacity", "calendar")
    list_filter = ("session_type", "session_start_date", "calendar__department")
    search_fields = ("session_title", "location", "course_id")
    inlines = [TrainingSessionTrainerInline, TrainingSessionEnrollmentInline]
    ordering = ("-session_start_date",)


@admin.register(TrainingSessionTrainer)
class TrainingSessionTrainerAdmin(admin.ModelAdmin):
    list_display = ("training_session", "trainer", "assigned_at")
    search_fields = ("training_session__session_title", "trainer__employee_code")


@admin.register(TrainingSessionEnrollment)
class TrainingSessionEnrollmentAdmin(admin.ModelAdmin):
    list_display = ("training_session", "employee", "enrollment_status", "enrolled_at")
    list_filter = ("enrollment_status", "enrolled_at")
    search_fields = ("training_session__session_title", "employee__employee_code")


@admin.register(TrainingAttendance)
class TrainingAttendanceAdmin(admin.ModelAdmin):
    list_display = ("training_session", "employee", "attendance_status", "recorded_at")
    list_filter = ("attendance_status", "recorded_at")
    search_fields = ("training_session__session_title", "employee__employee_code")
