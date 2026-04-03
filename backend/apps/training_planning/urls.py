from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    TrainingPlanViewSet,
    TrainingPlanItemViewSet,
    TrainingPlanApprovalViewSet,
    TrainingCalendarViewSet,
    TrainingSessionViewSet,
    TrainingSessionTrainerViewSet,
    TrainingSessionEnrollmentViewSet,
    TrainingAttendanceViewSet
)

router = DefaultRouter()
router.register(r"plans", TrainingPlanViewSet, basename="tp_plans")
router.register(r"plan-items", TrainingPlanItemViewSet, basename="tp_plan_items")
router.register(r"plan-approvals", TrainingPlanApprovalViewSet, basename="tp_approvals")
router.register(r"calendars", TrainingCalendarViewSet, basename="tp_calendars")
router.register(r"sessions", TrainingSessionViewSet, basename="tp_sessions")
router.register(r"session-trainers", TrainingSessionTrainerViewSet, basename="tp_trainers")
router.register(r"enrollments", TrainingSessionEnrollmentViewSet, basename="tp_enrollments")
router.register(r"attendance", TrainingAttendanceViewSet, basename="tp_attendance")

urlpatterns = [
    path("", include(router.urls)),
]
