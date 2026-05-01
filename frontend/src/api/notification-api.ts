/**
 * Notification API
 *
 * All in-app notification endpoints.
 * Base path: /api/v1/notifications/
 *
 * Endpoints:
 *   GET    /                    → paginated list (supports ?is_read= and ?tab=)
 *   GET    /{id}/               → single notification
 *   GET    /unread-count/       → bell badge count
 *   PATCH  /{id}/read/          → mark single as read
 *   POST   /mark-all-read/      → mark all as read
 *   DELETE /{id}/               → delete single
 *
 * Rules:
 *   - All calls use handleApiResponse / handleApiError for consistent
 *     error handling and toast behaviour — matching every other API file.
 *   - notify=false on read-only calls (list, count) — no success toast.
 *   - notify=false on mark-read — silent UX update, no toast needed.
 *   - notify=true on mark-all-read — confirms the action to the user.
 *   - notify=false on delete — caller decides whether to toast.
 */

import { apiClient } from './axios-client';
import { handleApiResponse, handleApiError } from '@/utils/api-utils';
import type { PaginatedResponse } from './organization-api';
import type {
  Notification,
  NotificationListParams,
  UnreadCountResponse,
  MarkAllReadResponse,
} from '@/types/notification.types';

const BASE = '/notifications';

export const notificationApi = {
  // -------------------------------------------------------------------------
  // GET /notifications/
  // -------------------------------------------------------------------------

  /**
   * Fetch a paginated list of notifications for the current user.
   *
   * @param params.is_read   - Filter by read state (true/false). Omit for all.
   * @param params.tab       - Frontend tab: 'learning' | 'approvals' | 'alerts'
   * @param params.page      - Page number (1-indexed).
   * @param params.page_size - Items per page (max 100).
   */
  getList: async (
    params?: NotificationListParams,
  ): Promise<PaginatedResponse<Notification> | null> => {
    try {
      const response = await apiClient.get(`${BASE}/`, { params });
      return handleApiResponse<PaginatedResponse<Notification>>(response.data, false);
    } catch (error) {
      return handleApiError(error);
    }
  },

  // -------------------------------------------------------------------------
  // GET /notifications/{id}/
  // -------------------------------------------------------------------------

  /**
   * Fetch a single notification by ID.
   * Returns null if not found or not owned by the current user.
   */
  getById: async (id: number): Promise<Notification | null> => {
    try {
      const response = await apiClient.get(`${BASE}/${id}/`);
      return handleApiResponse<Notification>(response.data, false);
    } catch (error) {
      return handleApiError(error);
    }
  },

  // -------------------------------------------------------------------------
  // GET /notifications/unread-count/
  // -------------------------------------------------------------------------

  /**
   * Fetch the unread notification count for the bell badge.
   * Called on a 30-second polling interval — never shows a toast.
   */
  getUnreadCount: async (): Promise<UnreadCountResponse | null> => {
    try {
      const response = await apiClient.get(`${BASE}/unread-count/`);
      return handleApiResponse<UnreadCountResponse>(response.data, false);
    } catch (error) {
      return handleApiError(error);
    }
  },

  // -------------------------------------------------------------------------
  // PATCH /notifications/{id}/read/
  // -------------------------------------------------------------------------

  /**
   * Mark a single notification as read.
   * Silent — no success toast (the UI update is the feedback).
   */
  markRead: async (id: number): Promise<Notification | null> => {
    try {
      const response = await apiClient.patch(`${BASE}/${id}/read/`);
      return handleApiResponse<Notification>(response.data, false);
    } catch (error) {
      return handleApiError(error);
    }
  },

  // -------------------------------------------------------------------------
  // POST /notifications/mark-all-read/
  // -------------------------------------------------------------------------

  /**
   * Mark all unread notifications as read.
   * Shows a success toast confirming how many were updated.
   */
  markAllRead: async (): Promise<MarkAllReadResponse | null> => {
    try {
      const response = await apiClient.post(`${BASE}/mark-all-read/`);
      return handleApiResponse<MarkAllReadResponse>(response.data, true);
    } catch (error) {
      return handleApiError(error);
    }
  },

  // -------------------------------------------------------------------------
  // DELETE /notifications/{id}/
  // -------------------------------------------------------------------------

  /**
   * Permanently delete a single notification.
   * Silent — caller decides whether to show a toast.
   */
  deleteNotification: async (id: number): Promise<boolean> => {
    try {
      const response = await apiClient.delete(`${BASE}/${id}/`);
      const result = handleApiResponse(response.data, false);
      return result !== null;
    } catch (error) {
      return handleApiError(error);
    }
  },
};
