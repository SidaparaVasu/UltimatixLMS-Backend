/**
 * Shown when the course reaches 100% completion.
 * Congratulates the learner and offers certificate download.
 */

import { useState } from 'react';
import { Award, X, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

interface CourseCompletionModalProps {
  courseTitle: string;
  enrollmentId: number;
}

export const CourseCompletionModal = ({
  courseTitle,
  enrollmentId,
}: CourseCompletionModalProps) => {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="relative bg-white border border-gray-200 rounded-xl w-full max-w-md mx-4 p-8 text-center">
        {/* Dismiss */}
        <button
          onClick={() => setDismissed(true)}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Icon */}
        <div className="w-16 h-16 bg-amber-50 border border-amber-200 rounded-full flex items-center justify-center mx-auto mb-5">
          <Award className="h-7 w-7 text-amber-500" />
        </div>

        <h2 className="text-xl font-semibold text-gray-900 mb-2">Course Complete</h2>
        <p className="text-sm text-gray-500 mb-1">You have successfully completed</p>
        <p className="text-sm font-semibold text-gray-800 mb-6">{courseTitle}</p>

        {/* Actions */}
        <div className="space-y-2">
          <Link
            to="/my-learning"
            className="btn w-full"
          >
            <Award className="h-4 w-4" />
            View Certificate
          </Link>
          <button
            onClick={() => setDismissed(true)}
            className="btn btn-secondary w-full"
          >
            Continue Reviewing
          </button>
        </div>

        <Link
          to="/my-learning"
          className="flex items-center justify-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 transition-colors mt-4"
        >
          <ArrowLeft className="h-3 w-3" />
          Back to My Learning
        </Link>
      </div>
    </div>
  );
};
