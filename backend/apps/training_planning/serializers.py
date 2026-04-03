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
    department_name = serializers.CharField(source="department.department_name", read_only=True)
    created_by_name = serializers.CharField(source="created_by.user.get_full_name", read_only=True)

    class Meta:
        model = TrainingPlan
        fields = "__all__"


class TrainingPlanItemSerializer(serializers.ModelSerializer):
    plan_name = serializers.CharField(source="training_plan.plan_name", read_only=True)
    target_department_name = serializers.CharField(source="target_department.department_name", read_only=True)

    class Meta:
        model = TrainingPlanItem
        fields = "__all__"


class TrainingPlanApprovalSerializer(serializers.ModelSerializer):
    approver_name = serializers.CharField(source="approver.user.get_full_name", read_only=True)

    class Meta:
        model = TrainingPlanApproval
        fields = "__all__"


class TrainingCalendarSerializer(serializers.ModelSerializer):
    department_name = serializers.CharField(source="department.department_name", read_only=True)

    class Meta:
        model = TrainingCalendar
        fields = "__all__"


class TrainingSessionSerializer(serializers.ModelSerializer):
    current_enrollments = serializers.SerializerMethodField()

    class Meta:
        model = TrainingSession
        fields = "__all__"

    def get_current_enrollments(self, obj):
        from .constants import EnrollmentStatus
        return obj.enrollments.filter(enrollment_status=EnrollmentStatus.ENROLLED).count()


class TrainingSessionTrainerSerializer(serializers.ModelSerializer):
    trainer_name = serializers.CharField(source="trainer.user.get_full_name", read_only=True)

    class Meta:
        model = TrainingSessionTrainer
        fields = "__all__"


class TrainingSessionEnrollmentSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source="employee.user.get_full_name", read_only=True)
    employee_code = serializers.CharField(source="employee.employee_code", read_only=True)
    session_title = serializers.CharField(source="training_session.session_title", read_only=True)

    class Meta:
        model = TrainingSessionEnrollment
        fields = "__all__"


class TrainingAttendanceSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source="employee.user.get_full_name", read_only=True)

    class Meta:
        model = TrainingAttendance
        fields = "__all__"
