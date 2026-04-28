import { CourseMaster, UserCourseEnrollment } from "@/types/courses.types";
import { DifficultyBadge } from "./DifficultyBadge";
import { EnrollButton } from "./EnrollButton";
import { useNavigate } from "react-router-dom";
import { Clock, BookOpen } from "lucide-react";
import { cn } from "@/utils/cn";

interface CourseCardProps {
  course: CourseMaster;
  enrollment: UserCourseEnrollment | null;
  onEnroll: (courseId: number) => void;
  isEnrolling: boolean;
  className?: string;
}

export const CourseCard = ({
  course,
  enrollment,
  onEnroll,
  isEnrolling,
  className
}: CourseCardProps) => {
  const navigate = useNavigate();

  const handleCardClick = () => {
    navigate(`/courses/${course.id}`);
  };

  const handleEnrollClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEnroll(course.id);
  };

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  const isEnrolled = !!enrollment;
  const isCompleted = enrollment?.status === 'COMPLETED';
  const progressPercentage = enrollment ? parseFloat(enrollment.progress_percentage) : 0;

  return (
    <div
      className={cn(
        "bg-white rounded-lg border border-gray-200 cursor-pointer overflow-hidden pt-1",
        className
      )}
      onClick={handleCardClick}
    >
      {/* Content */}
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 text-sm leading-tight mb-1">
              {truncateText(course.course_title, 60)}
              <span className="ml-1 text-gray-500 font-medium">
                ({course.course_code})
              </span>
            </h3>
          </div>
        </div>

        {/* Description */}
        {course.description && (
          <p className="text-xs text-gray-600 mb-4 overflow-hidden" style={{
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            lineHeight: '1.4em',
            maxHeight: '2.8em'
          }}>
            {truncateText(course.description, 120)}
          </p>
        )}

        {/* Badges */}
        <div className="flex items-center gap-1 mb-3">
          {course.category_name && (
            <span className="inline-flex items-center px-2 py-1 rounded-sm text-xs font-medium bg-blue-100 text-blue-800">
              {course.category_name}
            </span>
          )}
          <DifficultyBadge level={course.difficulty_level} />
        </div>

        {/* Duration */}
        <div className="flex items-center text-xs text-gray-500 mb-3">
          <Clock className="h-3 w-3 mr-1" />
          duration:&nbsp;
          {course.estimated_duration_hours > 0 
            ? `${course.estimated_duration_hours} hrs`
            : '0 hrs'
          }
        </div>

        {/* Progress Bar (if enrolled) */}
        {isEnrolled && !isCompleted && (
          <div className="mb-3">
            <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
              <span>Progress</span>
              <span>{Math.round(progressPercentage)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>
        )}

        {/* Action Button */}
        <EnrollButton
          courseId={course.id}
          isEnrolled={isEnrolled}
          isCompleted={isCompleted}
          enrollmentId={enrollment?.id}
          isLoading={isEnrolling}
          onEnroll={handleEnrollClick}
          className="w-full text-sm"
        />
      </div>
    </div>
  );
};