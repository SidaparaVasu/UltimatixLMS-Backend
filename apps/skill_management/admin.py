from django.contrib import admin
from .models import (
    SkillCategoryMaster,
    SkillMaster,
    SkillCategorySkillMap,
    SkillLevelMaster,
    JobRoleSkillRequirement
)


@admin.register(SkillCategoryMaster)
class SkillCategoryAdmin(admin.ModelAdmin):
    list_display = ("category_name", "category_code", "is_active", "created_at")
    search_fields = ("category_name", "category_code")
    list_filter = ("is_active",)


@admin.register(SkillMaster)
class SkillMasterAdmin(admin.ModelAdmin):
    list_display = ("skill_name", "skill_code", "parent_skill", "is_active", "created_at")
    search_fields = ("skill_name", "skill_code")
    list_filter = ("is_active", "parent_skill")
    autocomplete_fields = ["parent_skill"]


@admin.register(SkillCategorySkillMap)
class SkillCategoryMappingAdmin(admin.ModelAdmin):
    list_display = ("skill", "category", "is_active", "created_at")
    search_fields = ("skill__skill_name", "category__category_name")
    list_filter = ("is_active", "category")


@admin.register(SkillLevelMaster)
class SkillLevelAdmin(admin.ModelAdmin):
    list_display = ("level_name", "level_rank", "is_active", "created_at")
    search_fields = ("level_name",)
    list_filter = ("is_active",)
    ordering = ("level_rank",)


@admin.register(JobRoleSkillRequirement)
class JobRoleSkillRequirementAdmin(admin.ModelAdmin):
    list_display = ("job_role", "skill", "required_level", "is_active", "created_at")
    search_fields = ("job_role__job_role_name", "skill__skill_name")
    list_filter = ("is_active", "job_role", "required_level")
