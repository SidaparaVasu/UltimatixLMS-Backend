import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { useSessionAttendance, useBulkUpsertAttendance } from '@/queries/training/useTrainingQueries';
import { useSessionEnrollments } from '@/queries/training/useTrainingQueries';
import { AttendanceStatus } from '@/types/training.types';

const STATUSES: AttendanceStatus[] = ['PRESENT', 'ABSENT', 'PARTIAL'];

const STATUS_COLOR: Record<AttendanceStatus, { color: string; bg: string }> = {
  PRESENT: { color: '#15803d', bg: 'rgba(21,128,61,0.10)' },
  ABSENT:  { color: '#dc2626', bg: 'rgba(220,38,38,0.10)' },
  PARTIAL: { color: '#b45309', bg: 'rgba(217,119,6,0.10)' },
};

interface AttendanceSheetProps {
  sessionId: number;
}

export const AttendanceSheet: React.FC<AttendanceSheetProps> = ({ sessionId }) => {
  const { data: attendanceData, isLoading: attLoading } = useSessionAttendance(sessionId);
  const { data: enrollmentData } = useSessionEnrollments(sessionId);
  const bulkUpsert = useBulkUpsertAttendance(sessionId);

  // Local state: employeeId → status
  const [records, setRecords] = useState<Record<number, AttendanceStatus>>({});
  const [isSaving, setIsSaving] = useState(false);

  // Seed from existing attendance records
  useEffect(() => {
    if (attendanceData?.results) {
      const map: Record<number, AttendanceStatus> = {};
      attendanceData.results.forEach(a => { map[a.employee] = a.attendance_status; });
      setRecords(map);
    }
  }, [attendanceData]);

  const enrollments = enrollmentData?.results?.filter(e => e.enrollment_status === 'ENROLLED') ?? [];

  const handleToggle = (employeeId: number, status: AttendanceStatus) => {
    setRecords(prev => ({ ...prev, [employeeId]: status }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await bulkUpsert.mutateAsync({
        training_session: sessionId,
        records: Object.entries(records).map(([empId, status]) => ({
          employee: Number(empId),
          attendance_status: status,
        })),
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (attLoading) {
    return (
      <div style={{ padding: '16px', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '13px' }}>
        Loading…
      </div>
    );
  }

  if (enrollments.length === 0) {
    return (
      <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', fontStyle: 'italic', textAlign: 'center', padding: '20px 0' }}>
        No enrolled employees to mark attendance for.
      </p>
    );
  }

  return (
    <div>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', marginBottom: '16px' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
            <th style={{ padding: '6px 8px', textAlign: 'left', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-muted)' }}>
              Employee
            </th>
            <th style={{ padding: '6px 8px', textAlign: 'left', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-muted)' }}>
              Attendance
            </th>
          </tr>
        </thead>
        <tbody>
          {enrollments.map(e => {
            const current = records[e.employee] ?? 'PRESENT';
            return (
              <tr key={e.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                <td style={{ padding: '8px' }}>
                  <p style={{ margin: 0, fontWeight: 500, color: 'var(--color-text-primary)' }}>{e.employee_name}</p>
                  <p style={{ margin: 0, fontSize: '11px', color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>{e.employee_code}</p>
                </td>
                <td style={{ padding: '8px' }}>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    {STATUSES.map(s => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => handleToggle(e.employee, s)}
                        style={{
                          padding: '3px 10px', borderRadius: '999px',
                          fontSize: '11px', fontWeight: 600,
                          cursor: 'pointer',
                          border: current === s
                            ? `1px solid ${STATUS_COLOR[s].color}`
                            : '1px solid var(--color-border)',
                          background: current === s ? STATUS_COLOR[s].bg : 'transparent',
                          color: current === s ? STATUS_COLOR[s].color : 'var(--color-text-muted)',
                          transition: 'all 120ms ease',
                        }}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <button
        onClick={handleSave}
        disabled={isSaving}
        style={{
          padding: '8px 20px', borderRadius: 'var(--radius-md)',
          border: 'none', background: 'var(--color-accent)', color: '#fff',
          fontSize: '13px', fontWeight: 600,
          cursor: isSaving ? 'not-allowed' : 'pointer',
          opacity: isSaving ? 0.6 : 1,
          display: 'inline-flex', alignItems: 'center', gap: '6px',
        }}
      >
        {isSaving && <Loader2 size={13} className="animate-spin" />}
        Save Attendance
      </button>
    </div>
  );
};
