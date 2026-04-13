import React, { useState } from "react";
import {
  useJobRoles,
  useSkills,
  useSkillLevels,
  useJobRoleSkills,
} from "@/queries/admin/useAdminMasters";
import { JobRole } from "@/api/admin-mock-api";
import { useAdminCRUD } from "@/hooks/admin/useAdminCRUD";
import { AdminMasterLayout } from "@/components/admin/layout/AdminMasterLayout";
import {
  AdminDataTable,
  DataTableColumn,
} from "@/components/admin/layout/AdminDataTable";
import {
  AdminInput,
  AdminToggle,
  DialogFooterActions,
} from "@/components/admin/form";
import { Dialog } from "@/components/ui/dialog";
import { CellScrollArea } from "@/components/ui/cell-scroll-area";
import { SkillTag } from "@/components/ui/skill-tag";
import {
  UnifiedSkillMappingModal,
  SkillMappingEntry,
} from "@/components/admin/UnifiedSkillMappingModal";

/* ── Form shape ──────────────────────────────────────────────── */
interface JobRoleForm {
  name: string;
  code: string;
  isActive: boolean;
}

const EMPTY_FORM: JobRoleForm = {
  name: "",
  code: "",
  isActive: true,
};

/* ── Column definitions ──────────────────────────────────────── */
const buildColumns = (
  onEdit: (role: JobRole) => void,
  onMap: (role: JobRole) => void,
  allSkills: any[],
  roleSkills: any[],
): DataTableColumn<JobRole>[] => [
  { 
    type: "custom", 
    header: "Designation", 
    cellStyle: { fontWeight: 600, color: "var(--color-text-primary)" },
    render: (role) => (
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <span style={{ fontSize: '14px' }}>{role.name}</span>
        <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>{role.code}</span>
      </div>
    )
  },
  {
    type: "custom",
    header: "Required Skills",
    render: (role) => {
      const mapped = roleSkills.filter((rs) => rs.jobRoleId === role.id);
      return (
        <CellScrollArea style={{ maxWidth: "500px" }}>
          {mapped.length === 0 ? (
            <span
              style={
                {
                  fontSize: "11px",
                  color: "var(--color-text-muted)",
                  italic: "true",
                } as any
              }
            >
              No skills mapped
            </span>
          ) : (
            mapped.map((m) => {
              const s = allSkills.find((sk) => sk.id === m.skillId);
              return s ? <SkillTag key={m.id} name={s.name} /> : null;
            })
          )}
        </CellScrollArea>
      );
    },
  },
  { type: "status", key: "isActive", header: "Status", width: "110px" },
  { type: "actions", onEdit, onMap },
];

const JobRolePage: React.FC = () => {
  const { data: jobRoles, isLoading, error } = useJobRoles();
  const { data: allSkills = [] } = useSkills();
  const { data: allLevels = [] } = useSkillLevels();
  const { data: roleSkills = [] } = useJobRoleSkills();

  const [mappingRole, setMappingRole] = useState<JobRole | null>(null);
  const [isMappingOpen, setIsMappingOpen] = useState(false);

  const crud = useAdminCRUD<JobRole, JobRoleForm>({
    emptyForm: EMPTY_FORM,
    mapToForm: (role) => ({
      name: role.name,
      code: role.code,
      isActive: role.isActive,
    }),
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  /* ── Filtering ── */
  const filteredData = jobRoles?.filter((role) => {
    const matchesSearch = (role.name + role.code)
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || (statusFilter === "active") === role.isActive;
    return matchesSearch && matchesStatus;
  });

  /* ── Save handler ── */
  const handleSave = () => {
    console.log(crud.editingItem ? "Update:" : "Create:", crud.formData);
    crud.closeDialog();
  };

  const isFormValid = !!(
    crud.formData.name.trim() && crud.formData.code.trim()
  );

  /* ── Mapping logic ── */
  const handleOpenMapping = (role: JobRole) => {
    setMappingRole(role);
    setIsMappingOpen(true);
  };

  const currentMappings: SkillMappingEntry[] = roleSkills
    .filter((rs) => rs.jobRoleId === mappingRole?.id)
    .map((rs) => ({ skillId: rs.skillId, levelId: rs.requiredLevelId }));

  const handleSaveMapping = (mappings: SkillMappingEntry[]) => {
    console.log("Saving Job Role Skills for", mappingRole?.name, mappings);
    // Logic to update backend would go here
  };

  return (
    <AdminMasterLayout
      title="Job Roles"
      description="Define and manage company designations and job titles."
      breadcrumbs={[
        { label: "Admin", href: "/admin" },
        { label: "Organization" },
        { label: "Job Roles" },
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
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{ width: "140px", cursor: "pointer", flexShrink: 0 }}
        >
          <option value="all">Status: All</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      }
    >
      <AdminDataTable<JobRole>
        rowKey="id"
        columns={buildColumns(
          crud.openDialog,
          handleOpenMapping,
          allSkills,
          roleSkills,
        )}
        data={filteredData}
        isLoading={isLoading}
        error={error}
        emptyMessage="No job roles found."
        skeletonRowCount={4}
      />

      {/* ── Mapping Modal ── */}
      <UnifiedSkillMappingModal
        open={isMappingOpen}
        onClose={() => setIsMappingOpen(false)}
        title={`Map Required Skills: ${mappingRole?.name}`}
        description="Specify proficiency requirements for this designation."
        type="ROLE"
        allSkills={allSkills}
        allLevels={allLevels}
        initialMappings={currentMappings}
        onSave={handleSaveMapping}
      />

      <Dialog
        open={crud.isDialogOpen}
        onOpenChange={crud.closeDialog}
        title={crud.editingItem ? "Edit Job Role" : "Add Job Role"}
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
        <div style={{ display: "flex", flexDirection: "column" }}>
          <AdminInput
            label="Role Code"
            required
            value={crud.formData.code}
            onChange={(v) => crud.setField("code", v)}
            placeholder="e.g. ROLE-SE"
          />
          <AdminInput
            label="Job Title"
            required
            value={crud.formData.name}
            onChange={(v) => crud.setField("name", v)}
            placeholder="e.g. Software Engineer"
          />
          <AdminToggle
            label="Active Status"
            hint="Inactive Job Roles will be hidden from normal operations."
            checked={crud.formData.isActive}
            onChange={(v) => crud.setField("isActive", v)}
          />
        </div>
      </Dialog>
    </AdminMasterLayout>
  );
};

export default JobRolePage;
