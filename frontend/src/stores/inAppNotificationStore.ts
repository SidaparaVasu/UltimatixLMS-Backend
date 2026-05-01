/**
 * Zustand store for in-app notification UI state.
 *
 * Rules:
 * - Stores ONLY UI state: unread count badge and dropdown open/close.
 * - The notification list is server state — it lives in TanStack Query,
 *   not here. Never cache notification records in this store.
 * - unreadCount is seeded by the polling query and kept in sync via
 *   setUnreadCount. Components read it from here to avoid re-rendering
 *   the entire bell on every query refetch.
 * - No persistence — count is re-fetched on every page load via the
 *   30-second polling query.
 */

import { create } from 'zustand';

interface InAppNotificationState {
  // -------------------------------------------------------------------------
  // State
  // -------------------------------------------------------------------------

  /** Current unread notification count. Drives the bell badge. */
  unreadCount: number;

  /** Whether the notification dropdown is open. */
  isDropdownOpen: boolean;

  // -------------------------------------------------------------------------
  // Actions
  // -------------------------------------------------------------------------

  /** Overwrite the unread count — called by useUnreadCount on every poll. */
  setUnreadCount: (count: number) => void;

  /**
   * Decrement the unread count by 1 when a single notification is marked read.
   * Keeps the badge in sync without waiting for the next poll cycle.
   */
  decrementUnread: () => void;

  /**
   * Reset the unread count to 0 when mark-all-read succeeds.
   * Keeps the badge in sync without waiting for the next poll cycle.
   */
  clearUnread: () => void;

  /** Open the dropdown. */
  openDropdown: () => void;

  /** Close the dropdown. */
  closeDropdown: () => void;

  /** Toggle the dropdown open/closed. */
  toggleDropdown: () => void;
}

export const useInAppNotificationStore = create<InAppNotificationState>((set) => ({
  // -------------------------------------------------------------------------
  // Initial state
  // -------------------------------------------------------------------------
  unreadCount: 0,
  isDropdownOpen: false,

  // -------------------------------------------------------------------------
  // Actions
  // -------------------------------------------------------------------------
  setUnreadCount: (count) =>
    set({ unreadCount: Math.max(0, count) }),

  decrementUnread: () =>
    set((state) => ({ unreadCount: Math.max(0, state.unreadCount - 1) })),

  clearUnread: () =>
    set({ unreadCount: 0 }),

  openDropdown: () =>
    set({ isDropdownOpen: true }),

  closeDropdown: () =>
    set({ isDropdownOpen: false }),

  toggleDropdown: () =>
    set((state) => ({ isDropdownOpen: !state.isDropdownOpen })),
}));
