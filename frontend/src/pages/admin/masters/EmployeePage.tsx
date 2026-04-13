import React, { useState } from "react";
import {
  ChevronRight,
  ChevronLeft,
  User,
  Building2,
  Network,
  Check,
} from "lucide-react";
import {
  useEmployees,
  useDepartments,
  useJobRoles,
  useBusinessUnits,
  useLocations,
  useSkills,
  useSkillLevels,
  useEmployeeSkills,
} from "@/queries/admin/useAdminMasters";
import { Employee } from "@/api/admin-mock-api";
import { AdminMasterLayout } from "@/components/admin/layout/AdminMasterLayout";
import {
  AdminDataTable,
  DataTableColumn,
} from "@/components/admin/layout/AdminDataTable";
import { AdminInput, AdminSelect, AdminToggle } from "@/components/admin/form";
import { Dialog } from "@/components/ui/dialog";
import { Drawer } from "@/components/ui/drawer";
import { ProficiencyBadge } from "@/components/ui/proficiency-badge";
import { UnifiedSkillMappingModal, SkillMappingEntry } from "@/components/admin/UnifiedSkillMappingModal";

/* ─────────────────────────────────────────────────────────────
   FORM SHAPE
───────────────────────────────────────────────────────────── */
interface EmpForm {
  username: string;
  password: string;
  firstName: string;
  lastName: string;
  email: string;
  mobile_no: string;
  profile_image: string;
  date_of_birth: string;
  gender: string;
  employeeCode: string;
  company: string;
  businessUnitId: string;
  departmentId: string;
  roleId: string;
  locationId: string;
  managerId: string;
  joiningDate: string;
  isActive: boolean;
}

const EMPTY_FORM: EmpForm = {
  username: "",
  password: "",
  firstName: "",
  lastName: "",
  email: "",
  mobile_no: "",
  profile_image: "",
  date_of_birth: "",
  gender: "",
  employeeCode: "",
  company: "Ultimatix Global",
  businessUnitId: "",
  departmentId: "",
  roleId: "",
  locationId: "",
  managerId: "",
  joiningDate: "",
  isActive: true,
};

/* ─────────────────────────────────────────────────────────────
   DRAWER — read-only detail field pair
───────────────────────────────────────────────────────────── */
const DetailField: React.FC<{
  label: string;
  value: string;
  capitalize?: boolean;
}> = ({ label, value, capitalize }) => (
  <div>
    <div
      style={{
        fontSize: "12px",
        color: "var(--color-text-muted)",
        marginBottom: "4px",
      }}
    >
      {label}
    </div>
    <div
      style={{
        fontSize: "14px",
        fontWeight: 500,
        textTransform: capitalize ? "capitalize" : undefined,
      }}
    >
      {value || "-"}
    </div>
  </div>
);

const SectionHeader: React.FC<{ title: string }> = ({ title }) => (
  <h4
    style={{
      fontSize: "12px",
      textTransform: "uppercase",
      color: "var(--color-text-muted)",
      fontWeight: 700,
      letterSpacing: "0.05em",
      marginBottom: "var(--space-3)",
    }}
  >
    {title}
  </h4>
);

const TwoColGrid: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div
    style={{
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: "var(--space-4)",
    }}
  >
    {children}
  </div>
);

