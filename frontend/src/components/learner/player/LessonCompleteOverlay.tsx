/**
 * Subtle bottom-of-screen toast shown when a lesson is completed.
 * Auto-dismisses after 4s. Shows "Next Lesson" button.
 */

import { useEffect } from 'react';
import { CheckCircle, ChevronRight, X } from 'lucide-react';
import { CourseLesson } from '@/types/courses.types';
import { useCoursePlayerStore } from '@/stores/coursePlayerStore';

interface LessonCompleteOverlayProps {
  lessonId: number;
  nextLesson: CourseLesson | null;
}

export const LessonCompleteOverlay = ({ lessonId, nextLesson }: LessonCompleteOverlayProps) => {
  const { hideLessonCompleteOverlay, setActiveLesson } = useCoursePlayerStore();

  // Auto-dismiss after 4s
  useEffect(() => {
    const timer = setTimeout(() => {
      hideLessonCompleteOverlay();
    }, 4000);
    return () => clearTimeout(timer);
  }, [lessonId, hideLessonCompleteOverlay]);

  const handleNext = () => {
    hideLessonCompleteOverlay();
    if (nextLesson) {
      setActiveLesson(nextLesson.id);
    }
  };

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-4 duration-300">
      <div className="flex items-center gap-3 bg-white border border-gray-200 rounded-lg px-4 py-3 min-w-[280px]">
        <CheckCircle className="h-4 w-4 text-emerald-500 flex-shrink-0" />
        <span className="text-sm font-medium text-gray-800 flex-1">Lesson complete</span>

        {nextLesson && (
          <button
            onClick={handleNext}
            className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors whitespace-nowrap"
          >
            Next
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        )}

        <button
          onClick={hideLessonCompleteOverlay}
          className="text-gray-400 hover:text-gray-600 transition-colors ml-1"
          aria-label="Dismiss"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
};
