/**
 * Reusable footer shown below all content types.
 * Shows "Next Lesson" navigation.
 */

import { ChevronRight } from 'lucide-react';
import { CourseLesson } from '@/types/courses.types';
import { useCoursePlayerStore } from '@/stores/coursePlayerStore';
import { cn } from '@/utils/cn';

interface LessonNavFooterProps {
  lesson: CourseLesson;
  nextLesson: CourseLesson | null;
  isCompleted: boolean;
}

export const LessonNavFooter = ({ lesson, nextLesson, isCompleted }: LessonNavFooterProps) => {
  const { setActiveLesson } = useCoursePlayerStore();

  if (!nextLesson) return null;

  return (
    <div className="p-5 border-t border-gray-200 bg-white">
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-500">Up next</span>
        <button
          onClick={() => setActiveLesson(nextLesson.id)}
          className={cn(
            'flex items-center gap-1.5 text-sm font-medium transition-colors',
            isCompleted
              ? 'text-blue-600 hover:text-blue-700'
              : 'text-gray-400 cursor-not-allowed'
          )}
          disabled={!isCompleted}
          title={!isCompleted ? 'Complete this lesson to continue' : undefined}
        >
          <span className="truncate max-w-xs">{nextLesson.lesson_title}</span>
          <ChevronRight className="h-4 w-4 flex-shrink-0" />
        </button>
      </div>
    </div>
  );
};
