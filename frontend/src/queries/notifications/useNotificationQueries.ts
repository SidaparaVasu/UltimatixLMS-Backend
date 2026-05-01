/**
 * Notification TanStack Query hooks.
 *
 * Query key hierarchy:
 *   ['notifications', 'unread-count']          — bell badge count (polled)
 *   ['notifications', 'list', params]           — paginated list
 *   ['notifications', 'detail', id]             — single notification
 *
 * Invalidation strategy:
 *   - After markRead / markAllRead / deleteNotification, invalidate both
 *     'unread-count' and 'list' so the badge and list stay in sync.
 *   - The Zustand store is updated optimistically (decrement / clear) so
 *     the badge reacts instantly without waiting for the refetch.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationApi } from '@/api/notification-api';
import { useInAppNotificationStore } from '@/stores/inAppNotificationStore';
import { useAuthStore } from '@/stores/authStore';
import type { NotificationListParams } from '@/types/notification.types';

// ---------------------------------------------------------------------------
// Query keys
// ---------------------------------------------------------------------------

export const NOTIFICATION_QUERY_KEYS = {
  /** Bell badge count — polled every 30 s */
  unreadCount: ['notifications', 'unread-count'] as const,

  /** Paginated list — varies by filter params */
  list: (params?: NotificationListParams) =>
    ['notifications', 'list', params] as const,

  /** Single notification detail */
  detail: (id: number) => ['notifications', 'detail', id] as const,
};

// ---------------------------------------------------------------------------
// 1. Unread count — polled every 30 seconds
// ---------------------------------------------------------------------------

/**
 * Polls the unread notification count every 30 seconds.
 * Syncs the result into the Zustand store so the bell badge updates
 * without re-rendering every consumer of this query.
 *
 * Only runs when the user is authenticated.
 */
export const useUnreadCount = () => {
  const { isAuthenticated } = useAuthStore();
  const { setUnreadCount } = useInAppNotificationStore();

  return useQuery({
    queryKey: NOTIFICATION_QUERY_KEYS.unreadCount,
    queryFn: async () => {
      const result = await notificationApi.getUnreadCount();
      const count = result?.count ?? 0;
      // Keep Zustand badge in sync on every successful poll
      setUnreadCount(count);
      return count;
    },
    enabled: isAuthenticated,
    // Refetch every 30 seconds while the tab is in focus
    refetchInterval: 30_000,
    // Keep showing the last known count while refetching in the background
    staleTime: 20_000,
    // Don't show a loading spinner on background refetches
    refetchIntervalInBackground: false,
  });
};

// ---------------------------------------------------------------------------
// 2. Notification list — paginated, filterable
// ---------------------------------------------------------------------------

/**
 * Fetches a paginated list of notifications for the current user.
 *
 * @param params.is_read   - Filter by read state (true/false). Omit for all.
 * @param params.tab       - 'learning' | 'approvals' | 'alerts' | 'all'
 * @param params.page      - Page number (1-indexed).
 * @param params.page_size - Items per page.
 *
 * Only runs when the user is authenticated.
 */
export const useNotificationList = (params?: NotificationListParams) => {
  const { isAuthenticated } = useAuthStore();

  return useQuery({
    queryKey: NOTIFICATION_QUERY_KEYS.list(params),
    queryFn: () => notificationApi.getList(params),
    enabled: isAuthenticated,
    staleTime: 60_000, // 1 minute — list is less time-sensitive than the badge
  });
};

// ---------------------------------------------------------------------------
// 3. Single notification detail
// ---------------------------------------------------------------------------

/**
 * Fetches a single notification by ID.
 * Primarily used when navigating to a notification detail view.
 */
export const useNotificationDetail = (id: number | null) => {
  const { isAuthenticated } = useAuthStore();

  return useQuery({
    queryKey: NOTIFICATION_QUERY_KEYS.detail(id ?? 0),
    queryFn: () => notificationApi.getById(id!),
    enabled: isAuthenticated && !!id,
    staleTime: 60_000,
  });
};

// ---------------------------------------------------------------------------
// 4. Mark single notification as read
// ---------------------------------------------------------------------------

/**
 * Marks a single notification as read.
 *
 * Optimistic update: decrements the Zustand badge immediately.
 * Cache invalidation: refreshes both the list and the unread count.
 */
export const useMarkRead = () => {
  const qc = useQueryClient();
  const { decrementUnread } = useInAppNotificationStore();

  return useMutation({
    mutationFn: (id: number) => notificationApi.markRead(id),
    onSuccess: () => {
      // Optimistic badge update — instant feedback before refetch
      decrementUnread();
      // Invalidate server state so list and count are accurate
      qc.invalidateQueries({ queryKey: ['notifications', 'unread-count'] });
      qc.invalidateQueries({ queryKey: ['notifications', 'list'] });
    },
  });
};

// ---------------------------------------------------------------------------
// 5. Mark all notifications as read
// ---------------------------------------------------------------------------

/**
 * Marks all unread notifications as read.
 *
 * Optimistic update: clears the Zustand badge to 0 immediately.
 * Cache invalidation: refreshes both the list and the unread count.
 */
export const useMarkAllRead = () => {
  const qc = useQueryClient();
  const { clearUnread } = useInAppNotificationStore();

  return useMutation({
    mutationFn: () => notificationApi.markAllRead(),
    onSuccess: () => {
      // Optimistic badge clear — instant feedback
      clearUnread();
      qc.invalidateQueries({ queryKey: ['notifications', 'unread-count'] });
      qc.invalidateQueries({ queryKey: ['notifications', 'list'] });
    },
  });
};

// ---------------------------------------------------------------------------
// 6. Delete a notification
// ---------------------------------------------------------------------------

/**
 * Permanently deletes a single notification.
 *
 * If the deleted notification was unread, decrements the badge.
 * Cache invalidation: refreshes the list and unread count.
 */
export const useDeleteNotification = () => {
  const qc = useQueryClient();
  const { decrementUnread } = useInAppNotificationStore();

  return useMutation({
    mutationFn: ({ id, wasUnread }: { id: number; wasUnread: boolean }) =>
      notificationApi.deleteNotification(id),
    onSuccess: (_data, variables) => {
      if (variables.wasUnread) {
        decrementUnread();
      }
      qc.invalidateQueries({ queryKey: ['notifications', 'unread-count'] });
      qc.invalidateQueries({ queryKey: ['notifications', 'list'] });
    },
  });
};
