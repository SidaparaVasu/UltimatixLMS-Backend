import React, { useState } from 'react';
import { useLocations } from '@/queries/admin/useAdminMasters';
import { Location } from '@/api/admin-mock-api';
import { useAdminCRUD } from '@/hooks/admin/useAdminCRUD';
import { AdminMasterLayout } from '@/components/admin/layout/AdminMasterLayout';
import { AdminDataTable, DataTableColumn } from '@/components/admin/layout/AdminDataTable';
import { AdminInput, AdminToggle, DialogFooterActions } from '@/components/admin/form';
import { Dialog } from '@/components/ui/dialog';

/* ── Form shape ──────────────────────────────────────────────── */
interface LocationForm {
  name: string;
  code: string;
  city: string;
  country: string;
  isActive: boolean;
}

const EMPTY_FORM: LocationForm = { 
  name: '', 
  code: '', 
  city: '', 
  country: '', 
  isActive: true 
};

/* ── Column definitions ──────────────────────────────────────── */
const buildColumns = (
  onEdit: (loc: Location) => void
): DataTableColumn<Location>[] => [
  { type: 'id',     key: 'code',     header: 'Location Code', width: '150px' },
  { type: 'text',   key: 'name',     header: 'Location Name', cellStyle: { fontWeight: 600, color: 'var(--color-text-primary)' } },
  { 
    type: 'custom', 
    header: 'City, Country', 
    render: (loc) => <span>{loc.city}, {loc.country}</span> 
  },
  { type: 'status', key: 'isActive', header: 'Status', width: '110px' },
  { type: 'actions', onEdit },
];

const LocationPage: React.FC = () => {
  const { data: locations, isLoading, error } = useLocations();

  const crud = useAdminCRUD<Location, LocationForm>({
    emptyForm: EMPTY_FORM,
    mapToForm: loc => ({ 
      name: loc.name, 
      code: loc.code, 
      city: loc.city, 
      country: loc.country, 
      isActive: loc.isActive 
    }),
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  /* ── Filtering ── */
  const filteredData = locations?.filter(loc => {
    const matchesSearch = (loc.name + loc.code + loc.city).toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || (statusFilter === 'active') === loc.isActive;
    return matchesSearch && matchesStatus;
  });

  /* ── Save handler ── */
  const handleSave = () => {
    console.log(crud.editingItem ? 'Update:' : 'Create:', crud.formData);
    crud.closeDialog();
  };

  const isFormValid = !!(
    crud.formData.name.trim() && 
    crud.formData.code.trim() && 
    crud.formData.city.trim() && 
    crud.formData.country.trim()
  );

  return (
    <AdminMasterLayout
      title="Unit Locations"
      description="Manage physical office locations and remote hubs across the organization."
      breadcrumbs={[
        { label: 'Admin', href: '/admin' },
        { label: 'Organization' },
        { label: 'Unit Locations' },
      ]}
      addLabel="Add Unit Location"
      onAdd={() => crud.openDialog()}
      searchPlaceholder="Search by Location Name, Code, or City..."
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
      <AdminDataTable<Location>
        rowKey="id"
        columns={buildColumns(crud.openDialog)}
        data={filteredData}
        isLoading={isLoading}
        error={error}
        emptyMessage="No locations found."
        skeletonRowCount={4}
      />

      <Dialog
        open={crud.isDialogOpen}
        onOpenChange={crud.closeDialog}
        title={crud.editingItem ? 'Edit Unit Location' : 'Add Unit Location'}
        description="Provide the geographical details for this company site."
        footer={
          <DialogFooterActions
            onCancel={crud.closeDialog}
            onSave={handleSave}
            isEditing={!!crud.editingItem}
            label="Unit Location"
            isSaveDisabled={!isFormValid}
          />
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <AdminInput
            label="Unit Location Code"
            required
            value={crud.formData.code}
            onChange={v => crud.setField('code', v)}
            placeholder="e.g. MUM-BDRA"
          />
          <AdminInput
            label="Unit Location Name"
            required
            value={crud.formData.name}
            onChange={v => crud.setField('name', v)}
            placeholder="e.g. Mumbai Office"
          />
          <AdminInput
            label="City"
            required
            value={crud.formData.city}
            onChange={v => crud.setField('city', v)}
            placeholder="e.g. Mumbai"
          />
          <AdminInput
            label="Country"
            required
            value={crud.formData.country}
            onChange={v => crud.setField('country', v)}
            placeholder="e.g. India"
          />
          <AdminToggle
            label="Active Status"
            hint="Inactive Unit Locations will be hidden from normal operations."
            checked={crud.formData.isActive}
            onChange={v => crud.setField('isActive', v)}
          />
        </div>
      </Dialog>
    </AdminMasterLayout>
  );
};

export default LocationPage;
