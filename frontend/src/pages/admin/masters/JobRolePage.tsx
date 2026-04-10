import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { useJobRoles } from '@/queries/admin/useAdminMasters';
import { JobRole } from '@/api/admin-mock-api';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { AdminActionBar } from '@/components/admin/AdminActionBar';
import { AdminTableSkeleton } from '@/components/admin/AdminTableSkeleton';
import { Dialog } from '@/components/ui/dialog';
import { 
  Table, 
  TableHeader, 
  TableBody, 
  TableHead, 
  TableRow, 
  TableCell,
  TableStatusBadge,
  TableActionCell,
  TableIconButton,
  TableIdCell
} from '@/components/ui/table';

const JobRolePage: React.FC = () => {
  const { data: jobRoles, isLoading, error } = useJobRoles();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<JobRole | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    isActive: true
  });

  const handleOpenDialog = (role?: JobRole) => {
    if (role) {
      setEditingRole(role);
      setFormData({ 
        name: role.name, 
        code: role.code, 
        isActive: role.isActive 
      });
    } else {
      setEditingRole(null);
      setFormData({ name: '', code: '', isActive: true });
    }
    setIsDialogOpen(true);
  };

  const handleSave = () => {
    console.log('Saved:', formData);
    setIsDialogOpen(false);
  };

  // Filter Data
  const filteredData = jobRoles?.filter(role => {
    const matchesSearch = 
      role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      role.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || (statusFilter === 'active' ? role.isActive : !role.isActive);
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="content-inner">
      <AdminPageHeader 
        title="Job Roles"
        description="Define and manage company designations and job titles."
        breadcrumbs={[
          { label: 'Admin', href: '/admin' },
          { label: 'Organization' },
          { label: 'Job Roles' }
        ]}
        action={
          <button 
            className="btn-primary"
            onClick={() => handleOpenDialog()}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 'var(--space-2)',
              background: 'var(--color-accent)',
              color: '#fff',
              border: 'none',
              padding: '8px 16px',
              borderRadius: 'var(--radius-md)',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            <Plus size={16} />
            Add Job Role
          </button>
        }
      />

      <AdminActionBar 
        searchPlaceholder="Search by Role Name or Code..."
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        resultCount={filteredData?.length}
      >
        <select
          className="form-input"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'inactive')}
          style={{ width: '140px', cursor: 'pointer', flexShrink: 0 }}
        >
          <option value="all">All Statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </AdminActionBar>

      {/* ── Data Table ── */}
      {isLoading ? (
        <AdminTableSkeleton rowCount={4} columnCount={4} showActionCol />
      ) : error ? (
        <div className="flex justify-center p-8 text-red-500">Failed to load Job Roles.</div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Role Code</TableHead>
              <TableHead>Job Title</TableHead>
              <TableHead>Status</TableHead>
              <TableHead style={{ textAlign: 'center' }}>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} style={{ textAlign: 'center', padding: 'var(--space-8)' }}>
                  <span style={{ color: 'var(--color-text-muted)' }}>No job roles found.</span>
                </TableCell>
              </TableRow>
            ) : (
              filteredData?.map((role) => (
                <TableRow key={role.id}>
                  <TableIdCell>{role.code}</TableIdCell>
                  <TableCell style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{role.name}</TableCell>
                  <TableCell>
                    <TableStatusBadge variant={role.isActive ? 'active' : 'inactive'}>
                      {role.isActive ? 'Active' : 'Inactive'}
                    </TableStatusBadge>
                  </TableCell>
                  <TableActionCell>
                    <TableIconButton 
                      variant="edit" 
                      title="Edit Job Role" 
                      onClick={() => handleOpenDialog(role)}
                    />
                  </TableActionCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      )}

      {/* ── Add/Edit Dialog ── */}
      <Dialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        title={editingRole ? "Edit Job Role" : "Add Job Role"}
        description="Configure titles and designations available in the organization."
        footer={
          <>
            <button 
              className="btn-secondary"
              onClick={() => setIsDialogOpen(false)}
              style={{
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                padding: '8px 16px',
                borderRadius: 'var(--radius-md)',
                fontSize: 'var(--text-sm)',
                fontWeight: 600,
                cursor: 'pointer',
                color: 'var(--color-text-primary)'
              }}
            >
              Cancel
            </button>
            <button 
              className="btn-primary"
              onClick={handleSave}
              style={{
                background: 'var(--color-accent)',
                border: 'none',
                padding: '8px 16px',
                borderRadius: 'var(--radius-md)',
                fontSize: 'var(--text-sm)',
                fontWeight: 600,
                cursor: 'pointer',
                color: '#fff'
              }}
            >
              {editingRole ? "Update Job Role" : "Create Job Role"}
            </button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="form-group">
            <label className="form-label">Role Code *</label>
            <input 
              type="text" 
              className="form-input" 
              placeholder="e.g. ROLE-SE" 
              value={formData.code}
              onChange={e => setFormData({ ...formData, code: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Job Title *</label>
            <input 
              type="text" 
              className="form-input" 
              placeholder="e.g. Software Engineer"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div className="form-group" style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--color-border)', paddingTop: 'var(--space-4)', marginTop: 'var(--space-2)' }}>
            <div>
              <label className="form-label" style={{ display: 'block', color: 'var(--color-text-primary)' }}>Active Status</label>
            </div>
            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
              <input 
                type="checkbox" 
                checked={formData.isActive}
                onChange={e => setFormData({ ...formData, isActive: e.target.checked })}
                style={{ width: '18px', height: '18px', accentColor: 'var(--color-accent)', cursor: 'pointer' }}
              />
            </label>
          </div>
        </div>
      </Dialog>
    </div>
  );
};

export default JobRolePage;
