from common.services.base import BaseService
from ..repositories import (
    SkillCategoryRepository,
    SkillRepository,
    SkillCategoryMappingRepository,
    SkillLevelRepository,
    JobRoleSkillRepository,
    EmployeeSkillRepository,
    EmployeeSkillHistoryRepository,
    EmployeeSkillAssessmentRepository
)


class SkillCategoryService(BaseService):
    repository_class = SkillCategoryRepository


class SkillService(BaseService):
    repository_class = SkillRepository

    def get_skill_tree(self):
        """Fetch root level skills."""
        return self.repository.filter(parent_skill=None, is_active=True)


class SkillCategoryMappingService(BaseService):
    repository_class = SkillCategoryMappingRepository


class SkillLevelService(BaseService):
    repository_class = SkillLevelRepository


class JobRoleSkillService(BaseService):
    repository_class = JobRoleSkillRepository


class EmployeeSkillService(BaseService):
    repository_class = EmployeeSkillRepository


class EmployeeSkillHistoryService(BaseService):
    repository_class = EmployeeSkillHistoryRepository


class EmployeeSkillAssessmentService(BaseService):
    repository_class = EmployeeSkillAssessmentRepository


