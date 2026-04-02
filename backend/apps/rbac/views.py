from rest_framework import viewsets, status, permissions
from rest_framework.views import APIView
from rest_framework.decorators import action
from drf_spectacular.utils import extend_schema, OpenApiParameter
from common.response import success_response, created_response, error_response
from .models import (
    PermissionGroupMaster,
    PermissionMaster,
    RoleMaster,
    RolePermissionMaster,
    UserRoleMaster
)
from .serializers import (
    PermissionGroupSerializer,
    PermissionSerializer,
    RoleMasterSerializer,
    RolePermissionSerializer,
    UserRoleSerializer
)
from .services import (
    PermissionGroupService,
    PermissionService,
    RoleService,
    RolePermissionService,
    UserRoleService
)


class BaseRBACViewSet(viewsets.ModelViewSet):
    """
    Base viewset for RBAC modules.
    Standardizes responses and delegates to services.
    """
    service_class = None

    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = self.get_serializer(queryset, many=True)
        return success_response(data=serializer.data)

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        return success_response(data=serializer.data)

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        instance = self.service_class().create(**serializer.validated_data)
        return created_response(
            message=f"{self.model.__name__} created successfully.",
            data=self.get_serializer(instance).data
        )

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data)
        serializer.is_valid(raise_exception=True)
        updated_instance = self.service_class().update(pk=instance.pk, partial=False, **serializer.validated_data)
        return success_response(
            message=f"{self.model.__name__} updated successfully.",
            data=self.get_serializer(updated_instance).data
        )

    def partial_update(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        updated_instance = self.service_class().update(pk=instance.pk, partial=True, **serializer.validated_data)
        return success_response(
            message=f"{self.model.__name__} partially updated successfully.",
            data=self.get_serializer(updated_instance).data
        )

    @extend_schema(
        parameters=[
            OpenApiParameter(name="soft_delete", type=bool, description="Set to false for hard delete (default is true)")
        ]
    )
    def destroy(self, request, *args, **kwargs):
        pk = kwargs.get("pk")
        soft_delete = request.query_params.get("soft_delete", "true").lower() == "true"
        self.service_class().delete(pk=pk, soft_delete=soft_delete)
        msg = f"{self.model.__name__} deleted successfully."
        return success_response(message=msg)


class PermissionGroupViewSet(BaseRBACViewSet):
    queryset = PermissionGroupMaster.objects.all()
    serializer_class = PermissionGroupSerializer
    service_class = PermissionGroupService
    model = PermissionGroupMaster


class PermissionMasterViewSet(BaseRBACViewSet):
    queryset = PermissionMaster.objects.all()
    serializer_class = PermissionSerializer
    service_class = PermissionService
    model = PermissionMaster


class RoleMasterViewSet(BaseRBACViewSet):
    queryset = RoleMaster.objects.all()
    serializer_class = RoleMasterSerializer
    service_class = RoleService
    model = RoleMaster

    @extend_schema(responses={200: RolePermissionSerializer(many=True)})
    @action(detail=True, methods=["post"], url_path="assign-permissions")
    def assign_permissions(self, request, pk=None):
        """Delegates bulk assignment logic to the RoleService."""
        permission_ids = request.data.get("permission_ids", [])
        success, message = self.service_class().assign_permissions(role_id=pk, permission_ids=permission_ids)
        
        if not success:
            return error_response(message=message, status_code=status.HTTP_400_BAD_REQUEST)
        
        return success_response(message=message)

    @action(detail=True, methods=["get"], url_path="permissions")
    def get_role_permissions(self, request, pk=None):
        """Fetches mapped permissions via the RoleService."""
        permissions = self.service_class().get_role_permissions(role_id=pk)
        if permissions is None:
             return error_response(message="Role not found.", status_code=status.HTTP_404_NOT_FOUND)
        
        serializer = PermissionSerializer([m.permission for m in permissions], many=True)
        return success_response(data=serializer.data)


class RolePermissionViewSet(BaseRBACViewSet):
    queryset = RolePermissionMaster.objects.all()
    serializer_class = RolePermissionSerializer
    service_class = RolePermissionService
    model = RolePermissionMaster


class UserRoleViewSet(BaseRBACViewSet):
    queryset = UserRoleMaster.objects.all()
    serializer_class = UserRoleSerializer
    service_class = UserRoleService
    model = UserRoleMaster


class MyPermissionsAPIView(APIView):
    """
    Returns the aggregated permissions and scopes via the UserRoleService.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        permissions_data = UserRoleService().get_user_permissions(request.user)
        return success_response(
            message="User permissions retrieved successfully.",
            data=permissions_data
        )
