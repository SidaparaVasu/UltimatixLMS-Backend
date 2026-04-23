/**
 * Secure File Serve:
 * 1. Requests a short-lived signed token from POST /api/v1/files/files/request-token/
 * 2. Fetches the file as a blob via GET /api/v1/files/resources/<token>/
 *    (axios injects the JWT header — real /media/ path is never exposed)
 * 3. Creates a temporary object URL and renders it in an iframe
 *
 * The token is tied to the requesting user and expires in 5 minutes.
 * The serve endpoint supports HTTP Range requests (PDF.js partial loading).
 */

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { CourseLesson, CourseContent } from '@/types/courses.types';
import { DetailedEnrollmentProgress, LessonProgress } from '@/types/player.types';
import { LessonNavFooter } from './LessonNavFooter';
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

  // file_ref is the UUID from FileRegistry — present when file was uploaded via file_management
  // file_url is the /media/... path — used as fallback for externally hosted files
  const fileRef = content.file_ref ? String(content.file_ref) : null;
  const rawFileUrl = content.file_url || content.content_url;

  useEffect(() => {
    let objectUrl: string | null = null;

    const load = async () => {
      setIsLoading(true);
      setLoadError(null);
      setBlobUrl(null);

      try {
        // ── Path A: file_ref present → use secure token endpoint ──────────────
        if (fileRef) {
          // Step 1: Request a signed token
          const tokenData = await playerApi.requestDocumentToken(fileRef);
          if (!tokenData?.token) {
            setLoadError('Could not obtain access token for this file.');
            return;
          }

          // Step 2: Fetch the file blob via the secure serve endpoint
          // GET /api/v1/files/resources/<token>/
          const response = await apiClient.get(
            `/files/resources/${encodeURIComponent(tokenData.token)}/`,
            { responseType: 'blob' }
          );

          const mimeType =
            (response.headers['content-type'] as string) ||
            getMimeType(content.content_type, rawFileUrl ?? '');

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
            // Public CDN/S3 URL — use directly
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
            getMimeType(content.content_type, rawFileUrl);
          const blob = new Blob([response.data], { type: mimeType });
          objectUrl = URL.createObjectURL(blob);
          setBlobUrl(objectUrl);
          return;
        }

        setLoadError('No file reference or URL available for this content.');
      } catch (err: any) {
        const httpStatus = err?.response?.status;
        if (httpStatus === 404) {
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
      // Revoke object URL on unmount or content change to free memory
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
      {/* Viewer area */}
      <div className="flex-1 bg-gray-100 relative" style={{ minHeight: '600px' }}>

        {/* Loading */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-50 z-10">
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
              <p className="text-xs text-gray-500">Loading document...</p>
            </div>
          </div>
        )}

        {/* Error */}
        {loadError && !isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-50 z-10">
            <div className="text-center max-w-sm px-4">
              <p className="text-sm text-gray-600 mb-4">{loadError}</p>
            </div>
          </div>
        )}

        {/* Iframe — rendered from blob URL, no raw /media/ path exposed */}
        {blobUrl && !isLoading && (
          <iframe
            src={blobUrl}
            title={lesson.lesson_title}
            className="w-full border-0"
            style={{ height: '100%', minHeight: '600px' }}
          />
        )}
      </div>

      <LessonNavFooter
        lesson={lesson}
        nextLesson={nextLesson}
        isCompleted={isAlreadyCompleted ?? false}
      />
    </div>
  );
};

// ── Helpers ──────────────────────────────────────────────────────────────────

function getMimeType(contentType: string, url: string): string {
  switch (contentType) {
    case 'PDF': return 'application/pdf';
    case 'PPT': return 'application/vnd.ms-powerpoint';
    case 'DOCUMENT': return 'application/msword';
  }
  const ext = url.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'pdf': return 'application/pdf';
    case 'ppt': return 'application/vnd.ms-powerpoint';
    case 'pptx': return 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
    case 'doc': return 'application/msword';
    case 'docx': return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    default: return 'application/octet-stream';
  }
}
