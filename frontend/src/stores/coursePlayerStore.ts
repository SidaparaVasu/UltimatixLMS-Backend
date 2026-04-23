/**
 * Zustand store for Course Player UI state only.
 * Server state (enrollment progress, lesson data) lives in TanStack Query.
 */

import { create } from 'zustand';

interface CoursePlayerState {
  // Which lesson is currently active in the player
  activeLessonId: number | null;
  // Which content item within the lesson is active (index)
  activeContentIndex: number;
  // Sidebar open/collapsed state (for smaller screens)
  isSidebarOpen: boolean;
  // Lesson id to show the "lesson complete" overlay for (null = hidden)
  completedLessonOverlay: number | null;

  // Actions
  setActiveLesson: (lessonId: number) => void;
  setActiveContentIndex: (index: number) => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  showLessonCompleteOverlay: (lessonId: number) => void;
  hideLessonCompleteOverlay: () => void;
  reset: () => void;
}

const initialState = {
  activeLessonId: null,
  activeContentIndex: 0,
  isSidebarOpen: true,
  completedLessonOverlay: null,
};

export const useCoursePlayerStore = create<CoursePlayerState>((set) => ({
  ...initialState,

  setActiveLesson: (lessonId) =>
    set({ activeLessonId: lessonId, activeContentIndex: 0 }),

  setActiveContentIndex: (index) =>
    set({ activeContentIndex: index }),

  toggleSidebar: () =>
    set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),

  setSidebarOpen: (open) =>
    set({ isSidebarOpen: open }),

  showLessonCompleteOverlay: (lessonId) =>
    set({ completedLessonOverlay: lessonId }),

  hideLessonCompleteOverlay: () =>
    set({ completedLessonOverlay: null }),

  reset: () => set(initialState),
}));
