/**
 * TypeScript interfaces for all RBAC API request/response shapes.
 * Mirrors the backend serializers in apps/rbac/serializers.py.
 */

import type { UserPermissions } from './auth.types';

// ---------------------------------------------------------------------------
// Re-export for convenience
// ---------------------------------------------------------------------------

export type { UserPermissions as PermissionMap };

// ---------------------------------------------------------------------------
// Scope
// ---------------------------------------------------------------------------

export type ScopeType = 'GLOBAL' | 'COMPANY' | 'BUSINESS_UNIT' | 'DEPARTMENT' | 'SELF';

// ---------------------------------------------------------------------------
// Permission Group
// ---------------------------------------------------------------------------

export interface PermissionGroup {
  id: number;
  group_name: string;
  group_code: string;
  description: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ---------------------------------------------------------------------------
// Permission
// ---------------------------------------------------------------------------

export interface Permission {
  id: number;
  permission_group: number;
  group_code: string;
  permission_name: string;
  permission_code: string;
  description: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ---------------------------------------------------------------------------
// Role
// ---------------------------------------------------------------------------

export interface Role {
  id: number;
  role_name: string;
  role_code: string;
  description: string;
  is_system_role: boolean;
  company: number | null;
  company_name: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateRolePayload {
  role_name: string;
  role_code: string;
  description?: string;
  is_active?: boolean;
}

export interface UpdateRolePayload {
  role_name?: string;
  description?: string;
  is_active?: boolean;
}

// ---------------------------------------------------------------------------
// User Role Assignment
// ---------------------------------------------------------------------------

export interface UserRole {
  id: number;
  user: number;
  role: number;
  role_name: string;
  role_code: string;
  is_system_role: boolean;
  scope_type: ScopeType;
  scope_id: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AssignUserRolePayload {
  user: number;
  role: number;
  scope_type: ScopeType;
  scope_id?: number | null;
}

export interface DeactivateUserRolePayload {
  is_active: false;
}

// ---------------------------------------------------------------------------
// Company Permission Group
// ---------------------------------------------------------------------------

export interface CompanyPermissionGroup {
  id: number;
  company: number;
  company_name: string;
  permission_group: number;
  group_code: string;
  group_name: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateCompanyPermissionGroupPayload {
  company: number;
  permission_group: number;
  is_active?: boolean;
}

export interface UpdateCompanyPermissionGroupPayload {
  is_active?: boolean;
}

// ---------------------------------------------------------------------------
// Assign Permissions to Role
// ---------------------------------------------------------------------------

export interface AssignPermissionsPayload {
  permission_ids: number[];
}
