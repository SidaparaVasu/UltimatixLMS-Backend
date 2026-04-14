import { apiClient } from "./axios-client";
import { handleApiResponse, handleApiError } from "@/utils/api-utils";
import { PaginatedResponse } from "./organization-api";

export interface Skill {
  id: number;
  skill_name: string;
  skill_code: string;
  description: string;
  is_active: boolean;
  parent_skill?: number;
}

export interface SkillLevel {
  id: number;
  level_name: string;
  level_rank: number;
  description: string;
}

export interface JobRoleSkillRequirement {
  id: number;
  job_role: number;
  skill: number;
  required_level: number;
  is_active: boolean;
}

/**
 * Skill API - handles skill management, proficiencies, and job role mapping.
 * Base path: /api/v1/skills/
 */
export const skillApi = {
  getSkills: async () => {
    try {
      const response = await apiClient.get("/skills/skills/");
      return handleApiResponse<PaginatedResponse<Skill>>(response.data);
    } catch (error) {
      return handleApiError(error);
    }
  },

  getSkillLevels: async () => {
    try {
      const response = await apiClient.get("/skills/skill-levels/");
      return handleApiResponse<PaginatedResponse<SkillLevel>>(response.data);
    } catch (error) {
      return handleApiError(error);
    }
  },

  getRoleRequirements: async () => {
    try {
      const response = await apiClient.get("/skills/role-requirements/");
      return handleApiResponse<PaginatedResponse<JobRoleSkillRequirement>>(response.data);
    } catch (error) {
      return handleApiError(error);
    }
  },

  /**
   * Bulk synchronizes requirements for a job role.
   * This action deactivates missing mappings and creates/reactivates provided ones.
   */
  bulkSyncRoleRequirements: async (data: { 
    job_role_id: number; 
    requirements: { skill_id: number; level_id: number }[] 
  }) => {
    try {
      const response = await apiClient.post("/skills/role-requirements/bulk-sync/", data);
      return handleApiResponse(response.data);
    } catch (error) {
      return handleApiError(error);
    }
  }
};
