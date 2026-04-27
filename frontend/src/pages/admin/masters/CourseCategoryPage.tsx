import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCourseCategories, ADMIN_QUERY_KEYS } from '@/queries/admin/useAdminMasters';
import { courseApi } from '@/api/course-api';
import { CourseCategory } from '@/types/courses.types';
import { useAdminCRUD } from '@/hooks/admin/useAdminCRUD';
import { AdminMasterLayout } from '@/components/admin/layout/AdminMasterLayout';
import { AdminDataTable, DataTableColumn } from '@/components/admin/layout/AdminDataTable';
import { AdminInput, AdminToggle, DialogFooterActions } from '@/components/admin/form';
import { Dialog } from '@/components/ui/dialog';

/* ── Form shape ──────────────────────────────────────────────── */
interface CategoryForm {
  category_name: string;
  category_code: string;
  description: string;
  is_active: boolean;
}

const EMPTY_FORM: CategoryForm = {
  category_name: '',
  category_code: '',
  description: '',
  is_active: true,
};

/* ── Column definitions ──────────────────────────────────────── */
const buildColumns = (
  onEdit: (cat: CourseCategory) => void,
  onDelete: (cat: CourseCategory) => void,
): DataTableColumn<CourseCategory>[] => [
  { type: 'id',     key: 'category_code', header: 'Code', width: '130px' },
  { type: 'text',   key: 'category_name', header: 'Category Name', cellStyle: { fontWeight: 600, color: 'var(--color-text-primary)' } },
  { type: 'text',   key: 'description',   header: 'Description' },
  { 
    type: 'custom', 
    header: 'Courses', 
    width: '100px',
    render: (cat) => <span className="font-bold">{cat.course_count || 0}</span> 
  },
  { type: 'status', key: 'is_active',    header: 'Status', width: '110px' },
  { type: 'actions', onEdit, onDelete },
];

const CourseCategoryPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const pageSize = 12;

  const { data: response, isLoading, error } = useCourseCategories({ page, page_size: pageSize });
  const categories = response?.results || [];

  /* ── Mutations ── */
  const saveMutation = useMutation({
    mutationFn: (data: Partial<CourseCategory>) => 
      data.id 
        ? courseApi.updateCategory(data.id, data) 
        : courseApi.createCategory(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.courseCategories });
      crud.closeDialog();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => courseApi.deleteCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.courseCategories });
    },
  });

  const crud = useAdminCRUD<CourseCategory, CategoryForm>({
    emptyForm: EMPTY_FORM,
    mapToForm: (cat) => ({
      category_name: cat.category_name,
      category_code: cat.category_code,
      description: cat.description,
      is_active: cat.is_active,
    }),
  });

  const [searchTerm, setSearchTerm] = useState('');

  /* ── Filtering ── */
  const filteredData = categories?.filter((cat) => {
    const q = searchTerm.toLowerCase();
    return (
      cat.category_name.toLowerCase().includes(q) || 
      cat.category_code.toLowerCase().includes(q)
    );
  });

  const handleSave = () => {
    saveMutation.mutate({
      ...crud.formData,
      id: crud.editingItem?.id,
    });
  };

  const isFormValid = !!(crud.formData.category_name?.trim() && crud.formData.category_code?.trim());

  return (
    <AdminMasterLayout
      title="Course Categories"
      description="Manage logical buckets for organizing your content library."
      breadcrumbs={[
        { label: 'Admin', href: '/admin' },
        { label: 'Courses' },
        { label: 'Categories' },
      ]}
      addLabel="New Category"
      onAdd={() => crud.openDialog()}
      searchPlaceholder="Search categories..."
      searchTerm={searchTerm}
      onSearchChange={setSearchTerm}
      resultCount={filteredData?.length}
    >
      <AdminDataTable<CourseCategory>
          rowKey="id"
          columns={buildColumns(crud.openDialog, (cat) => deleteMutation.mutate(cat.id))}
          data={filteredData}
          isLoading={isLoading}
          error={error}
          emptyMessage="No categories found."
          skeletonRowCount={4}
        />

      {/* ── Add/Edit Dialog ── */}
      <Dialog
        open={crud.isDialogOpen}
        onOpenChange={crud.closeDialog}
        title={crud.editingItem ? "Edit Category" : "Add Category"}
        description="Categories help structure your course library into logical topics."
        footer={
          <DialogFooterActions
            onCancel={crud.closeDialog}
            onSave={handleSave}
            isEditing={!!crud.editingItem}
            label="Category"
            isSaveDisabled={!isFormValid}
          />
        }
      >
        <div className="flex flex-col">
          <AdminInput
              label="Category Name"
              required
              value={crud.formData.category_name}
              onChange={(v) => crud.setField('category_name', v)}
              placeholder="e.g. Technical Skills"
            />
          <AdminInput
              label="Category Code"
              required
              value={crud.formData.category_code}
              onChange={(v) => crud.setField('category_code', v)}
              placeholder="e.g. CAT-TECH"
            />
          <AdminInput
            label="Description"
            value={crud.formData.description}
            onChange={(v) => crud.setField('description', v)}
            placeholder="Briefly describe what courses fall under this category..."
          />
          <AdminToggle
            label="Active Status"
            hint="Inactive categories will be hidden from the learner portal."
            checked={crud.formData.is_active}
            onChange={(v) => crud.setField('is_active', v)}
          />
        </div>
      </Dialog>
    </AdminMasterLayout>
  );
};

export default CourseCategoryPage;
