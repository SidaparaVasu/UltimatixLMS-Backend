from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    SkillCategoryViewSet,
    SkillMasterViewSet,
    SkillCategoryMappingViewSet,
    SkillLevelViewSet,
    JobRoleSkillRequirementViewSet
)

router = DefaultRouter()
router.register("skill-categories", SkillCategoryViewSet, basename="skill-categories")
router.register("skills", SkillMasterViewSet, basename="skills")
router.register("skill-mappings", SkillCategoryMappingViewSet, basename="skill-mappings")
router.register("skill-levels", SkillLevelViewSet, basename="skill-levels")
router.register("role-requirements", JobRoleSkillRequirementViewSet, basename="role-requirements")

urlpatterns = [
    path("", include(router.urls)),
]
