import React, { useState } from 'react';
import { useBusinessUnits } from '@/queries/admin/useAdminMasters';
import { BusinessUnit } from '@/api/admin-mock-api';
import { useAdminCRUD } from '@/hooks/admin/useAdminCRUD';
import { AdminMasterLayout } from '@/components/admin/layout/AdminMasterLayout';
import { AdminDataTable, DataTableColumn } from '@/components/admin/layout/AdminDataTable';
import { AdminInput, AdminToggle, DialogFooterActions } from '@/components/admin/form';
import { Dialog } from '@/components/ui/dialog';

/* ── Form shape ──────────────────────────────────────────────── */
interface BUForm {
  name: string;
  code: string;
  description: string;
  isActive: boolean;
}

const EMPTY_FORM: BUForm = { name: '', code: '', description: '', isActive: true };

/* ── Column definitions ──────────────────────────────────────── */
const buildColumns = (
  onEdit: (bu: BusinessUnit) => void
): DataTableColumn<BusinessUnit>[] => [
  { type: 'id',     key: 'code',     header: 'Unit Code', width: '130px' },
  { type: 'text',   key: 'name',     header: 'Business Unit', cellStyle: { fontWeight: 600, color: 'var(--color-text-primary)' } },
  { type: 'text',   key: 'description', header: 'Description' },
  { type: 'status', key: 'isActive', header: 'Status', width: '110px' },
  { type: 'actions', onEdit },
];

/* ── Page ────────────────────────────────────────────────────── */
const BusinessUnitPage: React.FC = () => {
  const { data: businessUnits, isLoading, error } = useBusinessUnits();

  const crud = useAdminCRUD<BusinessUnit, BUForm>({
    emptyForm: EMPTY_FORM,
    mapToForm: bu => ({ name: bu.name, code: bu.code, description: bu.description, isActive: bu.isActive }),
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  /* ── Filtering ── */
  const filteredData = businessUnits?.filter(bu => {
    const matchesSearch = (bu.name + bu.code).toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || (statusFilter === 'active') === bu.isActive;
    return matchesSearch && matchesStatus;
  });

  /* ── Save handler (replace with useMutation when API is ready) ── */
  const handleSave = () => {
    console.log(crud.editingItem ? 'Update:' : 'Create:', crud.formData);
    crud.closeDialog();
  };

  const isFormValid = !!(crud.formData.name.trim() && crud.formData.code.trim());

  return (
    <AdminMasterLayout
      title="Business Units"
      description="Manage the top-level organizational divisions within the company."
      breadcrumbs={[
        { label: 'Admin', href: '/admin' },
        { label: 'Organization' },
        { label: 'Business Units' },
      ]}
      addLabel="Add Business Unit"
      onAdd={() => crud.openDialog()}
      searchPlaceholder="Search by name or code..."
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
      {/* ── Data Table ── */}
      <AdminDataTable<BusinessUnit>
        rowKey="id"
        columns={buildColumns(crud.openDialog)}
        data={filteredData}
        isLoading={isLoading}
        error={error}
        emptyMessage="No business units found."
        skeletonRowCount={4}
      />

      {/* ── Add / Edit Dialog ── */}
      <Dialog
        open={crud.isDialogOpen}
        onOpenChange={crud.closeDialog}
        title={crud.editingItem ? 'Edit Business Unit' : 'Add Business Unit'}
        description="Enter the details for the business unit below."
        footer={
          <DialogFooterActions
            onCancel={crud.closeDialog}
            onSave={handleSave}
            isEditing={!!crud.editingItem}
            label="Business Unit"
            isSaveDisabled={!isFormValid}
          />
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <AdminInput
            label="Business Unit Code"
            required
            value={crud.formData.code}
            onChange={v => crud.setField('code', v)}
            placeholder="e.g. BU-ENG"
          />
          <AdminInput
            label="Business Unit Name"
            required
            value={crud.formData.name}
            onChange={v => crud.setField('name', v)}
            placeholder="e.g. Engineering"
          />
          {/* Textarea for description — AdminInput doesn't cover textarea, use inline */}
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea
              className="form-input"
              style={{ height: '80px', paddingTop: '8px', resize: 'none' }}
              placeholder="Brief description of this unit's functions..."
              value={crud.formData.description}
              onChange={e => crud.setField('description', e.target.value)}
            />
          </div>
          <AdminToggle
            label="Active Status"
            hint="Inactive Business Units will be hidden from normal operations."
            checked={crud.formData.isActive}
            onChange={v => crud.setField('isActive', v)}
          />
        </div>
      </Dialog>
    </AdminMasterLayout>
  );
};

export default BusinessUnitPage;
