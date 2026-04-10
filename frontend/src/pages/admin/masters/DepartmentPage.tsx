import React, { useState, useMemo } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { useDepartments, useBusinessUnits } from '@/queries/admin/useAdminMasters';
import { Department } from '@/api/admin-mock-api';
import { useAdminCRUD } from '@/hooks/admin/useAdminCRUD';
import { AdminMasterLayout } from '@/components/admin/layout/AdminMasterLayout';
import { AdminDataTable, DataTableColumn } from '@/components/admin/layout/AdminDataTable';
import { AdminInput, AdminSelect, AdminToggle, DialogFooterActions } from '@/components/admin/form';
import { Dialog } from '@/components/ui/dialog';

/* ── Form shape ──────────────────────────────────────────────── */
interface DeptForm {
  name: string;
  code: string;
  description: string;
  businessUnitId: string;
  parentId: string;
  isActive: boolean;
}

const EMPTY_FORM: DeptForm = { 
  name: '', 
  code: '', 
  description: '', 
  businessUnitId: '', 
  parentId: '', 
  isActive: true 
};

/* ── Tree View Types ────────────────────────────────────────── */
interface TreeRow {
  data: Department;
  depth: number;
  hasChildren: boolean;
}

/* ── Page ────────────────────────────────────────────────────── */
const DepartmentPage: React.FC = () => {
  const { data: departments, isLoading, error } = useDepartments();
  const { data: businessUnits } = useBusinessUnits();
  
  const crud = useAdminCRUD<Department, DeptForm>({
    emptyForm: EMPTY_FORM,
    mapToForm: d => ({ 
      name: d.name, 
      code: d.code, 
      description: d.description, 
      businessUnitId: d.businessUnitId,
      parentId: d.parentId || '',
      isActive: d.isActive 
    }),
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  /* ── Tree Expansion Handler ── */
  const toggleExpand = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  /* ── Get BU Label ── */
  const getBUName = (buId: string) => businessUnits?.find(bu => bu.id === buId)?.name || 'Unknown BU';

  /* ── Tree View Logic (Identical to original) ── */
  const visibleTreeList = useMemo(() => {
    if (!departments) return [];

    const hasSearch = searchTerm.trim().length > 0;
    const hasStatusFilter = statusFilter !== 'all';

    let workingSet = departments;

    if (hasSearch || hasStatusFilter) {
      workingSet = departments.filter(d => {
        const matchesSearch = !hasSearch || (d.name+d.code).toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = !hasStatusFilter || (statusFilter === 'active' ? d.isActive : !d.isActive);
        return matchesSearch && matchesStatus;
      });

      return workingSet.map(d => ({ data: d, depth: 0, hasChildren: false }));
    }

    const map: Record<string, Department[]> = {};
    departments.forEach(d => {
      const pId = d.parentId || 'root';
      if (!map[pId]) map[pId] = [];
      map[pId].push(d);
    });

    const result: TreeRow[] = [];
    const traverse = (parentId: string, currentDepth: number) => {
      const children = map[parentId] || [];
      children.forEach(child => {
        const childHasChildren = !!map[child.id] && map[child.id].length > 0;
        result.push({ data: child, depth: currentDepth, hasChildren: childHasChildren });
        if (expandedIds.has(child.id)) {
          traverse(child.id, currentDepth + 1);
        }
      });
    };

    traverse('root', 0);
    return result;
  }, [departments, expandedIds, searchTerm, statusFilter]);

  /* ── Column definitions ──────────────────────────────────────── */
  const columns: DataTableColumn<TreeRow>[] = [
    {
      type: 'custom',
      header: 'Department Name',
      render: (row) => {
        const { data: dept, depth, hasChildren } = row;
        const isExpanded = expandedIds.has(dept.id);
        return (
          <div 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              paddingLeft: `${depth * 28}px`,
              fontWeight: depth === 0 ? 600 : 400,
              color: 'var(--color-text-primary)'
            }}
          >
            {hasChildren ? (
              <button 
                onClick={(e) => toggleExpand(dept.id, e)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--color-text-muted)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '4px',
                  marginRight: '6px',
                  borderRadius: '4px',
                }}
              >
                {isExpanded ? <ChevronDown size={14} strokeWidth={3} /> : <ChevronRight size={14} strokeWidth={3} />}
              </button>
            ) : (
              <div style={{ width: '22px', marginRight: '6px' }} />
            )}
            {dept.name}
          </div>
        );
      }
    },
    {
      type: 'custom',
      header: 'Code',
      render: (row) => <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', fontWeight: 600 }}>{row.data.code}</span>
    },
    {
      type: 'custom',
      header: 'Business Unit',
      render: (row) => <span style={{ fontSize: '13px' }}>{getBUName(row.data.businessUnitId)}</span>
    },
    {
      type: 'custom',
      header: 'Status',
      width: '110px',
      render: (row) => (
        <span style={{ 
          display: 'inline-flex', padding: '3px 10px', borderRadius: 'var(--radius-full)', 
          background: row.data.isActive ? 'rgba(26,158,58,0.10)' : 'var(--color-surface-alt)',
          color: row.data.isActive ? '#15803d' : 'var(--color-text-muted)',
          fontSize: '11px', fontWeight: 600 
        }}>
          {row.data.isActive ? 'Active' : 'Inactive'}
        </span>
      )
    },
    {
      type: 'actions',
      onEdit: (row) => crud.openDialog(row.data)
    }
  ];

  /* ── Save handler ── */
  const handleSave = () => {
    console.log(crud.editingItem ? 'Update:' : 'Create:', crud.formData);
    crud.closeDialog();
  };

  const isFormValid = !!(crud.formData.name.trim() && crud.formData.code.trim() && crud.formData.businessUnitId);

  return (
    <AdminMasterLayout
      title="Departments"
      description="Organize the company structure using hierarchical departments."
      breadcrumbs={[
        { label: 'Admin', href: '/admin' },
        { label: 'Organization' },
        { label: 'Departments' },
      ]}
      addLabel="Add Department"
      onAdd={() => crud.openDialog()}
      searchPlaceholder="Search Departments..."
      searchTerm={searchTerm}
      onSearchChange={setSearchTerm}
      resultCount={visibleTreeList.length}
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
      {/* ── Data Table (Tree View) ── */}
      <AdminDataTable<TreeRow>
        rowKey={(row) => row.data.id}
        columns={columns}
        data={visibleTreeList}
        isLoading={isLoading}
        error={error}
        emptyMessage="No departments found."
        skeletonRowCount={5}
      />

      {/* ── Add / Edit Dialog ── */}
      <Dialog
        open={crud.isDialogOpen}
        onOpenChange={crud.closeDialog}
        title={crud.editingItem ? 'Edit Department' : 'Add Department'}
        description="Configure departmental hierarchy and mappings."
        footer={
          <DialogFooterActions
            onCancel={crud.closeDialog}
            onSave={handleSave}
            isEditing={!!crud.editingItem}
            label="Department"
            isSaveDisabled={!isFormValid}
          />
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <AdminInput
            label="Department Code"
            required
            value={crud.formData.code}
            onChange={v => crud.setField('code', v)}
            placeholder="e.g. DEP-MKT"
          />
          <AdminInput
            label="Department Name"
            required
            value={crud.formData.name}
            onChange={v => crud.setField('name', v)}
            placeholder="e.g. Marketing"
          />
          <AdminSelect
            label="Business Unit"
            required
            value={crud.formData.businessUnitId}
            onChange={v => crud.setField('businessUnitId', v)}
            options={businessUnits?.map(bu => ({ label: bu.name, value: bu.id })) || []}
          />
          <AdminSelect
            label="Parent Department"
            value={crud.formData.parentId}
            onChange={v => crud.setField('parentId', v)}
            options={departments?.filter(d => d.id !== crud.editingItem?.id).map(d => ({ label: d.name, value: d.id })) || []}
            placeholder="None (Top Level)"
          />

          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea
              className="form-input"
              style={{ height: '80px', paddingTop: '8px', resize: 'none' }}
              placeholder="Brief description of functions..."
              value={crud.formData.description}
              onChange={e => crud.setField('description', e.target.value)}
            />
          </div>

          <AdminToggle
            label="Active Status"
            checked={crud.formData.isActive}
            onChange={v => crud.setField('isActive', v)}
          />
        </div>
      </Dialog>
    </AdminMasterLayout>
  );
};

export default DepartmentPage;
