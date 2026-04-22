import { apiClient } from "./axios-client";
import { handleApiResponse, handleApiError } from "@/utils/api-utils";
import { PaginatedResponse } from "./organization-api";
import { UserCourseEnrollment, CourseCertificate, EnrollRequest } from "@/types/courses.types";

export const learningApi = {
  // Get current user enrollments
  getMyEnrollments: async (params?: { status?: string; page?: number; page_size?: number }) => {
    try {
      const response = await apiClient.get("/learning/my-learning/", { params });
      return handleApiResponse<PaginatedResponse<UserCourseEnrollment>>(response.data, false);
    } catch (error) {
      return handleApiError(error);
    }
  },

  // Enroll in a course
  enrollInCourse: async (data: EnrollRequest) => {
    try {
      const response = await apiClient.post("/learning/my-learning/enroll/", data);
      return handleApiResponse<UserCourseEnrollment>(response.data);
    } catch (error) {
      return handleApiError(error);
    }
  },

  // Get enrollment summary counts for dashboard
  getEnrollmentSummary: async () => {
    try {
      const response = await apiClient.get("/learning/my-learning/summary/");
      return handleApiResponse<{ in_progress: number; completed: number; not_started: number }>(response.data, false);
    } catch (error) {
      return handleApiError(error);
    }
  },

  // Get user certificates
  getMyCertificates: async () => {
    try {
      const response = await apiClient.get("/learning/certificates/");
      return handleApiResponse<PaginatedResponse<CourseCertificate>>(response.data, false);
    } catch (error) {
      return handleApiError(error);
    }
  },
};