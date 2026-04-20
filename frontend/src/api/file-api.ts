import { apiClient } from "./axios-client";
import { handleApiError, handleApiResponse } from "@/utils/api-utils";

export interface UploadedFile {
  id: number;
  original_name: string;
  file_url?: string | null;
  file_type: string;
  size_bytes: number;
  upload_status: string;
  created_at: string;
}

export const fileApi = {
  uploadFile: async (file: File) => {
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await apiClient.post("/files/files/upload/", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      return handleApiResponse<UploadedFile>(response.data);
    } catch (error) {
      return handleApiError(error);
    }
  },
};
