from common.repositories.base import BaseRepository
from ..models import (
    SkillCategoryMaster,
    SkillMaster,
    SkillCategorySkillMap,
    SkillLevelMaster,
    JobRoleSkillRequirement,
    EmployeeSkill,
    EmployeeSkillHistory,
    EmployeeSkillAssessment,
    CourseSkillMapping
)


class SkillCategoryRepository(BaseRepository[SkillCategoryMaster]):
    model = SkillCategoryMaster


class SkillRepository(BaseRepository[SkillMaster]):
    model = SkillMaster

    def get_children(self, parent_id):
        """Fetch all child skills for a given parent."""
        return self.filter(parent_skill_id=parent_id, is_active=True)


class SkillCategoryMappingRepository(BaseRepository[SkillCategorySkillMap]):
    model = SkillCategorySkillMap


class SkillLevelRepository(BaseRepository[SkillLevelMaster]):
    model = SkillLevelMaster


class JobRoleSkillRepository(BaseRepository[JobRoleSkillRequirement]):
    model = JobRoleSkillRequirement


class EmployeeSkillRepository(BaseRepository[EmployeeSkill]):
    model = EmployeeSkill


class EmployeeSkillHistoryRepository(BaseRepository[EmployeeSkillHistory]):
    model = EmployeeSkillHistory


class EmployeeSkillAssessmentRepository(BaseRepository[EmployeeSkillAssessment]):
    model = EmployeeSkillAssessment


class CourseSkillMappingRepository(BaseRepository[CourseSkillMapping]):
    model = CourseSkillMapping