/* ─────────────────────────────────────────────────────────────
   MAIN PAGE
───────────────────────────────────────────────────────────── */
const EmployeePage: React.FC = () => {
  const { data: employees, isLoading, error } = useEmployees();
  const { data: departments } = useDepartments();
  const { data: jobRoles } = useJobRoles();
  const { data: businessUnits } = useBusinessUnits();
  const { data: locations } = useLocations();
  const { data: allSkills = [] } = useSkills();
  const { data: allLevels = [] } = useSkillLevels();
  const { data: empSkills = [] } = useEmployeeSkills();
  
  /* ── Mapping state ── */
  const [mappingEmp, setMappingEmp] = useState<Employee | null>(null);
  const [isMappingOpen, setIsMappingOpen] = useState(false);

  /* ── Local state (can't use useAdminCRUD — multi-step needs currentStep) ── */
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    status: "all",
    businessUnit: "all",
    department: "all",
    location: "all",
    role: "all",
  });
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEmp, setEditingEmp] = useState<Employee | null>(null);
  const [isViewDrawerOpen, setIsViewDrawerOpen] = useState(false);
  const [viewingEmp, setViewingEmp] = useState<Employee | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<EmpForm>({ ...EMPTY_FORM });

  /* ── Helpers ── */
  const setField = <K extends keyof EmpForm>(k: K, v: EmpForm[K]) =>
    setFormData((prev) => ({ ...prev, [k]: v }));

  const getDeptName = (id: string) =>
    departments?.find((d) => d.id === id)?.name || "-";
  const getRoleName = (id: string) =>
    jobRoles?.find((r) => r.id === id)?.name || "-";
  const getBuName = (id: string) =>
    businessUnits?.find((b) => b.id === id)?.name || "-";
  const getLocName = (id: string) =>
    locations?.find((l) => l.id === id)?.name || "-";
  const getManagerName = (id: string | null) => {
    if (!id) return "-";
    const m = employees?.find((e) => e.id === id);
    return m ? `${m.firstName} ${m.lastName}` : "-";
  };

  /* ── Validation ── */
  const isStep1Valid = !!(
    formData.username.trim() &&
    (editingEmp || formData.password.trim()) &&
    formData.firstName.trim() &&
    formData.lastName.trim() &&
    formData.email.trim() &&
    formData.mobile_no.trim()
  );
  const isStep2Valid = !!(
    formData.employeeCode.trim() &&
    formData.locationId &&
    formData.businessUnitId &&
    formData.departmentId &&
    formData.roleId
  );
  const isAllValid = isStep1Valid && isStep2Valid;

  /* ── Dialog open/close ── */
  const openDialog = (emp?: Employee) => {
    setCurrentStep(1);
    if (emp) {
      setEditingEmp(emp);
      setFormData({
        username: emp.username || "",
        password: "",
        firstName: emp.firstName,
        lastName: emp.lastName,
        email: emp.email,
        mobile_no: emp.mobile_no || "",
        profile_image: emp.profile_image || "",
        date_of_birth: emp.date_of_birth || "",
        gender: emp.gender || "",
        employeeCode: emp.employeeCode,
        company: "Ultimatix Global",
        businessUnitId: emp.businessUnitId || "",
        departmentId: emp.departmentId,
        roleId: emp.roleId,
        locationId: emp.locationId || "",
        joiningDate: (emp as any).joiningDate || "",
        managerId: emp.managerId || "",
        isActive: emp.isActive,
      });
    } else {
      setEditingEmp(null);
      setFormData({ ...EMPTY_FORM });
    }
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setTimeout(() => {
      setEditingEmp(null);
      setFormData({ ...EMPTY_FORM });
      setCurrentStep(1);
    }, 200);
  };

  const handleSave = () => {
    console.log(editingEmp ? "Update:" : "Create:", formData);
    closeDialog();
  };

  /* ── Mapping logic ── */
  const handleOpenMapping = (emp: Employee) => {
    setMappingEmp(emp);
    setIsMappingOpen(true);
  };

  const currentMappings: SkillMappingEntry[] = empSkills
    .filter(es => es.employeeId === mappingEmp?.id)
    .map(es => ({ 
      skillId: es.skillId, 
      levelId: es.assessedLevelId,
      status: es.status 
    }));

  const handleSaveMapping = (mappings: SkillMappingEntry[]) => {
    console.log('Saving Employee Skills for', mappingEmp?.firstName, mappings);
    // Logic to update backend would go here
  };

  /* ── Filtering ── */
  const filteredData = employees?.filter((emp) => {
    const q = searchTerm.toLowerCase();
    const matchesSearch =
      `${emp.firstName} ${emp.lastName}`.toLowerCase().includes(q) ||
      emp.employeeCode.toLowerCase().includes(q) ||
      emp.email.toLowerCase().includes(q);
    const matchesStatus =
      filters.status === "all" ||
      (filters.status === "active") === emp.isActive;
    const matchesBU =
      filters.businessUnit === "all" ||
      emp.businessUnitId === filters.businessUnit;
    const matchesDept =
      filters.department === "all" || emp.departmentId === filters.department;
    const matchesLoc =
      filters.location === "all" || emp.locationId === filters.location;
    const matchesRole = filters.role === "all" || emp.roleId === filters.role;
    return (
      matchesSearch &&
      matchesStatus &&
      matchesBU &&
      matchesDept &&
      matchesLoc &&
      matchesRole
    );
  });

  const activeFilters = Object.entries(filters).filter(([, v]) => v !== "all");
  const getFilterLabel = (key: string, val: string) => {
    const map: Record<string, (v: string) => string> = {
      status: (v) => (v === "active" ? "Active" : "Inactive"),
      department: getDeptName,
      role: getRoleName,
      businessUnit: getBuName,
      location: getLocName,
    };
    return map[key]?.(val) ?? val;
  };

  /* ── Column definitions ── */
  const columns: DataTableColumn<Employee>[] = [
    { type: "id", key: "employeeCode", header: "Emp Code", width: "120px" },
    {
      type: "profile",
      key: "firstName",
      header: "Employee",
      subKey: "email",
      cellStyle: { fontWeight: 600, color: "var(--color-text-primary)" },
    },
    {
      type: "custom",
      header: "Designation",
      render: (emp) => (
        <span style={{ fontSize: "13px" }}>{getRoleName(emp.roleId)}</span>
      ),
    },
    {
      type: "custom",
      header: "Department",
      render: (emp) => (
        <span style={{ fontSize: "13px" }}>
          {getDeptName(emp.departmentId)}
        </span>
      ),
    },
    {
      type: "custom",
      header: "Manager",
      render: (emp) => (
        <span style={{ fontSize: "13px", color: "var(--color-text-muted)" }}>
          {getManagerName(emp.managerId)}
        </span>
      ),
    },
    { type: "status", key: "isActive", header: "Status", width: "100px" },
    {
      type: "actions",
      onView: (emp) => {
        setViewingEmp(emp);
        setIsViewDrawerOpen(true);
      },
      onEdit: openDialog,
      onMap: handleOpenMapping,
    },
  ];

  /* ── Step indicator ── */
  const STEPS = [
    {
      step: 1,
      label: "Basic Information",
      icon: <User size={16} />,
      valid: isStep1Valid,
    },
    {
      step: 2,
      label: "Company Information",
      icon: <Building2 size={16} />,
      valid: isStep2Valid,
    },
    { step: 3, label: "Reporting", icon: <Network size={16} />, valid: true },
  ];

  const renderStepIndicators = () => (
    <div
      style={{
        display: "flex",
        width: "calc(100% + var(--space-6) * 2)",
        margin:
          "calc(-1 * var(--space-6)) calc(-1 * var(--space-6)) var(--space-6) calc(-1 * var(--space-6))",
        borderBottom: "1px solid var(--color-border)",
        background: "var(--color-surface)",
        position: "sticky",
        top: "calc(-1 * var(--space-6))",
        zIndex: 10,
      }}
    >
      {STEPS.map((s) => {
        const isActive = currentStep === s.step;
        const isCompleted = s.valid;
        const color = isCompleted
          ? {
              main: "var(--success)",
              bg: "transparent",
              circleBg: "var(--success)",
              circleText: "#fff",
              border: "var(--success)",
            }
          : isActive
            ? {
                main: "#3b82f6",
                bg: "#eff6ff",
                circleBg: "#3b82f6",
                circleText: "#fff",
                border: "#3b82f6",
              }
            : {
                main: "var(--color-text-muted)",
                bg: "transparent",
                circleBg: "#f1f5f9",
                circleText: "#94a3b8",
                border: "transparent",
              };

        return (
          <div
            key={s.step}
            onClick={() => setCurrentStep(s.step)}
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "12px",
              padding: "16px 8px",
              cursor: "pointer",
              background: color.bg,
              borderBottom: `2px solid ${color.border}`,
              transition: "all 0.2s",
              color: color.main,
            }}
          >
            <div
              style={{
                width: "24px",
                height: "24px",
                borderRadius: "50%",
                background: color.circleBg,
                color: color.circleText,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "12px",
                fontWeight: "bold",
              }}
            >
              {isCompleted ? <Check size={14} strokeWidth={3} /> : s.step}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              {s.icon}
              <span
                style={{ fontSize: "13px", fontWeight: isActive ? 600 : 500 }}
              >
                {s.label}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );

  const GENDER_OPTIONS = [
    { label: "Male", value: "male" },
    { label: "Female", value: "female" },
    { label: "Other", value: "other" },
  ];

  /* ─────────────────────────────────────────────────────────────
     RENDER
  ───────────────────────────────────────────────────────────── */
  return (
    <AdminMasterLayout
      title="Employee Directory"
      description="A unified manifest of all personnel and their corporate reporting lines."
      breadcrumbs={[
        { label: "Admin", href: "/admin" },
        { label: "Workforce" },
        { label: "Employees" },
      ]}
      addLabel="Add Employee"
      onAdd={() => openDialog()}
      searchPlaceholder="Search by Name, Code, or Email..."
      searchTerm={searchTerm}
      onSearchChange={setSearchTerm}
      resultCount={filteredData?.length}
      filterSlot={
        <>
          <select
            className="form-input"
            value={filters.status}
            onChange={(e) =>
              setFilters((p) => ({ ...p, status: e.target.value }))
            }
            style={{ width: "120px", cursor: "pointer", flexShrink: 0 }}
          >
            <option value="all">Status: All</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <select
            className="form-input"
            value={filters.businessUnit}
            onChange={(e) =>
              setFilters((p) => ({ ...p, businessUnit: e.target.value }))
            }
            style={{ width: "120px", cursor: "pointer", flexShrink: 0 }}
          >
            <option value="all">BU: All</option>
            {businessUnits?.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
          <select
            className="form-input"
            value={filters.location}
            onChange={(e) =>
              setFilters((p) => ({ ...p, location: e.target.value }))
            }
            style={{ width: "120px", cursor: "pointer", flexShrink: 0 }}
          >
            <option value="all">Loc: All</option>
            {locations?.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </select>
          <select
            className="form-input"
            value={filters.department}
            onChange={(e) =>
              setFilters((p) => ({ ...p, department: e.target.value }))
            }
            style={{ width: "120px", cursor: "pointer", flexShrink: 0 }}
          >
            <option value="all">Dept: All</option>
            {departments?.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
          <select
            className="form-input"
            value={filters.role}
            onChange={(e) =>
              setFilters((p) => ({ ...p, role: e.target.value }))
            }
            style={{ width: "120px", cursor: "pointer", flexShrink: 0 }}
          >
            <option value="all">Role: All</option>
            {jobRoles?.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        </>
      }
      chips={{
        activeFilters,
        onRemove: (key) => setFilters((p) => ({ ...p, [key]: "all" })),
        onClearAll: () =>
          setFilters({
            status: "all",
            businessUnit: "all",
            department: "all",
            location: "all",
            role: "all",
          }),
        getLabel: getFilterLabel,
        getKeyLabel: (key) => (key === "businessUnit" ? "BU" : key),
      }}
    >
      {/* ── Data Table ── */}
      <AdminDataTable<Employee>
        rowKey="id"
        columns={columns}
        data={filteredData}
        isLoading={isLoading}
        error={error}
        emptyMessage="No employees found."
        skeletonRowCount={5}
      />

      {/* ── Add / Edit Dialog (Multi-Step) ── */}
      <Dialog
        open={isDialogOpen}
        onOpenChange={closeDialog}
        maxWidth="750px"
        title={editingEmp ? "Configure Employee Profile" : "Add New Employee"}
        footer={
          <>
            <button
              onClick={() =>
                currentStep > 1 ? setCurrentStep((c) => c - 1) : closeDialog()
              }
              style={{
                background: "var(--color-surface)",
                border: "1px solid var(--color-border)",
                padding: "8px 16px",
                borderRadius: "var(--radius-md)",
                fontSize: "var(--text-sm)",
                fontWeight: 600,
                cursor: "pointer",
                color: "var(--color-text-primary)",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              {currentStep > 1 ? (
                <>
                  <ChevronLeft size={16} /> Back
                </>
              ) : (
                "Cancel"
              )}
            </button>
            <button
              disabled={currentStep === 3 && !isAllValid}
              onClick={() =>
                currentStep < 3 ? setCurrentStep((c) => c + 1) : handleSave()
              }
              style={{
                background:
                  currentStep === 3 && !isAllValid
                    ? "var(--color-text-muted)"
                    : "var(--color-accent)",
                opacity: currentStep === 3 && !isAllValid ? 0.6 : 1,
                border: "none",
                padding: "8px 16px",
                borderRadius: "var(--radius-md)",
                fontSize: "var(--text-sm)",
                fontWeight: 600,
                cursor:
                  currentStep === 3 && !isAllValid ? "not-allowed" : "pointer",
                color: "#fff",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              {currentStep < 3 ? (
                <>
                  Next Step <ChevronRight size={16} />
                </>
              ) : editingEmp ? (
                "Update Record"
              ) : (
                "Finalize Profile"
              )}
            </button>
          </>
        }
      >
        {renderStepIndicators()}

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            paddingBottom: "80px",
          }}
        >
          {/* ── Step 1: Personal ── */}
          {currentStep === 1 && (
            <div
              className="anim"
              style={{ display: "flex", flexDirection: "column" }}
            >
              <h3
                style={{
                  fontSize: "15px",
                  fontWeight: 600,
                  marginBottom: "var(--space-4)",
                  color: "var(--color-text-primary)",
                }}
              >
                Personal Information
              </h3>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "0 var(--space-4)",
                }}
              >
                <AdminInput
                  label="Username"
                  required
                  value={formData.username}
                  onChange={(v) => setField("username", v)}
                  autoComplete="off"
                />
                <AdminInput
                  label="Password"
                  required={!editingEmp}
                  type="password"
                  value={formData.password}
                  onChange={(v) => setField("password", v)}
                  placeholder={
                    editingEmp ? "Leave blank to keep unchanged" : ""
                  }
                  autoComplete="new-password"
                />
                <AdminInput
                  label="First Name"
                  required
                  value={formData.firstName}
                  onChange={(v) => setField("firstName", v)}
                />
                <AdminInput
                  label="Last Name"
                  required
                  value={formData.lastName}
                  onChange={(v) => setField("lastName", v)}
                />
                <AdminInput
                  label="Email"
                  required
                  type="email"
                  value={formData.email}
                  onChange={(v) => setField("email", v)}
                />
                <AdminInput
                  label="Mobile No."
                  required
                  type="tel"
                  value={formData.mobile_no}
                  onChange={(v) => setField("mobile_no", v)}
                />
                <AdminInput
                  label="Date of Birth"
                  type="date"
                  value={formData.date_of_birth}
                  onChange={(v) => setField("date_of_birth", v)}
                />
                <AdminSelect
                  label="Gender"
                  value={formData.gender}
                  onChange={(v) => setField("gender", v)}
                  options={GENDER_OPTIONS}
                />
                <div className="form-group" style={{ gridColumn: "1 / -1" }}>
                  <label className="form-label">Profile Image</label>
                  <input
                    type="file"
                    accept="image/*"
                    className="form-input"
                    style={{ padding: "6px" }}
                    onChange={(e) => {
                      if (e.target.files?.[0])
                        setField("profile_image", e.target.value);
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* ── Step 2: Org ── */}
          {currentStep === 2 && (
            <div
              className="anim"
              style={{ display: "flex", flexDirection: "column" }}
            >
              <h3
                style={{
                  fontSize: "15px",
                  fontWeight: 600,
                  marginBottom: "var(--space-4)",
                  color: "var(--color-text-primary)",
                }}
              >
                Organizational Assignment
              </h3>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "0 var(--space-4)",
                }}
              >
                <AdminInput
                  label="Employee Code"
                  required
                  value={formData.employeeCode}
                  onChange={(v) => setField("employeeCode", v)}
                  placeholder="e.g. 10107"
                />
                <AdminInput
                  label="Company"
                  value={formData.company}
                  onChange={() => {}}
                  disabled
                />
                <AdminSelect
                  label="Business Unit"
                  required
                  value={formData.businessUnitId}
                  onChange={(v) => setField("businessUnitId", v)}
                  options={
                    businessUnits?.map((b) => ({
                      label: b.name,
                      value: b.id,
                    })) || []
                  }
                />
                <AdminSelect
                  label="Department"
                  required
                  value={formData.departmentId}
                  onChange={(v) => setField("departmentId", v)}
                  options={
                    departments?.map((d) => ({ label: d.name, value: d.id })) ||
                    []
                  }
                />
                <AdminSelect
                  label="Unit Location"
                  required
                  value={formData.locationId}
                  onChange={(v) => setField("locationId", v)}
                  options={
                    locations?.map((l) => ({ label: l.name, value: l.id })) ||
                    []
                  }
                />
                <AdminSelect
                  label="Job Role / Designation"
                  required
                  value={formData.roleId}
                  onChange={(v) => setField("roleId", v)}
                  options={
                    jobRoles?.map((r) => ({ label: r.name, value: r.id })) || []
                  }
                />
                <AdminInput
                  label="Joining Date"
                  type="date"
                  value={formData.joiningDate}
                  onChange={(v) => setField("joiningDate", v)}
                />
              </div>
            </div>
          )}

          {/* ── Step 3: Reporting ── */}
          {currentStep === 3 && (
            <div
              className="anim"
              style={{ display: "flex", flexDirection: "column" }}
            >
              <h3
                style={{
                  fontSize: "15px",
                  fontWeight: 600,
                  marginBottom: "var(--space-4)",
                  color: "var(--color-text-primary)",
                }}
              >
                Assign Reporting Manager
              </h3>
              <AdminSelect
                label="Reporting Manager"
                value={formData.managerId}
                onChange={(v) => setField("managerId", v)}
                placeholder="No Line Manager (Root Node)"
                options={
                  employees
                    ?.filter((e) => e.id !== editingEmp?.id)
                    .map((e) => ({
                      label: `${e.firstName} ${e.lastName} [${e.employeeCode}]`,
                      value: e.id,
                    })) || []
                }
              />
              <AdminToggle
                label="Account Access Status"
                hint="Revoking active status will immediately suspend login capabilities."
                checked={formData.isActive}
                onChange={(v) => setField("isActive", v)}
              />
            </div>
          )}
        </div>
      </Dialog>

      {/* ── View Employee Drawer ── */}
      <Drawer
        open={isViewDrawerOpen}
        onOpenChange={(op) => {
          setIsViewDrawerOpen(op);
          if (!op) setTimeout(() => setViewingEmp(null), 300);
        }}
        title="Employee Details"
        position="right"
        size="500px"
      >
        {viewingEmp && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "var(--space-6)",
            }}
          >
            {/* Profile header */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "var(--space-4)",
                paddingBottom: "var(--space-4)",
                borderBottom: "1px solid var(--color-border)",
              }}
            >
              <div
                style={{
                  width: "60px",
                  height: "60px",
                  borderRadius: "50%",
                  background: "var(--color-surface-alt)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "24px",
                  fontWeight: 600,
                  color: "var(--color-text-muted)",
                }}
              >
                {viewingEmp.firstName?.[0] || "?"}
                {viewingEmp.lastName?.[0] || ""}
              </div>
              <div>
                <h3
                  style={{
                    margin: 0,
                    fontSize: "18px",
                    fontWeight: 600,
                    color: "var(--color-text-primary)",
                    display: "flex",
                    alignItems: "center",
                    gap: "var(--space-3)",
                  }}
                >
                  {viewingEmp.firstName} {viewingEmp.lastName}
                  <span
                    style={{
                      display: "inline-block",
                      padding: "2px 8px",
                      borderRadius: "12px",
                      fontSize: "11px",
                      fontWeight: 600,
                      background: viewingEmp.isActive ? "#dcfce7" : "#f1f5f9",
                      color: viewingEmp.isActive ? "#166534" : "#64748b",
                    }}
                  >
                    {viewingEmp.isActive ? "Active" : "Inactive"}
                  </span>
                </h3>
                <p
                  style={{
                    margin: "4px 0 0",
                    fontSize: "14px",
                    color: "var(--color-text-muted)",
                  }}
                >
                  {viewingEmp.email}
                </p>
              </div>
            </div>

            {/* Details sections */}
            <div style={{ display: "grid", gap: "var(--space-5)" }}>
              <div>
                <SectionHeader title="Personal Details" />
                <TwoColGrid>
                  <DetailField label="Username" value={viewingEmp.username} />
                  <DetailField label="Mobile No" value={viewingEmp.mobile_no} />
                  <DetailField
                    label="Date of Birth"
                    value={viewingEmp.date_of_birth}
                  />
                  <DetailField
                    label="Gender"
                    value={viewingEmp.gender}
                    capitalize
                  />
                </TwoColGrid>
              </div>

              <div>
                <SectionHeader title="Organizational Info" />
                <TwoColGrid>
                  <DetailField
                    label="Emp Code"
                    value={viewingEmp.employeeCode}
                  />
                  <DetailField label="Company" value="Ultimatix Global" />
                  <DetailField
                    label="Business Unit"
                    value={getBuName(viewingEmp.businessUnitId)}
                  />
                  <DetailField
                    label="Location"
                    value={getLocName(viewingEmp.locationId)}
                  />
                  <DetailField
                    label="Department"
                    value={getDeptName(viewingEmp.departmentId)}
                  />
                  <DetailField
                    label="Designation"
                    value={getRoleName(viewingEmp.roleId)}
                  />
                  <DetailField
                    label="Joining Date"
                    value={(viewingEmp as any).joiningDate}
                  />
                </TwoColGrid>
              </div>

              <div>
                <SectionHeader title="Reporting Hierarchy" />
                <TwoColGrid>
                  <DetailField
                    label="Reporting Manager"
                    value={getManagerName(viewingEmp.managerId)}
                  />
                </TwoColGrid>
              </div>

              <div>
                <SectionHeader title="Competency Profile" />
                {empSkills.filter(es => es.employeeId === viewingEmp.id).length === 0 ? (
                  <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', italic: 'true' } as any}>
                    No skill assessments recorded.
                  </p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                    {empSkills
                      .filter(es => es.employeeId === viewingEmp.id)
                      .map(es => {
                        const skill = allSkills.find(s => s.id === es.skillId);
                        const level = allLevels.find(l => l.id === es.assessedLevelId);
                        if (!skill) return null;
                        return (
                          <div 
                            key={es.id} 
                            style={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              justifyContent: 'space-between',
                              padding: 'var(--space-2) var(--space-3)',
                              background: 'var(--color-canvas)',
                              borderRadius: 'var(--radius-md)',
                              border: '1px solid var(--color-border)'
                            }}
                          >
                            <span style={{ fontSize: '13px', fontWeight: 500 }}>{skill.name}</span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                              <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
                                {es.status === 'VERIFIED' ? '✓ Verified' : 'Pending'}
                              </span>
                              <ProficiencyBadge level={level?.name || 'Not Rated'} rank={level?.rank || 0} />
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </Drawer>

      {/* ── Skill Mapping Modal ── */}
      <UnifiedSkillMappingModal
        open={isMappingOpen}
        onClose={() => setIsMappingOpen(false)}
        title={`Assess Skills: ${mappingEmp?.firstName} ${mappingEmp?.lastName}`}
        description="Record verified or self-assessed proficiency levels."
        type="EMPLOYEE"
        allSkills={allSkills}
        allLevels={allLevels}
        initialMappings={currentMappings}
        onSave={handleSaveMapping}
      />
    </AdminMasterLayout>
  );
};

export default EmployeePage;
