/**
 * UserRoleAssignmentPanel
 *
 * Displays and manages RBAC role assignments for a single employee.
 * Embedded inside the EmployeePage view drawer.
 *
 * Gates:
 *   - Entire panel hidden when caller lacks USER_ROLE_ASSIGN.
 *   - LMS_USER system assignment cannot be deactivated (it is auto-managed).
 *   - Scope entity selector only shown for BUSINESS_UNIT / DEPARTMENT scopes.
 */

import React, { useState } from 'react';
import { ShieldCheck, Plus, X, AlertTriangle } from 'lucide-react';
import { usePermission } from '@/hooks/usePermission';
import { PERMISSIONS } from '@/constants/permissions';
import {
  useUserAssignments,
  useRoles,
  useAssignUserRole,
  useDeactivateUserRole,
} from '@/queries/admin/useRbacQueries';
import {
  useBusinessUnitOptions,
  useDepartmentOptions,
} from '@/queries/admin/useAdminMasters';
import type { ScopeType } from '@/types/rbac.types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface UserRoleAssignmentPanelProps {
  /** EmployeeMaster.id — used for display context only */
  employeeId: number;
  /** AuthUser.id — used for all RBAC API calls */
  userId: number | null;
}

// Scopes available to company admins (GLOBAL is superuser-only)
const ASSIGNABLE_SCOPES: { label: string; value: ScopeType }[] = [
  { label: 'Company',       value: 'COMPANY' },
  { label: 'Business Unit', value: 'BUSINESS_UNIT' },
  { label: 'Department',    value: 'DEPARTMENT' },
];

// ---------------------------------------------------------------------------
// Scope badge
// ---------------------------------------------------------------------------

