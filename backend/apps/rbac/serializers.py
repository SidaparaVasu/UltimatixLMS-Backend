from rest_framework import serializers
from .models import (
    PermissionGroupMaster,
    PermissionMaster,
    RoleMaster,
    RolePermissionMaster,
    UserRoleMaster,
    CompanyPermissionGroup,
)
from .constants import ScopeType


class PermissionGroupSerializer(serializers.ModelSerializer):
    class Meta:
        model = PermissionGroupMaster
        fields = ["id", "group_name", "group_code", "description", "display_order", "is_active", "created_at", "updated_at"]
        read_only_fields = ["id", "created_at", "updated_at"]


class PermissionSerializer(serializers.ModelSerializer):
    group_code = serializers.CharField(source="permission_group.group_code", read_only=True)

    class Meta:
        model = PermissionMaster
        fields = ["id", "permission_group", "group_code", "permission_name", "permission_code", "description", "is_active", "created_at", "updated_at"]
        read_only_fields = ["id", "group_code", "created_at", "updated_at"]


class RoleMasterSerializer(serializers.ModelSerializer):
    company_name = serializers.CharField(source="company.company_name", read_only=True, default=None)

    class Meta:
        model = RoleMaster
        fields = ["id", "role_name", "role_code", "description", "is_system_role", "company", "company_name", "is_active", "created_at", "updated_at"]
        read_only_fields = ["id", "is_system_role", "company", "company_name", "created_at", "updated_at"]

    def validate(self, attrs):
        # is_system_role is read-only so DRF strips it before field-level validators run.
        # We check the raw initial data instead so company admins cannot sneak it in.
        request = self.context.get("request")
        if request and not request.user.is_superuser:
            raw_value = self.initial_data.get("is_system_role")
            if raw_value is True or raw_value == "true":
                raise serializers.ValidationError(
                    {"is_system_role": "is_system_role cannot be set to True by company admins."}
                )
        return attrs


class RolePermissionSerializer(serializers.ModelSerializer):
    class Meta:
        model = RolePermissionMaster
        fields = ["id", "role", "permission", "created_at"]
        read_only_fields = ["id", "created_at"]


class UserRoleSerializer(serializers.ModelSerializer):
    role_name = serializers.CharField(source="role.role_name", read_only=True)
    role_code = serializers.CharField(source="role.role_code", read_only=True)
    is_system_role = serializers.BooleanField(source="role.is_system_role", read_only=True)

    class Meta:
        model = UserRoleMaster
        fields = [
            "id", "user", "role", "role_name", "role_code", "is_system_role",
            "scope_type", "scope_id", "is_active",
            "created_at", "updated_at",
        ]
        read_only_fields = ["id", "role_name", "role_code", "is_system_role", "created_at", "updated_at"]

    def validate_scope_type(self, value):
        """GLOBAL scope is reserved for superusers only."""
        request = self.context.get("request")
        if value == ScopeType.GLOBAL and request and not request.user.is_superuser:
            raise serializers.ValidationError(
                "GLOBAL scope is not permitted for company admin users."
            )
        return value


class CompanyPermissionGroupSerializer(serializers.ModelSerializer):
    company_name = serializers.CharField(source="company.company_name", read_only=True)
    group_code = serializers.CharField(source="permission_group.group_code", read_only=True)
    group_name = serializers.CharField(source="permission_group.group_name", read_only=True)

    class Meta:
        model = CompanyPermissionGroup
        fields = [
            "id", "company", "company_name",
            "permission_group", "group_code", "group_name",
            "is_active", "created_at", "updated_at",
        ]
        read_only_fields = ["id", "company_name", "group_code", "group_name", "created_at", "updated_at"]
