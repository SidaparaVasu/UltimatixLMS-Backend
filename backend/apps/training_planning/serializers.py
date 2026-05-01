from rest_framework import serializers
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


class TrainingPlanSerializer(serializers.ModelSerializer):
    department_name  = serializers.CharField(source="department.department_name", read_only=True)
    created_by       = serializers.PrimaryKeyRelatedField(read_only=True)
    created_by_name  = serializers.SerializerMethodField()
    skill_names      = serializers.SerializerMethodField()
    items_count      = serializers.SerializerMethodField()
    last_rejection   = serializers.SerializerMethodField()

    class Meta:
        model = TrainingPlan
        fields = "__all__"

    @staticmethod
    def _employee_full_name(employee):
        if not employee:
            return None
        try:
            profile = employee.user.profile
            return f"{profile.first_name} {profile.last_name}".strip() or employee.user.username
        except Exception:
            return employee.user.username

    def get_created_by_name(self, obj):
        return self._employee_full_name(obj.created_by)

    def get_skill_names(self, obj):
        return list(obj.skills.values_list("skill_name", flat=True))

    def get_items_count(self, obj):
        return obj.items.count()

    def get_last_rejection(self, obj):
        rejection = obj.approvals.filter(
            approval_status='REJECTED'
        ).order_by('-approved_at').first()
        if not rejection:
            return None
        return {
            'comments':      rejection.comments,
            'approver_name': self._employee_full_name(rejection.approver),
            'rejected_at':   rejection.approved_at.isoformat() if rejection.approved_at else None,
        }


class TrainingPlanItemSerializer(serializers.ModelSerializer):
    plan_name               = serializers.CharField(source="training_plan.plan_name", read_only=True)
    target_department_name  = serializers.CharField(source="target_department.department_name", read_only=True)
    course_title            = serializers.CharField(source="course.course_title", read_only=True, default=None)

    class Meta:
        model = TrainingPlanItem
        fields = "__all__"


class TrainingPlanApprovalSerializer(serializers.ModelSerializer):
    approver_name     = serializers.SerializerMethodField()
    submitted_by_name = serializers.SerializerMethodField()
    training_plan_name       = serializers.CharField(source="training_plan.plan_name", read_only=True)
    training_plan_year       = serializers.IntegerField(source="training_plan.year", read_only=True)
    training_plan_department = serializers.CharField(source="training_plan.department.department_name", read_only=True)

    class Meta:
        model = TrainingPlanApproval
        fields = "__all__"

    @staticmethod
    def _employee_full_name(employee):
        if not employee:
            return None
        try:
            profile = employee.user.profile
            return f"{profile.first_name} {profile.last_name}".strip() or employee.user.username
        except Exception:
            return employee.user.username

    def get_approver_name(self, obj):
        return self._employee_full_name(obj.approver)

    def get_submitted_by_name(self, obj):
        return self._employee_full_name(obj.submitted_by)


class TrainingCalendarSerializer(serializers.ModelSerializer):
    department_name = serializers.CharField(source="department.department_name", read_only=True)
    created_by      = serializers.PrimaryKeyRelatedField(read_only=True)

    class Meta:
        model = TrainingCalendar
        fields = "__all__"


class TrainingSessionSerializer(serializers.ModelSerializer):
    current_enrollments     = serializers.SerializerMethodField()
    course_title            = serializers.CharField(source="course.course_title", read_only=True, default=None)
    training_plan_item_name = serializers.CharField(source="training_plan_item.course.course_title", read_only=True, default=None)

    class Meta:
        model = TrainingSession
        fields = "__all__"

    def get_current_enrollments(self, obj):
        from .constants import EnrollmentStatus
        return obj.enrollments.filter(enrollment_status=EnrollmentStatus.ENROLLED).count()


class TrainingSessionTrainerSerializer(serializers.ModelSerializer):
    trainer_name = serializers.SerializerMethodField()

    class Meta:
        model = TrainingSessionTrainer
        fields = "__all__"

    def get_trainer_name(self, obj):
        if not obj.trainer:
            return None
        try:
            profile = obj.trainer.user.profile
            return f"{profile.first_name} {profile.last_name}".strip() or obj.trainer.user.username
        except Exception:
            return obj.trainer.user.username


class TrainingSessionEnrollmentSerializer(serializers.ModelSerializer):
    employee_name  = serializers.SerializerMethodField()
    employee_code  = serializers.CharField(source="employee.employee_code", read_only=True)
    session_title  = serializers.CharField(source="training_session.session_title", read_only=True)

    class Meta:
        model = TrainingSessionEnrollment
        fields = "__all__"

    def get_employee_name(self, obj):
        if not obj.employee:
            return None
        try:
            profile = obj.employee.user.profile
            return f"{profile.first_name} {profile.last_name}".strip() or obj.employee.user.username
        except Exception:
            return obj.employee.user.username


class TrainingAttendanceSerializer(serializers.ModelSerializer):
    employee_name = serializers.SerializerMethodField()
    employee_code = serializers.CharField(source="employee.employee_code", read_only=True)

    class Meta:
        model = TrainingAttendance
        fields = "__all__"

    def get_employee_name(self, obj):
        if not obj.employee:
            return None
        try:
            profile = obj.employee.user.profile
            return f"{profile.first_name} {profile.last_name}".strip() or obj.employee.user.username
        except Exception:
            return obj.employee.user.username
