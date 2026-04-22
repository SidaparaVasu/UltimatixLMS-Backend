import { CourseSection } from "@/types/courses.types";
import { ChevronDown, ChevronRight, Lock, Play, FileText, Link as LinkIcon, CheckCircle } from "lucide-react";
import { useState } from "react";
import { cn } from "@/utils/cn";

interface CurriculumPreviewProps {
  sections: CourseSection[];
  enrollmentId?: number;
  className?: string;
}

export const CurriculumPreview = ({ sections, enrollmentId, className }: CurriculumPreviewProps) => {
  const [expandedSections, setExpandedSections] = useState<Set<number>>(new Set());

  const toggleSection = (sectionId: number) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };

  const getContentTypeIcon = (contentType: string) => {
    switch (contentType) {
      case 'VIDEO':
        return <Play className="h-3 w-3" />;
      case 'PDF':
      case 'DOCUMENT':
        return <FileText className="h-3 w-3" />;
      case 'LINK':
        return <LinkIcon className="h-3 w-3" />;
      case 'QUIZ':
        return <CheckCircle className="h-3 w-3" />;
      default:
        return <FileText className="h-3 w-3" />;
    }
  };

  const getTotalDuration = (section: CourseSection) => {
    if (!section.lessons) return 0;
    return section.lessons.reduce((total, lesson) => total + lesson.estimated_duration_minutes, 0);
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  };

  if (!sections || sections.length === 0) {
    return (
      <div className={cn("text-center py-8 text-gray-500", className)}>
        <FileText className="h-8 w-8 mx-auto mb-2 text-gray-400" />
        <p>No curriculum available yet</p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-2", className)}>
      {sections.map((section) => {
        const isExpanded = expandedSections.has(section.id);
        const totalDuration = getTotalDuration(section);
        const lessonCount = section.lessons?.length || 0;

        return (
          <div key={section.id} className="border border-gray-200 rounded-lg overflow-hidden">
            {/* Section Header */}
            <button
              onClick={() => toggleSection(section.id)}
              className="w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors text-left flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4 text-gray-500" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-gray-500" />
                )}
                <div>
                  <h3 className="font-medium text-gray-900 text-sm">
                    {section.section_title}
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">
                    {lessonCount} lesson{lessonCount !== 1 ? 's' : ''} • {formatDuration(totalDuration)}
                  </p>
                </div>
              </div>
              {!enrollmentId && (
                <Lock className="h-4 w-4 text-gray-400" />
              )}
            </button>

            {/* Section Content */}
            {isExpanded && section.lessons && (
              <div className="border-t border-gray-200">
                {section.lessons.map((lesson) => (
                  <div key={lesson.id} className="px-4 py-3 border-b border-gray-100 last:border-b-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          {!enrollmentId && (
                            <Lock className="h-3 w-3 text-gray-400 flex-shrink-0" />
                          )}
                          <div className="text-gray-600 flex-shrink-0">
                            {lesson.contents && lesson.contents.length > 0 
                              ? getContentTypeIcon(lesson.contents[0].content_type)
                              : <FileText className="h-3 w-3" />
                            }
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm text-gray-900 font-medium truncate">
                            {lesson.lesson_title}
                          </h4>
                          {lesson.contents && lesson.contents.length > 1 && (
                            <p className="text-xs text-gray-500 mt-1">
                              {lesson.contents.length} items
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="text-xs text-gray-500 flex-shrink-0 ml-2">
                        {formatDuration(lesson.estimated_duration_minutes)}
                      </div>
                    </div>

                    {/* Lesson Contents */}
                    {lesson.contents && lesson.contents.length > 1 && (
                      <div className="mt-2 ml-8 space-y-1">
                        {lesson.contents.map((content) => (
                          <div key={content.id} className="flex items-center gap-2 text-xs text-gray-600">
                            {getContentTypeIcon(content.content_type)}
                            <span className="capitalize">{content.content_type.toLowerCase()}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};