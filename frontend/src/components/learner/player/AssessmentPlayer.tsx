/**
 * Full quiz flow within the course player.
 * States: intro → question → result
 *
 * Note: "Mark as Complete" for quiz is handled automatically on PASS result.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { ClipboardList, Clock, CheckCircle, XCircle, ChevronRight, RotateCcw } from 'lucide-react';
import { cn } from '@/utils/cn';
import { CourseLesson } from '@/types/courses.types';
import {
  DetailedEnrollmentProgress,
  LessonProgress,
  AssessmentAttempt,
  UserAnswerLifecycle,
  AttemptResult,
  AssessmentInfo,
} from '@/types/player.types';
import {
  useAssessmentByLesson,
  useStartAttempt,
  useSubmitQuestion,
  useFinalizeAttempt,
  useAttemptResult,
  useMarkLessonComplete,
} from '@/queries/learner/usePlayerQueries';
import { useCoursePlayerStore } from '@/stores/coursePlayerStore';
import { LessonNavFooter } from './LessonNavFooter';
import { playerApi } from '@/api/player-api';

interface AssessmentPlayerProps {
  lesson: CourseLesson;
  enrollment: DetailedEnrollmentProgress;
  lessonProgress: LessonProgress | undefined;
  nextLesson: CourseLesson | null;
}

type QuizPhase = 'intro' | 'question' | 'finalizing' | 'result';

export const AssessmentPlayer = ({
  lesson,
  enrollment,
  lessonProgress,
  nextLesson,
}: AssessmentPlayerProps) => {
  const { showLessonCompleteOverlay } = useCoursePlayerStore();
  const markCompleteMutation = useMarkLessonComplete();

  const isAlreadyCompleted = lessonProgress?.status === 'COMPLETED';

  const [phase, setPhase] = useState<QuizPhase>('intro');
  const [attempt, setAttempt] = useState<AssessmentAttempt | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<UserAnswerLifecycle | null>(null);
  const [selectedOptions, setSelectedOptions] = useState<number[]>([]);
  const [answerText, setAnswerText] = useState('');
  const [result, setResult] = useState<AttemptResult | null>(null);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [isLoadingQuestion, setIsLoadingQuestion] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isFinalizing = useRef(false);

  // Fetch assessment info for this lesson
  const { data: assessments, isLoading: assessmentLoading } = useAssessmentByLesson(lesson.id);
  const assessment: AssessmentInfo | null = assessments?.[0] ?? null;

  const startAttemptMutation = useStartAttempt();
  const submitQuestionMutation = useSubmitQuestion();
  const finalizeAttemptMutation = useFinalizeAttempt();

  // Fetch result when in finalizing phase
  const { data: resultData } = useAttemptResult(
    attempt?.id ?? null,
    phase === 'finalizing'
  );

  // When result arrives, transition to result screen
  useEffect(() => {
    if (!resultData || phase !== 'finalizing') return;
    setResult(resultData);
    setPhase('result');
    isFinalizing.current = false;

    // If passed, mark lesson complete
    if (resultData.status === 'PASS') {
      const firstContent = lesson.contents?.[0];
      if (firstContent) {
        markCompleteMutation.mutate(
          { enrollmentId: enrollment.id, lessonId: lesson.id, contentId: firstContent.id },
          { onSuccess: () => showLessonCompleteOverlay(lesson.id) }
        );
      }
    }
  }, [resultData]); // eslint-disable-line react-hooks/exhaustive-deps

  // Per-question countdown timer
  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0) return;

    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t === null || t <= 1) {
          clearInterval(timerRef.current!);
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [timeLeft !== null && timeLeft > 0 ? 'active' : 'inactive']); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-submit when timer hits 0
  useEffect(() => {
    if (timeLeft === 0 && phase === 'question' && currentQuestion) {
      handleSubmitQuestion(true);
    }
  }, [timeLeft]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchNextQuestion = useCallback(async (attemptId: string) => {
    setIsLoadingQuestion(true);
    try {
      const data = await playerApi.getNextQuestion(attemptId);
      if (!data) return;

      if ('completed' in data && data.completed) {
        // No more questions — finalize
        if (!isFinalizing.current) {
          isFinalizing.current = true;
          setPhase('finalizing');
          await finalizeAttemptMutation.mutateAsync(attemptId);
        }
        return;
      }

      const qa = data as UserAnswerLifecycle;
      setCurrentQuestion(qa);
      setSelectedOptions([]);
      setAnswerText('');

      if (qa.time_limit_seconds > 0) {
        setTimeLeft(qa.time_limit_seconds);
      } else {
        setTimeLeft(null);
      }
    } finally {
      setIsLoadingQuestion(false);
    }
  }, [finalizeAttemptMutation]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleStartQuiz = useCallback(async () => {
    if (!assessment) return;
    const newAttempt = await startAttemptMutation.mutateAsync(assessment.id);
    if (!newAttempt) return;
    setAttempt(newAttempt);
    setPhase('question');
    await fetchNextQuestion(newAttempt.id);
  }, [assessment, startAttemptMutation, fetchNextQuestion]);

  const handleSubmitQuestion = useCallback(
    async (timedOut = false) => {
      if (!attempt || !currentQuestion) return;
      if (timerRef.current) clearInterval(timerRef.current);

      await submitQuestionMutation.mutateAsync({
        attemptId: attempt.id,
        payload: {
          question_id: currentQuestion.question.id,
          selected_options: timedOut ? [] : selectedOptions,
          answer_text: timedOut ? '' : answerText,
        },
      });

      await fetchNextQuestion(attempt.id);
    },
    [attempt, currentQuestion, selectedOptions, answerText, submitQuestionMutation, fetchNextQuestion]
  );

  const handleRetry = useCallback(() => {
    setPhase('intro');
    setAttempt(null);
    setCurrentQuestion(null);
    setSelectedOptions([]);
    setAnswerText('');
    setResult(null);
    setTimeLeft(null);
    isFinalizing.current = false;
  }, []);

  const toggleOption = (optionId: number) => {
    const isMultiSelect = currentQuestion?.question.question_type === 'MSQ';
    if (isMultiSelect) {
      setSelectedOptions((prev) =>
        prev.includes(optionId) ? prev.filter((id) => id !== optionId) : [...prev, optionId]
      );
    } else {
      setSelectedOptions([optionId]);
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  // ── Loading assessment info ───────────────────────────────────────────────────
  if (assessmentLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600" />
      </div>
    );
  }

  if (!assessment) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-sm text-gray-500">No assessment found for this lesson.</p>
      </div>
    );
  }

  // ── Intro Screen ─────────────────────────────────────────────────────────────
  if (phase === 'intro') {
    return (
      <div className="flex flex-col h-full">
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="max-w-md w-full bg-white border border-gray-200 rounded-lg p-8">
            <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center mb-5">
              <ClipboardList className="h-5 w-5 text-blue-600" />
            </div>

            <h2 className="text-lg font-semibold text-gray-900 mb-1">{assessment.title}</h2>
            {assessment.description && (
              <p className="text-sm text-gray-500 mb-5">{assessment.description}</p>
            )}

            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="bg-gray-50 rounded-md p-3">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-0.5">
                  Duration
                </p>
                <p className="text-sm font-semibold text-gray-800">
                  {assessment.duration_minutes} min
                </p>
              </div>
              <div className="bg-gray-50 rounded-md p-3">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-0.5">
                  Passing Score
                </p>
                <p className="text-sm font-semibold text-gray-800">
                  {assessment.passing_percentage}%
                </p>
              </div>
              <div className="bg-gray-50 rounded-md p-3">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-0.5">
                  Retake Limit
                </p>
                <p className="text-sm font-semibold text-gray-800">
                  {assessment.retake_limit} attempt{assessment.retake_limit !== 1 ? 's' : ''}
                </p>
              </div>
              {assessment.is_randomized && (
                <div className="bg-gray-50 rounded-md p-3">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-0.5">
                    Questions
                  </p>
                  <p className="text-sm font-semibold text-gray-800">Randomized</p>
                </div>
              )}
            </div>

            {isAlreadyCompleted && (
              <div className="flex items-center gap-2 text-sm font-medium text-emerald-600 bg-emerald-50 border border-emerald-200 px-3 py-2.5 rounded-md mb-3">
                <CheckCircle className="h-4 w-4" />
                You have already passed this quiz
              </div>
            )}

            <button
              onClick={handleStartQuiz}
              disabled={startAttemptMutation.isPending}
              className="btn w-full"
            >
              {startAttemptMutation.isPending
                ? 'Starting...'
                : isAlreadyCompleted
                ? 'Retake Quiz'
                : 'Start Quiz'}
            </button>
          </div>
        </div>
        <LessonNavFooter
          lesson={lesson}
          nextLesson={nextLesson}
          isCompleted={isAlreadyCompleted ?? false}
        />
      </div>
    );
  }

  // ── Question Screen ──────────────────────────────────────────────────────────
  if (phase === 'question') {
    if (isLoadingQuestion || !currentQuestion) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600" />
        </div>
      );
    }

    const { question } = currentQuestion;
    const isMultiSelect = question.question_type === 'MSQ';
    const isTextAnswer = question.question_type === 'SHORT_ANSWER';
    const canSubmit = isTextAnswer ? answerText.trim().length > 0 : selectedOptions.length > 0;

    return (
      <div className="flex flex-col h-full">
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-2xl mx-auto">
            {/* Timer */}
            {timeLeft !== null && (
              <div
                className={cn(
                  'flex items-center gap-1.5 text-sm font-medium mb-4 w-fit',
                  timeLeft <= 10 ? 'text-red-600' : 'text-gray-600'
                )}
              >
                <Clock className="h-4 w-4" />
                {formatTime(timeLeft)}
              </div>
            )}

            {/* Scenario text */}
            {question.scenario_text && (
              <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-4 text-sm text-gray-700">
                {question.scenario_text}
              </div>
            )}

            {/* Question */}
            <p className="text-base font-medium text-gray-900 mb-1">{question.question_text}</p>
            <p className="text-xs text-gray-400 mb-5">
              {isMultiSelect
                ? 'Select all that apply'
                : isTextAnswer
                ? 'Type your answer'
                : 'Select one answer'}
            </p>

            {/* Options */}
            {!isTextAnswer && question.options.length > 0 && (
              <div className="space-y-2">
                {question.options.map((option) => {
                  const isSelected = selectedOptions.includes(option.id);
                  return (
                    <button
                      key={option.id}
                      onClick={() => toggleOption(option.id)}
                      className={cn(
                        'w-full text-left px-4 py-3 rounded-md border text-sm transition-colors',
                        isSelected
                          ? 'border-blue-500 bg-blue-50 text-blue-800'
                          : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <span
                          className={cn(
                            'flex-shrink-0 w-4 h-4 mt-0.5 rounded-full border-2 flex items-center justify-center',
                            isSelected ? 'border-blue-500 bg-blue-500' : 'border-gray-300'
                          )}
                        >
                          {isSelected && (
                            <span className="w-1.5 h-1.5 rounded-full bg-white" />
                          )}
                        </span>
                        {option.option_text}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Text answer */}
            {isTextAnswer && (
              <textarea
                value={answerText}
                onChange={(e) => setAnswerText(e.target.value)}
                placeholder="Type your answer here..."
                rows={4}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-md text-sm text-gray-800 focus:outline-none focus:border-blue-500 resize-none"
              />
            )}
          </div>
        </div>

        {/* Submit bar */}
        <div className="px-6 py-4 bg-white border-t border-gray-200 flex items-center justify-end">
          <button
            onClick={() => handleSubmitQuestion(false)}
            disabled={!canSubmit || submitQuestionMutation.isPending}
            className="btn"
          >
            {submitQuestionMutation.isPending ? 'Saving...' : 'Next'}
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  // ── Finalizing ───────────────────────────────────────────────────────────────
  if (phase === 'finalizing') {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600" />
          <p className="text-sm text-gray-500">Grading your answers...</p>
        </div>
      </div>
    );
  }

  // ── Result Screen ────────────────────────────────────────────────────────────
  if (phase === 'result' && result) {
    const isPassed = result.status === 'PASS';
    const scorePercent = parseFloat(result.score_percentage);

    return (
      <div className="flex flex-col h-full">
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="max-w-md w-full bg-white border border-gray-200 rounded-lg p-8 text-center">
            <div
              className={cn(
                'w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-5',
                isPassed ? 'bg-emerald-50' : 'bg-red-50'
              )}
            >
              {isPassed ? (
                <CheckCircle className="h-7 w-7 text-emerald-500" />
              ) : (
                <XCircle className="h-7 w-7 text-red-500" />
              )}
            </div>

            <h2 className="text-xl font-semibold text-gray-900 mb-1">
              {isPassed ? 'Quiz Passed' : 'Quiz Failed'}
            </h2>
            <p className="text-sm text-gray-500 mb-6">
              {isPassed
                ? 'Well done. You have successfully completed this quiz.'
                : 'You did not meet the passing score. Review the material and try again.'}
            </p>

            <div className="bg-gray-50 rounded-lg p-5 mb-6">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-1">
                Your Score
              </p>
              <p
                className={cn(
                  'text-4xl font-bold',
                  isPassed ? 'text-emerald-600' : 'text-red-500'
                )}
                style={{ fontFamily: 'var(--font-mono)' }}
              >
                {Math.round(scorePercent)}%
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Passing score: {assessment.passing_percentage}%
              </p>
            </div>

            {result.instructor_feedback && (
              <div className="text-left bg-blue-50 border border-blue-200 rounded-md p-3 mb-5 text-sm text-gray-700">
                <p className="font-medium text-gray-800 mb-1 text-xs uppercase tracking-wide">
                  Feedback
                </p>
                {result.instructor_feedback}
              </div>
            )}

            {!isPassed && (
              <button onClick={handleRetry} className="btn btn-secondary w-full">
                <RotateCcw className="h-4 w-4" />
                Try Again
              </button>
            )}
          </div>
        </div>

        <LessonNavFooter lesson={lesson} nextLesson={nextLesson} isCompleted={isPassed} />
      </div>
    );
  }

  return null;
};
