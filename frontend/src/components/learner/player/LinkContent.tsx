/**
 * Renders an external link with a manual "Mark Complete" button.
 */

import { useCallback } from 'react';
import { ExternalLink } from 'lucide-react';
import { CourseLesson, CourseContent } from '@/types/courses.types';
import { DetailedEnrollmentProgress, LessonProgress } from '@/types/player.types';
import { useMarkLessonComplete } from '@/queries/learner/usePlayerQueries';
import { useCoursePlayerStore } from '@/stores/coursePlayerStore';
import { LessonNavFooter } from './LessonNavFooter';

interface LinkContentProps {
  content: CourseContent;
  lesson: CourseLesson;
  enrollment: DetailedEnrollmentProgress;
  lessonProgress: LessonProgress | undefined;
  nextLesson: CourseLesson | null;
}

export const LinkContent = ({
  content,
  lesson,
  enrollment,
  lessonProgress,
  nextLesson,
}: LinkContentProps) => {
  const { showLessonCompleteOverlay } = useCoursePlayerStore();
  const markCompleteMutation = useMarkLessonComplete();

  const isAlreadyCompleted = lessonProgress?.status === 'COMPLETED';
  const url = content.content_url;

  const handleMarkComplete = useCallback(() => {
    if (isAlreadyCompleted) return;
    markCompleteMutation.mutate(
      { enrollmentId: enrollment.id, lessonId: lesson.id, contentId: content.id },
      {
        onSuccess: () => {
          showLessonCompleteOverlay(lesson.id);
        },
      }
    );
  }, [
    isAlreadyCompleted,
    enrollment.id,
    lesson.id,
    content.id,
    markCompleteMutation,
    showLessonCompleteOverlay,
  ]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 flex justify-center">
        <div className="w-full bg-white p-8">

          <p className='flex gap-2 items-center'>
            This lesson includes external content; please visit the link to access the full material.
          
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex gap-2 items-center text-blue-600 text-sm"
            >
              <ExternalLink className="h-4 w-4" />
              View Content
            </a>
          </p>
        </div>
      </div>

      <LessonNavFooter
        lesson={lesson}
        nextLesson={nextLesson}
        isCompleted={isAlreadyCompleted ?? false}
      />
    </div>
  );
};
