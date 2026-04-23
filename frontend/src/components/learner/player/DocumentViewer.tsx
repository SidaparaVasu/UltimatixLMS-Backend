import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { CourseLesson, CourseContent } from '@/types/courses.types';
import { DetailedEnrollmentProgress, LessonProgress } from '@/types/player.types';
import { LessonNavFooter } from './LessonNavFooter';
import { SecurePdfViewer } from './SecurePdfViewer';
import { apiClient } from '@/api/axios-client';
import { playerApi } from '@/api/player-api';

interface DocumentViewerProps {
  content: CourseContent;
  lesson: CourseLesson;
  enrollment: DetailedEnrollmentProgress;
  lessonProgress: LessonProgress | undefined;
  nextLesson: CourseLesson | null;
}

export const DocumentViewer = ({
  content,
  lesson,
  enrollment,
  lessonProgress,
  nextLesson,
}: DocumentViewerProps) => {
  const isAlreadyCompleted = lessonProgress?.status === 'COMPLETED';

  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // file_ref: UUID from FileRegistry (present when uploaded via file_management)
  // file_url: /media/... path (fallback for externally hosted files)
  const fileRef = content.file_ref ? String(content.file_ref) : null;
  const rawFileUrl = content.file_url || content.content_url;

  useEffect(() => {
    let objectUrl: string | null = null;

    const load = async () => {
      setIsLoading(true);
      setLoadError(null);
      setBlobUrl(null);

      try {
        // ── Path A: file_ref present → secure token flow ──────────────────────
        if (fileRef) {
          // Step 1: Request a signed token
          const tokenData = await playerApi.requestDocumentToken(fileRef);
          if (!tokenData?.token) {
            setLoadError('Could not obtain access token for this file.');
            return;
          }

          // Step 2: Fetch the file blob via the secure serve endpoint
          // For PPT files, the backend transparently serves the converted PDF
          const response = await apiClient.get(
            `/files/resources/${encodeURIComponent(tokenData.token)}/`,
            { responseType: 'blob' }
          );

          const mimeType =
            (response.headers['content-type'] as string) ||
            'application/pdf';

          const blob = new Blob([response.data], { type: mimeType });
          objectUrl = URL.createObjectURL(blob);
          setBlobUrl(objectUrl);
          return;
        }

        // ── Path B: No file_ref — external/public URL ─────────────────────────
        if (rawFileUrl) {
          const isExternal =
            rawFileUrl.startsWith('http') &&
            !rawFileUrl.includes(window.location.hostname) &&
            !rawFileUrl.includes('127.0.0.1') &&
            !rawFileUrl.includes('localhost');

          if (isExternal) {
            setBlobUrl(rawFileUrl);
            return;
          }

          // Backend-hosted but no file_ref — fetch with auth header
          const response = await apiClient.get(rawFileUrl, {
            responseType: 'blob',
            baseURL: rawFileUrl.startsWith('http') ? '' : undefined,
          });
          const mimeType =
            (response.headers['content-type'] as string) ||
            'application/pdf';
          const blob = new Blob([response.data], { type: mimeType });
          objectUrl = URL.createObjectURL(blob);
          setBlobUrl(objectUrl);
          return;
        }

        setLoadError('No file reference or URL available for this content.');
      } catch (err: any) {
        const httpStatus = err?.response?.status;
        if (httpStatus === 503) {
          setLoadError('PDF conversion is still in progress. Please try again in a moment.');
        } else if (httpStatus === 404) {
          setLoadError('File not found on the server.');
        } else if (httpStatus === 403 || httpStatus === 401) {
          setLoadError('You do not have permission to view this file.');
        } else {
          setLoadError('Failed to load document. Please try again.');
        }
        console.error('[DocumentViewer] fetch error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    load();

    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [fileRef, rawFileUrl, content.content_type]);

  if (!fileRef && !rawFileUrl) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-sm text-gray-500">Document not available.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* ── Loading state ── */}
      {isLoading && (
        <div className="flex-1 flex items-center justify-center bg-gray-50">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
            <p className="text-xs text-gray-500">Loading document...</p>
          </div>
        </div>
      )}

      {/* ── Error state ── */}
      {loadError && !isLoading && (
        <div className="flex-1 flex items-center justify-center bg-gray-50">
          <div className="text-center max-w-sm px-4">
            <p className="text-sm text-gray-600">{loadError}</p>
          </div>
        </div>
      )}

      {/* ── Secure PDF viewer (react-pdf canvas) ── */}
      {blobUrl && !isLoading && (
        <div className="flex-1 overflow-hidden" style={{ minHeight: '500px' }}>
          <SecurePdfViewer blobUrl={blobUrl} className="h-full" />
        </div>
      )}

      <LessonNavFooter
        lesson={lesson}
        nextLesson={nextLesson}
        isCompleted={isAlreadyCompleted ?? false}
      />
    </div>
  );
};
