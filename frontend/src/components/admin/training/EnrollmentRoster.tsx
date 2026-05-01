import React, { useState } from 'react';
import { UserPlus } from 'lucide-react';
import { useSessionEnrollments, useCreateEnrollment } from '@/queries/training/useTrainingQueries';
import { useEmployees } from '@/queries/admin/useAdminMasters';
import { EnrollmentStatus } from '@/types/training.types';

const STATUS_COLOR: Record<EnrollmentStatus, string> = {
  ENROLLED:  '#15803d',
  WAITLIST:  '#b45309',
  CANCELLED: '#94a3b8',
};
const STATUS_BG: Record<EnrollmentStatus, string> = {
  ENROLLED:  'rgba(21,128,61,0.10)',
  WAITLIST:  'rgba(217,119,6,0.10)',
  CANCELLED: 'var(--color-surface-alt)',
};

interface EnrollmentRosterProps {
  sessionId: number;
  capacity: number;
}

export const EnrollmentRoster: React.FC<EnrollmentRosterProps> = ({ sessionId, capacity }) => {
  const { data, isLoading } = useSessionEnrollments(sessionId);
  const { data: employeesData } = useEmployees({ page_size: 200 });
  const createEnrollment = useCreateEnrollment(sessionId);

  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [showEnrollForm, setShowEnrollForm] = useState(false);

  const enrollments = data?.results ?? [];
  const employees   = employeesData?.results ?? [];
  const enrolledIds = new Set(enrollments.map(e => e.employee));

  const handleEnroll = async () => {
    if (!selectedEmployee) return;
    await createEnrollment.mutateAsync({
      training_session: sessionId,
      employee: Number(selectedEmployee),
    });
    setSelectedEmployee('');
    setShowEnrollForm(false);
  };

  if (isLoading) {
    return (
      <div style={{ padding: '16px', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '13px' }}>
        Loading…
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
        <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
          {enrollments.filter(e => e.enrollment_status === 'ENROLLED').length} / {capacity} enrolled
        </span>
        <button
          onClick={() => setShowEnrollForm(v => !v)}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '5px',
            fontSize: '12px', fontWeight: 600, color: 'var(--color-accent)',
            background: 'none', border: 'none', cursor: 'pointer', padding: '4px',
          }}
        >
          <UserPlus size={13} /> Enroll Employee
        </button>
      </div>

      {showEnrollForm && (
        <div style={{
          display: 'flex', gap: '8px', marginBottom: '12px',
          padding: '10px', background: 'var(--color-surface-alt)',
          borderRadius: 'var(--radius-md)',
        }}>
          <select
            className="form-input"
            value={selectedEmployee}
            onChange={e => setSelectedEmployee(e.target.value)}
            style={{ flex: 1, cursor: 'pointer' }}
          >
            <option value="">Select employee…</option>
            {employees
              .filter(e => !enrolledIds.has(e.id))
              .map(e => (
                <option key={e.id} value={String(e.id)}>
                  {e.full_name} ({e.employee_code})
                </option>
              ))}
          </select>
          <button
            onClick={handleEnroll}
            disabled={!selectedEmployee || createEnrollment.isPending}
            style={{
              padding: '6px 14px', borderRadius: 'var(--radius-md)',
              border: 'none', background: 'var(--color-accent)', color: '#fff',
              fontSize: '12px', fontWeight: 600,
              cursor: !selectedEmployee ? 'not-allowed' : 'pointer',
              opacity: !selectedEmployee ? 0.5 : 1,
            }}
          >
            Add
          </button>
          <button
            onClick={() => setShowEnrollForm(false)}
            style={{
              padding: '6px 10px', borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border)', background: 'transparent',
              fontSize: '12px', cursor: 'pointer', color: 'var(--color-text-muted)',
            }}
          >
            Cancel
          </button>
        </div>
      )}

      {enrollments.length === 0 ? (
        <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', fontStyle: 'italic', textAlign: 'center', padding: '20px 0' }}>
          No enrollments yet.
        </p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
              {['Employee', 'Status', 'Enrolled At'].map(h => (
                <th key={h} style={{
                  padding: '6px 8px', textAlign: 'left',
                  fontSize: '11px', fontWeight: 700, textTransform: 'uppercase',
                  letterSpacing: '0.05em', color: 'var(--color-text-muted)',
                }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {enrollments.map(e => (
              <tr key={e.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                <td style={{ padding: '8px' }}>
                  <p style={{ margin: 0, fontWeight: 500, color: 'var(--color-text-primary)' }}>{e.employee_name}</p>
                  <p style={{ margin: 0, fontSize: '11px', color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>{e.employee_code}</p>
                </td>
                <td style={{ padding: '8px' }}>
                  <span style={{
                    padding: '2px 8px', borderRadius: '999px',
                    fontSize: '11px', fontWeight: 600,
                    color: STATUS_COLOR[e.enrollment_status],
                    background: STATUS_BG[e.enrollment_status],
                  }}>
                    {e.enrollment_status}
                  </span>
                </td>
                <td style={{ padding: '8px', fontSize: '12px', color: 'var(--color-text-muted)' }}>
                  {new Date(e.enrolled_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};
