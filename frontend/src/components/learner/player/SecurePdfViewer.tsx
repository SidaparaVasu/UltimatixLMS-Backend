/**
 * Features:
 * - Canvas rendering via react-pdf (PDF.js) — text is pixels, not DOM nodes
 * - Text layer disabled — prevents text selection and copy
 * - Annotation layer disabled — removes links/form fields
 * - Lazy page loading via IntersectionObserver — only renders visible pages
 * - No toolbar — custom minimal controls only (page count, zoom)
 * - DRM restrictions via useDocumentProtection hook
 * - Accepts a Blob URL (from DocumentViewer's secure fetch)
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { Loader2, ZoomIn, ZoomOut, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/utils/cn';
import { useDocumentProtection } from '@/hooks/useDocumentProtection';

import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// ── PDF.js worker ─────────────────────────────────────────────────────────────
// Use the CDN worker to avoid bundling it (reduces bundle size significantly)
pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.mjs`;

// ── Types ─────────────────────────────────────────────────────────────────────

interface SecurePdfViewerProps {
  /** Blob URL created from the authenticated file fetch */
  blobUrl: string;
  className?: string;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const MIN_SCALE = 0.5;
const MAX_SCALE = 2.5;
const SCALE_STEP = 0.25;
const DEFAULT_SCALE = 1.0;

// ── Component ─────────────────────────────────────────────────────────────────

export const SecurePdfViewer = ({ blobUrl, className }: SecurePdfViewerProps) => {
  const [numPages, setNumPages] = useState<number>(0);
  const [scale, setScale] = useState<number>(DEFAULT_SCALE);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [isDocLoading, setIsDocLoading] = useState(true);
  const [docError, setDocError] = useState<string | null>(null);

  // Tracks which pages are visible (for lazy rendering)
  const [visiblePages, setVisiblePages] = useState<Set<number>>(new Set([1]));
  const pageRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // DRM restrictions
  const protectionRef = useDocumentProtection<HTMLDivElement>();

  // ── Document load handlers ──────────────────────────────────────────────────

  const onDocumentLoadSuccess = useCallback(({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setIsDocLoading(false);
    setDocError(null);
    // Pre-render first 2 pages
    setVisiblePages(new Set([1, 2].filter(p => p <= numPages)));
  }, []);

  const onDocumentLoadError = useCallback((error: Error) => {
    setIsDocLoading(false);
    setDocError('Failed to load PDF. The file may be corrupted or unsupported.');
    console.error('[SecurePdfViewer] PDF load error:', error);
  }, []);

  // ── Lazy page loading via IntersectionObserver ──────────────────────────────

  useEffect(() => {
    if (numPages === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const pageNum = parseInt(entry.target.getAttribute('data-page') ?? '0', 10);
          if (!pageNum) return;

          if (entry.isIntersecting) {
            setVisiblePages((prev) => {
              if (prev.has(pageNum)) return prev;
              const next = new Set(prev);
              next.add(pageNum);
              // Also pre-load next page
              if (pageNum + 1 <= numPages) next.add(pageNum + 1);
              return next;
            });
            setCurrentPage(pageNum);
          }
        });
      },
      {
        root: scrollContainerRef.current,
        rootMargin: '200px 0px',  // pre-load 200px before entering viewport
        threshold: 0.1,
      }
    );

    // Observe all page placeholder divs
    pageRefs.current.forEach((el) => {
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [numPages]);

  // ── Zoom controls ───────────────────────────────────────────────────────────

  const zoomIn = () => setScale((s) => Math.min(s + SCALE_STEP, MAX_SCALE));
  const zoomOut = () => setScale((s) => Math.max(s - SCALE_STEP, MIN_SCALE));

  // ── Page navigation ─────────────────────────────────────────────────────────

  const goToPage = useCallback((pageNum: number) => {
    const el = pageRefs.current.get(pageNum);
    if (el && scrollContainerRef.current) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div
      ref={protectionRef}
      className={cn('flex flex-col h-full bg-gray-100', className)}
      // CSS-level text selection disable
      style={{ userSelect: 'none', WebkitUserSelect: 'none' }}
    >
      {/* ── Toolbar ── */}
      <div className="flex items-center justify-between px-4 py-2 bg-white border-b border-gray-200 flex-shrink-0">
        {/* Page navigation */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => goToPage(Math.max(1, currentPage - 1))}
            disabled={currentPage <= 1}
            className="flex items-center justify-center w-7 h-7 rounded text-gray-500 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            aria-label="Previous page"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          <span className="text-xs text-gray-600 tabular-nums min-w-[60px] text-center">
            {numPages > 0 ? `${currentPage} / ${numPages}` : '—'}
          </span>

          <button
            onClick={() => goToPage(Math.min(numPages, currentPage + 1))}
            disabled={currentPage >= numPages}
            className="flex items-center justify-center w-7 h-7 rounded text-gray-500 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            aria-label="Next page"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        {/* Zoom controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={zoomOut}
            disabled={scale <= MIN_SCALE}
            className="flex items-center justify-center w-7 h-7 rounded text-gray-500 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            aria-label="Zoom out"
          >
            <ZoomOut className="h-4 w-4" />
          </button>

          <span className="text-xs text-gray-600 tabular-nums w-12 text-center">
            {Math.round(scale * 100)}%
          </span>

          <button
            onClick={zoomIn}
            disabled={scale >= MAX_SCALE}
            className="flex items-center justify-center w-7 h-7 rounded text-gray-500 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            aria-label="Zoom in"
          >
            <ZoomIn className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* ── PDF scroll area ── */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto overflow-x-auto no-scrollbar"
      >
        {/* Loading state */}
        {isDocLoading && (
          <div className="flex items-center justify-center h-64">
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
              <p className="text-xs text-gray-500">Loading PDF...</p>
            </div>
          </div>
        )}

        {/* Error state */}
        {docError && !isDocLoading && (
          <div className="flex items-center justify-center h-64">
            <p className="text-sm text-gray-500 text-center px-4">{docError}</p>
          </div>
        )}

        {/* PDF Document */}
        <Document
          file={blobUrl}
          onLoadSuccess={onDocumentLoadSuccess}
          onLoadError={onDocumentLoadError}
          loading={null}  // we handle loading state ourselves
          className="flex flex-col items-center py-4 gap-3"
        >
          {Array.from({ length: numPages }, (_, i) => i + 1).map((pageNum) => (
            <div
              key={pageNum}
              data-page={pageNum}
              ref={(el) => {
                if (el) pageRefs.current.set(pageNum, el);
                else pageRefs.current.delete(pageNum);
              }}
              className="relative"
            >
              {visiblePages.has(pageNum) ? (
                <Page
                  pageNumber={pageNum}
                  scale={scale}
                  // Canvas rendering — text is pixels, not DOM nodes
                  renderTextLayer={false}
                  renderAnnotationLayer={false}
                  className="border border-gray-200"
                  loading={
                    <div
                      className="bg-white border border-gray-200 flex items-center justify-center"
                      style={{ width: 595 * scale, height: 842 * scale }}
                    >
                      <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                    </div>
                  }
                />
              ) : (
                // Placeholder div maintains scroll position while page is not rendered
                <div
                  className="bg-white border border-gray-200"
                  style={{ width: 595 * scale, height: 842 * scale }}
                />
              )}
            </div>
          ))}
        </Document>
      </div>
    </div>
  );
};
