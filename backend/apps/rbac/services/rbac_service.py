from common.services.base import BaseService
from common.exceptions import PermissionDeniedException
from django.db import transaction
from ..repositories import (
    PermissionGroupRepository,
    PermissionRepository,
    RoleRepository,
    RolePermissionRepository,
    UserRoleRepository
)


class PermissionGroupService(BaseService):
    repository_class = PermissionGroupRepository


class PermissionService(BaseService):
    repository_class = PermissionRepository


class RoleService(BaseService):
    repository_class = RoleRepository

    @transaction.atomic
    def assign_permissions(self, role_id: int, permission_ids: list):
        """
        Orchestrates the bulk assignment of permissions to a role.
        """
        role = self.get_by_id(role_id)
        if not role:
            return None, "Role not found."

        # Verify permissions exist
        perm_repo = PermissionRepository()
        permissions = perm_repo.filter(id__in=permission_ids)
        if len(permissions) != len(permission_ids):
            return None, "One or more permission IDs are invalid."

        # Delegate bulk operation to RolePermissionRepository
        mapping_repo = RolePermissionRepository()
        mapping_repo.clear_and_assign(role, permissions)
        return True, "Permissions assigned successfully."

    def get_role_permissions(self, role_id: int):
        """Fetch all permissions currently mapped to this role."""
        role = self.get_by_id(role_id)
        if not role:
            return None
        mapping_repo = RolePermissionRepository()
        return mapping_repo.get_permissions_for_role(role)

    def delete(self, pk: int, soft_delete: bool = True) -> bool:
        """Adds business rule: system roles cannot be deleted."""
        role = self.get_by_id(pk)
        if role and role.is_system_role:
             raise PermissionDeniedException("Cannot delete a system-defined role.")
        return super().delete(pk, soft_delete)


class RolePermissionService(BaseService):
    repository_class = RolePermissionRepository


class UserRoleService(BaseService):
    repository_class = UserRoleRepository

    def get_user_permissions(self, user):
        """
        Aggregates permissions and scopes for a given user across all their active roles.
        """
        user_roles = self.repository.get_active_user_roles(user)
        
        permissions_data = []
        mapping_repo = RolePermissionRepository()
        
        for ur in user_roles:
            role_perms = mapping_repo.get_permissions_for_role(ur.role)
            for rp in role_perms:
                permissions_data.append({
                    "permission_code": rp.permission.permission_code,
                    "permission_name": rp.permission.permission_name,
                    "scope_type": ur.scope_type,
                    "scope_id": ur.scope_id
                })
        return permissions_data