const ScopeBadge: React.FC<{ scope: ScopeType }> = ({ scope }) => {
  const colors: Record<ScopeType, { bg: string; color: string }> = {
    GLOBAL:        { bg: 'var(--color-accent-subtle)',  color: 'var(--color-accent)' },
    COMPANY:       { bg: 'color-mix(in srgb, var(--success) 12%, transparent)', color: 'var(--success)' },
    BUSINESS_UNIT: { bg: 'var(--color-surface-alt)',    color: 'var(--color-text-secondary)' },
    DEPARTMENT:    { bg: 'var(--color-surface-alt)',    color: 'var(--color-text-secondary)' },
    SELF:          { bg: 'var(--color-surface-alt)',    color: 'var(--color-text-muted)' },
  };
  const { bg, color } = colors[scope] ?? colors.SELF;
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '2px 8px',
        borderRadius: 'var(--radius-full)',
        fontSize: '11px',
        fontWeight: 600,
        background: bg,
        color,
        border: '1px solid var(--color-border)',
        whiteSpace: 'nowrap',
      }}
    >
      {scope.replace('_', ' ')}
    </span>
  );
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const UserRoleAssignmentPanel: React.FC<UserRoleAssignmentPanelProps> = ({
  userId,
}) => {
  const canAssign = usePermission(PERMISSIONS.USER_ROLE_ASSIGN);

  // ── Data ──
  const { data: assignmentsRes, isLoading: assignmentsLoading } = useUserAssignments(
    userId ?? undefined,
  );
  const { data: rolesRes } = useRoles({ page_size: 100 });
  const { data: buOptions = [] } = useBusinessUnitOptions();
  const { data: deptOptions = [] } = useDepartmentOptions();

  const assignments = assignmentsRes?.results ?? [];
  const roles = rolesRes?.results ?? [];

  // ── Mutations ──
  const assignRole    = useAssignUserRole();
  const deactivate    = useDeactivateUserRole(userId ?? undefined);

  // ── Add-role form state ──
  const [showForm, setShowForm]       = useState(false);
  const [selectedRole, setSelectedRole] = useState('');
  const [scopeType, setScopeType]     = useState<ScopeType>('COMPANY');
  const [scopeId, setScopeId]         = useState('');
  const [formError, setFormError]     = useState<string | null>(null);

  // ── Guard: no linked user account ──
  if (!userId) {
    return (
      <div
        style={{
          padding: 'var(--space-3) var(--space-4)',
          borderRadius: 'var(--radius-md)',
          background: 'var(--color-surface-alt)',
          border: '1px solid var(--color-border)',
          fontSize: 'var(--text-sm)',
          color: 'var(--color-text-muted)',
          fontStyle: 'italic',
        }}
      >
        No linked user account — role assignments are not available.
      </div>
    );
  }

  // ── Guard: permission ──
  if (!canAssign) return null;

  // ── Helpers ──
  const resetForm = () => {
    setSelectedRole('');
    setScopeType('COMPANY');
    setScopeId('');
    setFormError(null);
    setShowForm(false);
  };

  const handleAssign = async () => {
    setFormError(null);
    if (!selectedRole) {
      setFormError('Please select a role.');
      return;
    }
    const needsScopeId = scopeType === 'BUSINESS_UNIT' || scopeType === 'DEPARTMENT';
    if (needsScopeId && !scopeId) {
      setFormError('Please select a scope entity.');
      return;
    }

    try {
      const result = await assignRole.mutateAsync({
        user: userId,
        role: Number(selectedRole),
        scope_type: scopeType,
        scope_id: needsScopeId ? Number(scopeId) : null,
      });
      if (result) resetForm();
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ??
        err?.response?.data?.errors?.non_field_errors?.[0] ??
        'Failed to assign role.';
      setFormError(msg);
    }
  };

  const handleDeactivate = async (assignmentId: number) => {
    try {
      await deactivate.mutateAsync(assignmentId);
    } catch {
      // toast shown by handleApiError
    }
  };

  // Scope entity options
  const scopeEntityOptions =
    scopeType === 'BUSINESS_UNIT'
      ? (buOptions ?? []).map((o: any) => ({ label: o.name, value: String(o.id) }))
      : scopeType === 'DEPARTMENT'
      ? (deptOptions ?? []).map((o: any) => ({ label: o.name ?? o.department_name, value: String(o.id) }))
      : [];

  const roleOptions = roles.map((r) => ({
    label: `${r.role_name}${r.is_system_role ? ' (System)' : ''}`,
    value: String(r.id),
  }));

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>

      {/* ── Header row ── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          {/* <ShieldCheck size={14} strokeWidth={2} style={{ color: 'var(--color-accent)' }} /> */}
          <span
            style={{
              fontSize: '12px',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              color: 'var(--color-text-muted)',
            }}
          >
            Role Assignments
          </span>
        </div>

        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              background: 'none',
              border: '1px solid var(--color-border)',
              padding: '4px 10px',
              borderRadius: 'var(--radius-md)',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              color: 'var(--color-accent)',
            }}
          >
            <Plus size={12} strokeWidth={2.5} />
            Add Role
          </button>
        )}
      </div>

      {/* ── Add Role form ── */}
      {showForm && (
        <div
          style={{
            padding: 'var(--space-3)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--color-accent)',
            background: 'var(--color-accent-subtle)',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-3)',
          }}
        >
          {/* Role selector */}
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label" style={{ fontSize: '12px' }}>
              Role <span className="input-requied">*</span>
            </label>
            <select
              className="form-input"
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              style={{ cursor: 'pointer' }}
            >
              <option value="" disabled>Select a role…</option>
              {roleOptions.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          {/* Scope type selector */}
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label" style={{ fontSize: '12px' }}>Scope</label>
            <select
              className="form-input"
              value={scopeType}
              onChange={(e) => {
                setScopeType(e.target.value as ScopeType);
                setScopeId('');
              }}
              style={{ cursor: 'pointer' }}
            >
              {ASSIGNABLE_SCOPES.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>

          {/* Scope entity selector — only for BU / Dept */}
          {(scopeType === 'BUSINESS_UNIT' || scopeType === 'DEPARTMENT') && (
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label" style={{ fontSize: '12px' }}>
                {scopeType === 'BUSINESS_UNIT' ? 'Business Unit' : 'Department'}{' '}
                <span className="input-requied">*</span>
              </label>
              <select
                className="form-input"
                value={scopeId}
                onChange={(e) => setScopeId(e.target.value)}
                style={{ cursor: 'pointer' }}
              >
                <option value="" disabled>
                  Select {scopeType === 'BUSINESS_UNIT' ? 'business unit' : 'department'}…
                </option>
                {scopeEntityOptions.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          )}

          {/* Error */}
          {formError && (
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 'var(--space-2)',
                fontSize: '12px',
                color: 'var(--color-danger)',
              }}
            >
              <AlertTriangle size={13} strokeWidth={2} style={{ flexShrink: 0, marginTop: 1 }} />
              {formError}
            </div>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', gap: 'var(--space-2)', justifyContent: 'flex-end' }}>
            <button
              onClick={resetForm}
              style={{
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                padding: '5px 12px',
                borderRadius: 'var(--radius-md)',
                fontSize: '12px',
                fontWeight: 500,
                cursor: 'pointer',
                color: 'var(--color-text-secondary)',
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleAssign}
              disabled={assignRole.isPending}
              style={{
                background: 'var(--color-accent)',
                border: 'none',
                padding: '5px 12px',
                borderRadius: 'var(--radius-md)',
                fontSize: '12px',
                fontWeight: 600,
                cursor: assignRole.isPending ? 'not-allowed' : 'pointer',
                color: '#fff',
                opacity: assignRole.isPending ? 0.7 : 1,
              }}
            >
              {assignRole.isPending ? 'Assigning…' : 'Assign'}
            </button>
          </div>
        </div>
      )}

      {/* ── Assignment list ── */}
      {assignmentsLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
          {[1, 2].map((i) => (
            <div
              key={i}
              style={{
                height: '44px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--color-surface-alt)',
                animation: 'pulse 1.5s ease-in-out infinite',
              }}
            />
          ))}
        </div>
      ) : assignments.length === 0 ? (
        <p
          style={{
            fontSize: '13px',
            color: 'var(--color-text-muted)',
            fontStyle: 'italic',
            margin: 0,
          }}
        >
          No role assignments yet.
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
          {assignments.map((assignment) => {
            const isLmsUser = assignment.role_code === 'LMS_USER';
            return (
              <div
                key={assignment.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: 'var(--space-2) var(--space-3)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--color-border)',
                  background: assignment.is_active
                    ? 'var(--color-surface)'
                    : 'var(--color-surface-alt)',
                  opacity: assignment.is_active ? 1 : 0.6,
                  gap: 'var(--space-2)',
                }}
              >
                {/* Left: role name + scope */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flexWrap: 'wrap', flex: 1, minWidth: 0 }}>
                  <span
                    style={{
                      fontSize: '13px',
                      fontWeight: 600,
                      color: 'var(--color-text-primary)',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {assignment.role_name}
                  </span>
                  <ScopeBadge scope={assignment.scope_type} />
                  {!assignment.is_active && (
                    <span
                      style={{
                        fontSize: '11px',
                        color: 'var(--color-text-muted)',
                        fontStyle: 'italic',
                      }}
                    >
                      inactive
                    </span>
                  )}
                </div>

                {/* Right: deactivate button — hidden for LMS_USER and already-inactive */}
                {!isLmsUser && assignment.is_active && (
                  <button
                    onClick={() => handleDeactivate(assignment.id)}
                    disabled={deactivate.isPending}
                    title="Revoke assignment"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 26,
                      height: 26,
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--color-border)',
                      background: 'var(--color-surface)',
                      cursor: deactivate.isPending ? 'not-allowed' : 'pointer',
                      color: 'var(--color-danger)',
                      flexShrink: 0,
                      opacity: deactivate.isPending ? 0.5 : 1,
                    }}
                  >
                    <X size={12} strokeWidth={2.5} />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
