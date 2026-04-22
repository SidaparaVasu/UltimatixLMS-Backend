import { Link } from "react-router-dom";
import { ChevronRight, Loader2 } from "lucide-react";
import { cn } from "@/utils/cn";

interface EnrollButtonProps {
  courseId: number;
  isEnrolled: boolean;
  isCompleted: boolean;
  enrollmentId?: number;
  isLoading: boolean;
  onEnroll: (e: React.MouseEvent<HTMLButtonElement>) => void;
  className?: string;
}

export const EnrollButton = ({
  courseId,
  isEnrolled,
  isCompleted,
  enrollmentId,
  isLoading,
  onEnroll,
  className
}: EnrollButtonProps) => {
  if (isCompleted) {
    return (
      <button
        disabled
        className={cn(
          "py-5 bg-green-50 text-green-700 border border-green-200",
          className
        )}
      >
        Course Completed!
      </button>
    );
  }

  if (isEnrolled && enrollmentId) {
    return (
      <Link
        to={`/learn/${enrollmentId}`}
        className={cn("flex items-center justify-center", className)}
      >
        Continue Learning
        <ChevronRight className="ml-2 h-4 w-4" />
      </Link>
    );
  }

  return (
    <button
      onClick={onEnroll}
      disabled={isLoading}
      className={cn("btn", className)}
      aria-label={`Enroll in course ${courseId}`}
    >
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Enrolling...
        </>
      ) : (
        'Enroll Now'
      )}
    </button>
  );
};