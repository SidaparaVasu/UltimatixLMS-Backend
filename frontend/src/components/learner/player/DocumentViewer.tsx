/**
 * Renders PDF / PPT / DOCUMENT content inside an iframe.
 *
 * Files are served through the authenticated endpoint:
 *   GET /api/v1/files/files/serve/?path=uploads/pdf/filename.pdf
 *
 * This endpoint:
 *   - Requires JWT auth (hides the real /media/ path from the browser)
 *   - Streams the file with correct MIME type and X-Frame-Options: SAMEORIGIN
 *
 * We fetch the file as a blob via axios (which injects the JWT header),
 * then create a temporary object URL for the iframe.
 */

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { CourseLesson, CourseContent } from '@/types/courses.types';
import { DetailedEnrollmentProgress, LessonProgress } from '@/types/player.types';
import { LessonNavFooter } from './LessonNavFooter';
import { apiClient } from '@/api/axios-client';

interface DocumentViewerProps {
  content: CourseContent;
  lesson: CourseLesson;
  enrollment: DetailedEnrollmentProgress;
  lessonProgress: LessonProgress | undefined;
  nextLesson: CourseLesson | null;
}

/**
 * Converts a file_url like "/media/uploads/pdf/abc.pdf"
 * into the relative path "uploads/pdf/abc.pdf" for the serve endpoint.
 */
function extractRelativePath(fileUrl: string): string {
  // Strip leading /media/ prefix (MEDIA_URL from Django settings)
  const mediaPrefix = '/media/';
  if (fileUrl.startsWith(mediaPrefix)) {
    return fileUrl.slice(mediaPrefix.length);
  }
  // Already a relative path or unknown format — use as-is
  return fileUrl.replace(/^\/+/, '');
}

/**
 * Builds the authenticated serve URL.
 * Endpoint: GET /api/v1/files/files/serve/?path=<relative_path>
 */
function buildServeUrl(fileUrl: string): string {
  const relativePath = extractRelativePath(fileUrl);
  return `/files/files/serve/?path=${encodeURIComponent(relativePath)}`;
}

export const DocumentViewer = ({
  content,
  lesson,
  enrollment,
  lessonProgress,
  nextLesson,
}: DocumentViewerProps) => {
  const isAlreadyCompleted = lessonProgress?.status === 'COMPLETED';

  // Prefer file_url (direct storage URL) over content_url
  const rawFileUrl = content.file_url || content.content_url;

  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!rawFileUrl) {
      setIsLoading(false);
      setLoadError('No file URL available.');
      return;
    }

    let objectUrl: string | null = null;

    const fetchFile = async () => {
      setIsLoading(true);
      setLoadError(null);
      setBlobUrl(null);

      try {
        // External public URL (S3, CDN) — use directly, no auth needed
        const isExternal =
          rawFileUrl.startsWith('http') &&
          !rawFileUrl.includes(window.location.hostname) &&
          !rawFileUrl.includes('127.0.0.1') &&
          !rawFileUrl.includes('localhost');

        if (isExternal) {
          setBlobUrl(rawFileUrl);
          setIsLoading(false);
          return;
        }

        // Backend-served file — fetch via authenticated serve endpoint
        const serveUrl = buildServeUrl(rawFileUrl);
        const response = await apiClient.get(serveUrl, {
          responseType: 'blob',
        });

        const blob = new Blob([response.data], {
          type: response.headers['content-type'] || getMimeType(content.content_type, rawFileUrl),
        });
        objectUrl = URL.createObjectURL(blob);
        setBlobUrl(objectUrl);
      } catch (err: any) {
        const status = err?.response?.status;
        if (status === 404) {
          setLoadError('File not found on the server.');
        } else if (status === 403) {
          setLoadError('You do not have permission to view this file.');
        } else {
          setLoadError('Failed to load document. Please try again.');
        }
        console.error('DocumentViewer fetch error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFile();

    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [rawFileUrl, content.content_type]);

  if (!rawFileUrl) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-sm text-gray-500">Document not available.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Document viewer area */}
      <div className="flex-1 bg-gray-100 relative" style={{ minHeight: '600px' }}>
        {/* Loading state */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-50 z-10">
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
              <p className="text-xs text-gray-500">Loading document...</p>
            </div>
          </div>
        )}

        {/* Error state */}
        {loadError && !isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-50 z-10">
            <div className="text-center max-w-sm px-4">
              <p className="text-sm text-gray-600 mb-4">{loadError}</p>
              <a
                href={rawFileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn text-xs h-8 px-3"
              >
                Open in new tab
              </a>
            </div>
          </div>
        )}

        {/* Iframe — shown once blob URL is ready */}
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
