from rest_framework import serializers
from .models import (
    SkillCategoryMaster,
    SkillMaster,
    SkillCategorySkillMap,
    SkillLevelMaster
)


class SkillCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = SkillCategoryMaster
        fields = "__all__"


class SkillMasterSerializer(serializers.ModelSerializer):
    parent_skill_name = serializers.CharField(source="parent_skill.skill_name", read_only=True)

    class Meta:
        model = SkillMaster
        fields = "__all__"


class SkillCategoryMappingSerializer(serializers.ModelSerializer):
    skill_name = serializers.CharField(source="skill.skill_name", read_only=True)
    category_name = serializers.CharField(source="category.category_name", read_only=True)

    class Meta:
        model = SkillCategorySkillMap
        fields = "__all__"


class SkillLevelSerializer(serializers.ModelSerializer):
    class Meta:
        model = SkillLevelMaster
        fields = "__all__"


class SkillDetailSerializer(SkillMasterSerializer):
    """
    Serializer providing nested mappings or child skills for detailed views.
    """
    child_skills = serializers.SerializerMethodField()

    def get_child_skills(self, obj):
        children = obj.child_skills.filter(is_active=True)
        return SkillMasterSerializer(children, many=True).data
