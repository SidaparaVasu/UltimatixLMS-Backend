import { apiClient } from "./axios-client";
import { handleApiResponse, handleApiError } from "@/utils/api-utils";

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

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// ---------------------------------------------------------------------------
// API Methods
// ---------------------------------------------------------------------------

export const organizationApi = {
  // Business Units
  getBusinessUnits: async (params?: { page?: number; page_size?: number }) => {
    try {
      const response = await apiClient.get("/org/business-units/", { params });
      return handleApiResponse<PaginatedResponse<BusinessUnit>>(response.data);
    } catch (error) {
      return handleApiError(error);
    }
  },
  createBusinessUnit: async (data: Partial<BusinessUnit>) => {
    try {
      const response = await apiClient.post("/org/business-units/", data);
      return handleApiResponse<BusinessUnit>(response.data);
    } catch (error) {
      return handleApiError(error);
    }
  },
  updateBusinessUnit: async (id: number, data: Partial<BusinessUnit>) => {
    try {
      const response = await apiClient.patch(
        `/org/business-units/${id}/`,
        data,
      );
      return handleApiResponse<BusinessUnit>(response.data);
    } catch (error) {
      return handleApiError(error);
    }
  },
  deleteBusinessUnit: async (id: number) => {
    try {
      // Enforcement: We always use soft delete.
      // Parameter soft_delete is handled on backend, but we pass it as a query param if needed.
      const response = await apiClient.delete(
        `/org/business-units/${id}/?soft_delete=true`,
      );
      return handleApiResponse(response.data);
    } catch (error) {
      return handleApiError(error);
    }
  },

  // Locations
  getLocations: async (params?: { page?: number; page_size?: number }) => {
    try {
      const response = await apiClient.get("/org/locations/", { params });
      return handleApiResponse<PaginatedResponse<Location>>(response.data);
    } catch (error) {
      return handleApiError(error);
    }
  },
  createLocation: async (data: Partial<Location>) => {
    try {
      const response = await apiClient.post("/org/locations/", data);
      return handleApiResponse<Location>(response.data);
    } catch (error) {
      return handleApiError(error);
    }
  },
  updateLocation: async (id: number, data: Partial<Location>) => {
    try {
      const response = await apiClient.patch(`/org/locations/${id}/`, data);
      return handleApiResponse<Location>(response.data);
    } catch (error) {
      return handleApiError(error);
    }
  },
  deleteLocation: async (id: number) => {
    try {
      const response = await apiClient.delete(
        `/org/locations/${id}/?soft_delete=true`,
      );
      return handleApiResponse(response.data);
    } catch (error) {
      return handleApiError(error);
    }
  },

  // Departments
  getDepartments: async (params?: { page?: number; page_size?: number }) => {
    try {
      const response = await apiClient.get("/org/departments/", { params });
      return handleApiResponse<PaginatedResponse<Department>>(response.data);
    } catch (error) {
      return handleApiError(error);
    }
  },
  createDepartment: async (data: Partial<Department>) => {
    try {
      const response = await apiClient.post("/org/departments/", data);
      return handleApiResponse<Department>(response.data);
    } catch (error) {
      return handleApiError(error);
    }
  },
  updateDepartment: async (id: number, data: Partial<Department>) => {
    try {
      const response = await apiClient.patch(`/org/departments/${id}/`, data);
      return handleApiResponse<Department>(response.data);
    } catch (error) {
      return handleApiError(error);
    }
  },
  deleteDepartment: async (id: number) => {
    try {
      const response = await apiClient.delete(
        `/org/departments/${id}/?soft_delete=true`,
      );
      return handleApiResponse(response.data);
    } catch (error) {
      return handleApiError(error);
    }
  },

  // Job Roles
  getJobRoles: async (params?: { page?: number; page_size?: number }) => {
    try {
      const response = await apiClient.get("/org/job-roles/", { params });
      return handleApiResponse<PaginatedResponse<JobRole>>(response.data);
    } catch (error) {
      return handleApiError(error);
    }
  },
  createJobRole: async (data: Partial<JobRole>) => {
    try {
      const response = await apiClient.post("/org/job-roles/", data);
      return handleApiResponse<JobRole>(response.data);
    } catch (error) {
      return handleApiError(error);
    }
  },
  updateJobRole: async (id: number, data: Partial<JobRole>) => {
    try {
      const response = await apiClient.patch(`/org/job-roles/${id}/`, data);
      return handleApiResponse<JobRole>(response.data);
    } catch (error) {
      return handleApiError(error);
    }
  },
  deleteJobRole: async (id: number) => {
    try {
      const response = await apiClient.delete(
        `/org/job-roles/${id}/?soft_delete=true`,
      );
      return handleApiResponse(response.data);
    } catch (error) {
      return handleApiError(error);
    }
  },
};
