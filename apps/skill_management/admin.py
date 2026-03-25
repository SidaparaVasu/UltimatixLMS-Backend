from django.contrib import admin
from .models import (
    SkillCategoryMaster,
    SkillMaster,
    SkillCategorySkillMap,
    SkillLevelMaster
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
