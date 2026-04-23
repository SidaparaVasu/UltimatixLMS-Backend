/**
 * Main entry point for the Course Player.
 * Route: /learn/:enrollmentId
 *
 * Renders as a fixed full-screen overlay that covers the entire viewport,
 * including the sidebar and topnav from DashboardLayout.
 */

import { useParams, Navigate } from 'react-router-dom';
import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useEnrollmentProgress } from '@/queries/learner/usePlayerQueries';
import { useCoursePlayerStore } from '@/stores/coursePlayerStore';
import { PlayerLayout } from '@/components/learner/player/PlayerLayout';
import { Loader2 } from 'lucide-react';

export default function CoursePlayerPage() {
  const { enrollmentId } = useParams<{ enrollmentId: string }>();
  const enrollmentIdNum = enrollmentId ? parseInt(enrollmentId, 10) : 0;

  const { data: enrollment, isLoading, error } = useEnrollmentProgress(enrollmentIdNum);
  const { setActiveLesson, reset } = useCoursePlayerStore();

  // Track initialization to prevent infinite loop
  const hasInitialized = useRef(false);

  // Initialize active lesson to the first incomplete lesson on mount
  useEffect(() => {
    if (!enrollment || hasInitialized.current) return;
    hasInitialized.current = true;

    const firstIncomplete = enrollment.lesson_progress.find(
      (lp) => lp.status !== 'COMPLETED'
    );

    if (firstIncomplete) {
      setActiveLesson(firstIncomplete.lesson);
    } else if (enrollment.lesson_progress.length > 0) {
      setActiveLesson(enrollment.lesson_progress[0].lesson);
    }
  }, [enrollment]); // eslint-disable-line react-hooks/exhaustive-deps

  // Reset store on unmount
  useEffect(() => {
    return () => {
      reset();
      hasInitialized.current = false;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Loading state
  if (isLoading) {
    return createPortal(
      <div className="fixed inset-0 z-[200] flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-7 w-7 animate-spin text-blue-600" />
          <p className="text-sm text-gray-500">Loading course...</p>
        </div>
      </div>,
      document.body
    );
  }

  // Error or not found
  if (error || !enrollment) {
    return <Navigate to="/my-learning" replace />;
  }

  // Access denied
  if (enrollment.status === 'DROPPED') {
    return createPortal(
      <div className="fixed inset-0 z-[200] flex items-center justify-center bg-white">
        <div className="text-center max-w-md px-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-6">
            You have dropped this course and can no longer access it.
          </p>
          <a href="/my-learning" className="btn">
            Back to My Learning
          </a>
        </div>
      </div>,
      document.body
    );
  }

  // Render as full-screen portal over the entire app
  return createPortal(
    <div className="fixed inset-0 z-[200] bg-white flex flex-col overflow-hidden">
      <PlayerLayout enrollment={enrollment} />
    </div>,
    document.body
  );
}
