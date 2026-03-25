from django.db import models


class SkillCategoryMaster(models.Model):
    """
    Stores high-level skill categories used for organizing skills.
    e.g. Technical, Soft Skills, Leadership.
    """
    category_name = models.CharField(
        max_length=100,
        help_text="Name of the skill category."
    )
    category_code = models.CharField(
        max_length=50,
        unique=True,
        db_index=True,
        help_text="Unique short code for the category."
    )
    description = models.CharField(
        max_length=255,
        blank=True,
        default=""
    )
    is_active = models.BooleanField(
        default=True,
        help_text="Soft-delete switch."
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "skill_category_master"
        verbose_name = "Skill Category"
        verbose_name_plural = "Skill Categories"
        ordering = ["category_name"]

    def __str__(self):
        return f"{self.category_name} ({self.category_code})"


class SkillMaster(models.Model):
    """
    Stores individual skills and supports hierarchical relationships.
    e.g. Programming -> Python -> Advanced Python
    """
    skill_name = models.CharField(
        max_length=150,
        help_text="Name of the skill."
    )
    skill_code = models.CharField(
        max_length=100,
        unique=True,
        db_index=True,
        help_text="Unique identifier for the skill."
    )
    parent_skill = models.ForeignKey(
        "self",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="child_skills",
        help_text="Parent skill for hierarchical structure."
    )
    description = models.CharField(
        max_length=255,
        blank=True,
        default=""
    )
    is_active = models.BooleanField(
        default=True,
        help_text="Soft-delete switch."
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "skill_master"
        verbose_name = "Skill"
        verbose_name_plural = "Skills"
        ordering = ["skill_name"]

    def __str__(self):
        return f"{self.skill_name} ({self.skill_code})"


class SkillCategorySkillMap(models.Model):
    """
    Maps skills to categories allowing a skill to belong to multiple categories.
    """
    skill = models.ForeignKey(
        SkillMaster,
        on_delete=models.CASCADE,
        related_name="category_mappings"
    )
    category = models.ForeignKey(
        SkillCategoryMaster,
        on_delete=models.CASCADE,
        related_name="skill_mappings"
    )
    is_active = models.BooleanField(
        default=True
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "skill_category_skill_map"
        unique_together = ["skill", "category"]
        verbose_name = "Skill-Category Mapping"
        verbose_name_plural = "Skill-Category Mappings"

    def __str__(self):
        return f"{self.skill.skill_name} -> {self.category.category_name}"


class SkillLevelMaster(models.Model):
    """
    Stores skill proficiency levels (e.g. Basic, Intermediate, Advanced).
    """
    level_name = models.CharField(
        max_length=50,
        help_text="Display name for the proficiency level."
    )
    level_rank = models.PositiveSmallIntegerField(
        help_text="Numeric rank used for skill gap analysis calculations (e.g. 1-5)."
    )
    description = models.CharField(
        max_length=255,
        blank=True,
        default=""
    )
    is_active = models.BooleanField(
        default=True
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "skill_level_master"
        verbose_name = "Skill Level"
        verbose_name_plural = "Skill Levels"
        ordering = ["level_rank"]
        indexes = [
             models.Index(fields=["level_rank"], name="idx_skill_level_rank"),
        ]

    def __str__(self):
        return f"Level {self.level_rank}: {self.level_name}"
