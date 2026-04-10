import React, { useState } from 'react';
import { useJobRoles } from '@/queries/admin/useAdminMasters';
import { JobRole } from '@/api/admin-mock-api';
import { useAdminCRUD } from '@/hooks/admin/useAdminCRUD';
import { AdminMasterLayout } from '@/components/admin/layout/AdminMasterLayout';
import { AdminDataTable, DataTableColumn } from '@/components/admin/layout/AdminDataTable';
import { AdminInput, AdminToggle, DialogFooterActions } from '@/components/admin/form';
import { Dialog } from '@/components/ui/dialog';

/* ── Form shape ──────────────────────────────────────────────── */
interface JobRoleForm {
  name: string;
  code: string;
  isActive: boolean;
}

const EMPTY_FORM: JobRoleForm = { 
  name: '', 
  code: '', 
  isActive: true 
};

/* ── Column definitions ──────────────────────────────────────── */
const buildColumns = (
  onEdit: (role: JobRole) => void
): DataTableColumn<JobRole>[] => [
  { type: 'id',     key: 'code',     header: 'Role Code', width: '130px' },
  { type: 'text',   key: 'name',     header: 'Job Title', cellStyle: { fontWeight: 600, color: 'var(--color-text-primary)' } },
  { type: 'status', key: 'isActive', header: 'Status', width: '110px' },
  { type: 'actions', onEdit },
];

const JobRolePage: React.FC = () => {
  const { data: jobRoles, isLoading, error } = useJobRoles();

  const crud = useAdminCRUD<JobRole, JobRoleForm>({
    emptyForm: EMPTY_FORM,
    mapToForm: role => ({ 
      name: role.name, 
      code: role.code, 
      isActive: role.isActive 
    }),
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  /* ── Filtering ── */
  const filteredData = jobRoles?.filter(role => {
    const matchesSearch = (role.name + role.code).toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || (statusFilter === 'active') === role.isActive;
    return matchesSearch && matchesStatus;
  });

  /* ── Save handler ── */
  const handleSave = () => {
    console.log(crud.editingItem ? 'Update:' : 'Create:', crud.formData);
    crud.closeDialog();
  };

  const isFormValid = !!(crud.formData.name.trim() && crud.formData.code.trim());

  return (
    <AdminMasterLayout
      title="Job Roles"
      description="Define and manage company designations and job titles."
      breadcrumbs={[
        { label: 'Admin', href: '/admin' },
        { label: 'Organization' },
        { label: 'Job Roles' },
      ]}
      addLabel="Add Job Role"
      onAdd={() => crud.openDialog()}
      searchPlaceholder="Search by Role Name or Code..."
      searchTerm={searchTerm}
      onSearchChange={setSearchTerm}
      resultCount={filteredData?.length}
      filterSlot={
        <select
          className="form-input"
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          style={{ width: '140px', cursor: 'pointer', flexShrink: 0 }}
        >
          <option value="all">Status: All</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      }
    >
      <AdminDataTable<JobRole>
        rowKey="id"
        columns={buildColumns(crud.openDialog)}
        data={filteredData}
        isLoading={isLoading}
        error={error}
        emptyMessage="No job roles found."
        skeletonRowCount={4}
      />

      <Dialog
        open={crud.isDialogOpen}
        onOpenChange={crud.closeDialog}
        title={crud.editingItem ? 'Edit Job Role' : 'Add Job Role'}
        description="Configure titles and designations available in the organization."
        footer={
          <DialogFooterActions
            onCancel={crud.closeDialog}
            onSave={handleSave}
            isEditing={!!crud.editingItem}
            label="Job Role"
            isSaveDisabled={!isFormValid}
          />
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <AdminInput
            label="Role Code"
            required
            value={crud.formData.code}
            onChange={v => crud.setField('code', v)}
            placeholder="e.g. ROLE-SE"
          />
          <AdminInput
            label="Job Title"
            required
            value={crud.formData.name}
            onChange={v => crud.setField('name', v)}
            placeholder="e.g. Software Engineer"
          />
          <AdminToggle
            label="Active Status"
            hint="Inactive Job Roles will be hidden from normal operations."
            checked={crud.formData.isActive}
            onChange={v => crud.setField('isActive', v)}
          />
        </div>
      </Dialog>
    </AdminMasterLayout>
  );
};

export default JobRolePage;
