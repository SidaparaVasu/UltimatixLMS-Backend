/**
 * Curriculum tree with live lesson progress state.
 * Shows sections as collapsible groups, lessons with completion status.
 */

import { useState, useMemo } from 'react';
import { ChevronDown, ChevronRight, CheckCircle, Circle, Play, FileText, Link as LinkIcon, ClipboardList } from 'lucide-react';
import { cn } from '@/utils/cn';
import { useCoursePlayerStore } from '@/stores/coursePlayerStore';
import { CourseSection, CourseLesson, CourseContentType } from '@/types/courses.types';
import { LessonProgress } from '@/types/player.types';

interface PlayerSidebarProps {
  sections: CourseSection[];
  lessonProgressList: LessonProgress[];
}

export const PlayerSidebar = ({
  sections,
  lessonProgressList,
}: PlayerSidebarProps) => {
  const { activeLessonId, setActiveLesson } = useCoursePlayerStore();

  // Build a map of lesson_id → progress for O(1) lookup
  const progressMap = useMemo(() => {
    const map = new Map<number, LessonProgress>();
    lessonProgressList.forEach((lp) => map.set(lp.lesson, lp));
    return map;
  }, [lessonProgressList]);

  // Default: expand the section containing the active lesson
  const defaultExpanded = useMemo(() => {
    const set = new Set<number>();
    if (activeLessonId) {
      sections.forEach((s) => {
        if (s.lessons?.some((l) => l.id === activeLessonId)) {
          set.add(s.id);
        }
      });
    } else if (sections.length > 0) {
      set.add(sections[0].id);
    }
    return set;
  }, []); // intentionally only on mount

  const [expandedSections, setExpandedSections] = useState<Set<number>>(defaultExpanded);

  const toggleSection = (sectionId: number) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      next.has(sectionId) ? next.delete(sectionId) : next.add(sectionId);
      return next;
    });
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  };

  const getContentIcon = (type: CourseContentType) => {
    switch (type) {
      case 'VIDEO':
        return <Play className="h-3 w-3" />;
      case 'PDF':
      case 'PPT':
      case 'DOCUMENT':
        return <FileText className="h-3 w-3" />;
      case 'LINK':
        return <LinkIcon className="h-3 w-3" />;
      case 'QUIZ':
        return <ClipboardList className="h-3 w-3" />;
      default:
        return <FileText className="h-3 w-3" />;
    }
  };

  const getLessonPrimaryContentType = (lesson: CourseLesson): CourseContentType => {
    if (!lesson.contents || lesson.contents.length === 0) return 'DOCUMENT';
    return lesson.contents[0].content_type;
  };

  return (
    <div className="py-3">
      {sections.map((section) => {
        const isExpanded = expandedSections.has(section.id);
        const lessons = section.lessons ?? [];
        const completedCount = lessons.filter(
          (l) => progressMap.get(l.id)?.status === 'COMPLETED'
        ).length;

        return (
          <div key={section.id}>
            {/* Section header */}
            <button
              onClick={() => toggleSection(section.id)}
              className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-gray-50 transition-colors text-left group"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-gray-400 flex-shrink-0">
                  {isExpanded ? (
                    <ChevronDown className="h-3.5 w-3.5" />
                  ) : (
                    <ChevronRight className="h-3.5 w-3.5" />
                  )}
                </span>
                <span className="text-xs font-semibold text-gray-700 truncate">
                  {section.section_title}
                </span>
              </div>
              <span className="text-[10px] text-gray-400 flex-shrink-0 ml-2">
                {completedCount}/{lessons.length}
              </span>
            </button>

            {/* Lessons */}
            {isExpanded && (
              <div>
                {lessons.map((lesson) => {
                  const progress = progressMap.get(lesson.id);
                  const isCompleted = progress?.status === 'COMPLETED';
                  const isActive = lesson.id === activeLessonId;
                  const contentType = getLessonPrimaryContentType(lesson);

                  return (
                    <button
                      key={lesson.id}
                      onClick={() => setActiveLesson(lesson.id)}
                      className={cn(
                        'w-full flex items-start gap-3 px-4 py-2.5 text-left transition-colors',
                        isActive
                          ? 'bg-blue-50 border-blue-600'
                          : 'hover:bg-gray-50 border-transparent'
                      )}
                    >
                      {/* Status icon */}
                      <span className="flex-shrink-0 mt-0.5">
                        {isCompleted ? (
                          <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
                        ) : (
                          <Circle
                            className={cn(
                              'h-3.5 w-3.5',
                              isActive ? 'text-blue-600' : 'text-gray-300'
                            )}
                          />
                        )}
                      </span>

                      {/* Lesson info */}
                      <div className="flex-1 min-w-0">
                        <p
                          className={cn(
                            'text-xs leading-snug',
                            isActive
                              ? 'font-semibold text-blue-700'
                              : isCompleted
                              ? 'font-medium text-gray-700'
                              : 'font-medium text-gray-700'
                          )}
                        >
                          {lesson.lesson_title}
                        </p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-gray-400">
                            {getContentIcon(contentType)}
                          </span>
                          <span className="text-[10px] text-gray-400">
                            {formatDuration(lesson.estimated_duration_minutes)}
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
