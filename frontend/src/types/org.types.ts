// -----------
// Interfaces
// -----------

export interface BusinessUnit {
  id: number;
  business_unit_name: string;
  business_unit_code: string;
  description: string;
  is_active: boolean;
  company?: number;
}

export interface Location {
  id: number;
  location_name: string;
  location_code: string;
  address: string;
  city: string;
  state: string;
  country: string;
  postal_code: string;
  is_active: boolean;
  company?: number;
}

export interface DropdownOption {
  id: number;
  name: string;
}

export interface EmployeeDirectoryRow {
  id: number;
  user: number | null;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  phone_number?: string | null;
  profile_image_url?: string | null;
  date_of_birth?: string | null;
  gender?: string | null;
  employee_code: string;
  company?: number | null;
  company_name?: string | null;
  business_unit?: number | null;
  business_unit_name?: string | null;
  department?: number | null;
  department_name?: string | null;
  job_role?: number | null;
  job_role_name?: string | null;
  location?: number | null;
  location_name?: string | null;
  manager?: number | null;
  manager_name?: string | null;
  joining_date?: string | null;
  is_active: boolean;
  employment_status?: string | null;
  created_at: string;
  updated_at: string;
}

export interface EmployeeFullProfilePayload {
  username?: string;
  email?: string;
  password?: string;
  first_name?: string;
  last_name?: string;
  phone_number?: string | null;
  profile_image_url?: string | null;
  date_of_birth?: string | null;
  gender?: string | null;
  employee_code?: string;
  business_unit?: number | null;
  department?: number | null;
  job_role?: number | null;
  location?: number | null;
  manager?: number | null;
  joining_date?: string | null;
  is_active?: boolean;
}

export type EmployeeCreatePayload = EmployeeFullProfilePayload;
export type EmployeeUpdatePayload = EmployeeFullProfilePayload;

export interface Employee {
  id: number;
  user?: number | null;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  mobile_no: string;
  profile_image: string;
  date_of_birth: string;
  gender: string;
  employeeCode: string;
  company: string;
  companyName: string;
  businessUnitId: string;
  businessUnitName: string;
  departmentId: string;
  departmentName: string;
  roleId: string;
  jobRoleName: string;
  locationId: string;
  locationName: string;
  managerId: string;
  managerName: string;
  joiningDate: string;
  isActive: boolean;
  employmentStatus: string;
  createdAt: string;
  updatedAt: string;
}

export interface EmployeeManagerOptionRow {
  id: number;
  employee_code: string;
  full_name: string;
  email: string;
}

export interface Department {
  id: number;
  business_unit: number; // Linked BU ID
  department_name: string;
  department_code: string;
  description: string;
  parent_department: number | null;
  is_active: boolean;
}

export interface JobRole {
  id: number;
  job_role_name: string;
  job_role_code: string;
  description: string;
  is_active: boolean;
  company?: number;
}