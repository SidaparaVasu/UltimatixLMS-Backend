/**
 * Typed API client for all RBAC endpoints.
 * Base path: /rbac/
 *
 * Rules:
 * - All calls go through apiClient (token injection + silent refresh handled there).
 * - Use handleApiResponse / handleApiError for consistent toast notifications.
 * - Never use raw permission strings — import from @/constants/permissions.
 */

import { apiClient } from './axios-client';
import { handleApiResponse, handleApiError } from '@/utils/api-utils';
import { PaginatedResponse } from './organization-api';
import type {
  PermissionMap,
  PermissionGroup,
  Permission,
  Role,
  CreateRolePayload,
  UpdateRolePayload,
  UserRole,
  AssignUserRolePayload,
  CompanyPermissionGroup,
  CreateCompanyPermissionGroupPayload,
  UpdateCompanyPermissionGroupPayload,
  AssignPermissionsPayload,
} from '@/types/rbac.types';

const BASE = '/rbac';

export const rbacApi = {

  // ── My Permissions ────────────────────────────────────────────────────────

  /**
   * GET /rbac/my-permissions/
   * Returns the subscription-gated permission map for the authenticated user.
   * Superusers receive `true` as a sentinel; regular users receive a scoped map.
   */
  getMyPermissions: async (): Promise<PermissionMap | null> => {
    try {
      const response = await apiClient.get(`${BASE}/my-permissions/`);
      return handleApiResponse<PermissionMap>(response.data, false);
    } catch (error) {
      return handleApiError(error);
    }
  },

  // ── Permission Groups ─────────────────────────────────────────────────────

  /**
   * GET /rbac/permission-groups/
   * Returns all permission groups (read-only, available to all authenticated users).
   */
  getPermissionGroups: async (): Promise<PaginatedResponse<PermissionGroup> | null> => {
    try {
      const response = await apiClient.get(`${BASE}/permission-groups/`);
      return handleApiResponse<PaginatedResponse<PermissionGroup>>(response.data, false);
    } catch (error) {
      return handleApiError(error);
    }
  },

  // ── Permissions ───────────────────────────────────────────────────────────

  /**
   * GET /rbac/permissions/
   * Returns all permission records (read-only).
   */
  getPermissions: async (params?: { permission_group?: number }): Promise<PaginatedResponse<Permission> | null> => {
    try {
      const response = await apiClient.get(`${BASE}/permissions/`, { params });
      return handleApiResponse<PaginatedResponse<Permission>>(response.data, false);
    } catch (error) {
      return handleApiError(error);
    }
  },

  // ── Roles ─────────────────────────────────────────────────────────────────

  /**
   * GET /rbac/roles/
   * Returns system roles + the requesting user's company custom roles.
   */
  getRoles: async (params?: { page?: number; page_size?: number }): Promise<PaginatedResponse<Role> | null> => {
    try {
      const response = await apiClient.get(`${BASE}/roles/`, { params });
      return handleApiResponse<PaginatedResponse<Role>>(response.data, false);
    } catch (error) {
      return handleApiError(error);
    }
  },

  /**
   * GET /rbac/roles/:id/
   */
  getRole: async (id: number): Promise<Role | null> => {
    try {
      const response = await apiClient.get(`${BASE}/roles/${id}/`);
      return handleApiResponse<Role>(response.data, false);
    } catch (error) {
      return handleApiError(error);
    }
  },

  /**
   * POST /rbac/roles/
   * Creates a custom role scoped to the requesting user's company.
   * Privilege escalation check is enforced on the backend.
   */
  createRole: async (payload: CreateRolePayload): Promise<Role | null> => {
    try {
      const response = await apiClient.post(`${BASE}/roles/`, payload);
      return handleApiResponse<Role>(response.data);
    } catch (error) {
      return handleApiError(error);
    }
  },

  /**
   * PATCH /rbac/roles/:id/
   * Partial update — system roles return HTTP 403 for non-superusers.
   */
  updateRole: async (id: number, payload: UpdateRolePayload): Promise<Role | null> => {
    try {
      const response = await apiClient.patch(`${BASE}/roles/${id}/`, payload);
      return handleApiResponse<Role>(response.data);
    } catch (error) {
      return handleApiError(error);
    }
  },

  /**
   * DELETE /rbac/roles/:id/
   * System roles cannot be deleted; returns HTTP 403.
   */
  deleteRole: async (id: number): Promise<boolean> => {
    try {
      const response = await apiClient.delete(`${BASE}/roles/${id}/`);
      return handleApiResponse(response.data) !== null;
    } catch (error) {
      return handleApiError(error);
    }
  },

  // ── Role Permissions ──────────────────────────────────────────────────────

  /**
   * GET /rbac/roles/:id/permissions/
   * Returns all permissions currently mapped to the given role.
   */
  getRolePermissions: async (roleId: number): Promise<Permission[] | null> => {
    try {
      const response = await apiClient.get(`${BASE}/roles/${roleId}/permissions/`);
      return handleApiResponse<Permission[]>(response.data, false);
    } catch (error) {
      return handleApiError(error);
    }
  },

  /**
   * POST /rbac/roles/:id/assign-permissions/
   * Bulk-assigns permissions to a role.
   * Privilege escalation check: the caller cannot grant permissions they don't hold.
   */
  assignPermissionsToRole: async (roleId: number, payload: AssignPermissionsPayload): Promise<boolean> => {
    try {
      const response = await apiClient.post(`${BASE}/roles/${roleId}/assign-permissions/`, payload);
      return handleApiResponse(response.data) !== null;
    } catch (error) {
      return handleApiError(error);
    }
  },

  // ── User Role Assignments ─────────────────────────────────────────────────

  /**
   * GET /rbac/user-assignments/
   * Returns role assignments scoped to the requesting user's company.
   * Pass `user` param to filter by a specific user ID.
   */
  getUserAssignments: async (params?: { user?: number; page?: number; page_size?: number }): Promise<PaginatedResponse<UserRole> | null> => {
    try {
      const response = await apiClient.get(`${BASE}/user-assignments/`, { params });
      return handleApiResponse<PaginatedResponse<UserRole>>(response.data, false);
    } catch (error) {
      return handleApiError(error);
    }
  },

  /**
   * POST /rbac/user-assignments/
   * Assigns a role to a user with a given scope.
   * Privilege escalation check is enforced on the backend.
   */
  assignUserRole: async (payload: AssignUserRolePayload): Promise<UserRole | null> => {
    try {
      const response = await apiClient.post(`${BASE}/user-assignments/`, payload);
      return handleApiResponse<UserRole>(response.data);
    } catch (error) {
      return handleApiError(error);
    }
  },

  /**
   * PATCH /rbac/user-assignments/:id/
   * Deactivates a user role assignment.
   */
  deactivateUserRole: async (id: number): Promise<UserRole | null> => {
    try {
      const response = await apiClient.patch(`${BASE}/user-assignments/${id}/`, { is_active: false });
      return handleApiResponse<UserRole>(response.data);
    } catch (error) {
      return handleApiError(error);
    }
  },

  // ── Company Permission Groups ─────────────────────────────────────────────

  /**
   * GET /rbac/company-permission-groups/
   * Superuser only — lists which permission groups each company has been granted.
   */
  getCompanyPermissionGroups: async (params?: { company?: number }): Promise<PaginatedResponse<CompanyPermissionGroup> | null> => {
    try {
      const response = await apiClient.get(`${BASE}/company-permission-groups/`, { params });
      return handleApiResponse<PaginatedResponse<CompanyPermissionGroup>>(response.data, false);
    } catch (error) {
      return handleApiError(error);
    }
  },

  /**
   * POST /rbac/company-permission-groups/
   * Superuser only — grants a permission group to a company.
   */
  createCompanyPermissionGroup: async (payload: CreateCompanyPermissionGroupPayload): Promise<CompanyPermissionGroup | null> => {
    try {
      const response = await apiClient.post(`${BASE}/company-permission-groups/`, payload);
      return handleApiResponse<CompanyPermissionGroup>(response.data);
    } catch (error) {
      return handleApiError(error);
    }
  },

  /**
   * PATCH /rbac/company-permission-groups/:id/
   * Superuser only — toggles a company permission group active/inactive.
   */
  updateCompanyPermissionGroup: async (id: number, payload: UpdateCompanyPermissionGroupPayload): Promise<CompanyPermissionGroup | null> => {
    try {
      const response = await apiClient.patch(`${BASE}/company-permission-groups/${id}/`, payload);
      return handleApiResponse<CompanyPermissionGroup>(response.data);
    } catch (error) {
      return handleApiError(error);
    }
  },

  /**
   * DELETE /rbac/company-permission-groups/:id/
   * Superuser only — removes a company permission group.
   */
  deleteCompanyPermissionGroup: async (id: number): Promise<boolean> => {
    try {
      const response = await apiClient.delete(`${BASE}/company-permission-groups/${id}/`);
      return handleApiResponse(response.data) !== null;
    } catch (error) {
      return handleApiError(error);
    }
  },
};
