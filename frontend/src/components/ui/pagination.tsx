import * as React from 'react';
import { ChevronLeft, ChevronRight, MoreHorizontal, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { cn } from '@/utils/cn';

/* ─────────────────────────────────────────────────────────────
   LOW-LEVEL PRIMITIVES
───────────────────────────────────────────────────────────── */

const Pagination = ({ className, ...props }: React.ComponentProps<'nav'>) => (
  <nav
    role="navigation"
    aria-label="pagination"
    className={cn('flex w-full items-center', className)}
    {...props}
  />
);
Pagination.displayName = 'Pagination';

const PaginationContent = React.forwardRef<
  HTMLUListElement,
  React.ComponentProps<'ul'>
>(({ className, ...props }, ref) => (
  <ul
    ref={ref}
    className={cn('flex flex-row items-center gap-1', className)}
    {...props}
  />
));
PaginationContent.displayName = 'PaginationContent';

const PaginationItem = React.forwardRef<
  HTMLLIElement,
  React.ComponentProps<'li'>
>(({ className, ...props }, ref) => (
  <li ref={ref} className={cn('', className)} {...props} />
));
PaginationItem.displayName = 'PaginationItem';

type PaginationLinkProps = {
  isActive?: boolean;
  disabled?: boolean;
} & React.ComponentProps<'button'>;

const PaginationLink = ({
  className,
  isActive,
  disabled,
  ...props
}: PaginationLinkProps) => (
  <button
    aria-current={isActive ? 'page' : undefined}
    disabled={disabled}
    className={cn(
      'flex h-8 w-8 items-center justify-center rounded-md border text-sm font-medium transition-colors cursor-pointer select-none',
      disabled && 'opacity-40 cursor-not-allowed pointer-events-none',
      className
    )}
    style={{
      fontFamily: 'var(--font-body)',
      borderColor: isActive ? 'var(--color-accent)' : 'var(--color-border)',
      background: isActive ? 'var(--color-accent)' : 'var(--color-surface)',
      color: isActive ? '#ffffff' : 'var(--color-text-secondary)',
    }}
    onMouseEnter={e => {
      if (!isActive && !disabled) {
        (e.currentTarget as HTMLButtonElement).style.background = 'var(--color-surface-alt)';
        (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-text-primary)';
      }
    }}
    onMouseLeave={e => {
      if (!isActive && !disabled) {
        (e.currentTarget as HTMLButtonElement).style.background = 'var(--color-surface)';
        (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-text-secondary)';
      }
    }}
    {...props}
  />
);
PaginationLink.displayName = 'PaginationLink';

const PaginationEllipsis = ({
  className,
  ...props
}: React.ComponentProps<'span'>) => (
  <span
    aria-hidden
    className={cn('flex h-8 w-8 items-center justify-center select-none', className)}
    style={{ color: 'var(--color-text-muted)' }}
    {...props}
  >
    <MoreHorizontal size={14} />
    <span className="sr-only">More pages</span>
  </span>
);
PaginationEllipsis.displayName = 'PaginationEllipsis';

/* ─────────────────────────────────────────────────────────────
   COMPOSED COMPONENT — use this in admin pages
───────────────────────────────────────────────────────────── */

interface AdminPaginationProps {
  currentPage: number;               // 1-indexed
  totalPages: number;
  totalItems?: number;               // e.g. "128 records"
  pageSize?: number;                 // items per page — shown in summary
  onPageChange: (page: number) => void;
  showSummary?: boolean;             // show "Showing X–Y of Z" on the left
  siblingCount?: number;             // page numbers shown either side of current (default 1)
}

/** Returns the page number array with `null` representing ellipsis */
function buildPageRange(
  current: number,
  total: number,
  siblings: number
): (number | null)[] {
  // Always show first, last, current ± siblings
  const range = new Set<number>();
  range.add(1);
  range.add(total);
  for (let i = current - siblings; i <= current + siblings; i++) {
    if (i >= 1 && i <= total) range.add(i);
  }

  const sorted = Array.from(range).sort((a, b) => a - b);
  const result: (number | null)[] = [];

  sorted.forEach((page, idx) => {
    if (idx > 0 && page - sorted[idx - 1] > 1) {
      result.push(null); // ellipsis gap
    }
    result.push(page);
  });

  return result;
}

export const AdminPagination = ({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  showSummary = true,
  siblingCount = 1,
}: AdminPaginationProps) => {
  if (totalPages <= 1) return null;

  const pages = buildPageRange(currentPage, totalPages, siblingCount);

  // Summary text: "Showing 21–40 of 128"
  const summaryText = (() => {
    if (!showSummary || totalItems === undefined) return null;
    const size = pageSize ?? 10;
    const from = (currentPage - 1) * size + 1;
    const to = Math.min(currentPage * size, totalItems);
    return `Showing ${from}-${to} of ${totalItems}`;
  })();

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 'var(--space-4)',
        marginTop: 'var(--space-4)',
        flexWrap: 'wrap',
      }}
    >
      {/* Left: record summary */}
      <span
        style={{
          fontSize: 'var(--text-xs)',
          color: '#3d3d3dff',
          fontWeight: 500,
          whiteSpace: 'nowrap',
          minWidth: '140px',
        }}
      >
        {summaryText}
      </span>

      {/* Centre: page controls */}
      <Pagination className="w-auto flex-shrink-0">
        <PaginationContent>

          {/* First page */}
          <PaginationItem>
            <PaginationLink
              onClick={() => onPageChange(1)}
              disabled={currentPage === 1}
              aria-label="Go to first page"
            >
              <ChevronsLeft size={14} strokeWidth={2} />
            </PaginationLink>
          </PaginationItem>

          {/* Previous page */}
          <PaginationItem>
            <PaginationLink
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
              aria-label="Go to previous page"
            >
              <ChevronLeft size={14} strokeWidth={2} />
            </PaginationLink>
          </PaginationItem>

          {/* Page numbers + ellipsis */}
          {pages.map((page, idx) =>
            page === null ? (
              <PaginationItem key={`ellipsis-${idx}`}>
                <PaginationEllipsis />
              </PaginationItem>
            ) : (
              <PaginationItem key={page}>
                <PaginationLink
                  isActive={page === currentPage}
                  onClick={() => onPageChange(page)}
                  aria-label={`Go to page ${page}`}
                >
                  {page}
                </PaginationLink>
              </PaginationItem>
            )
          )}

          {/* Next page */}
          <PaginationItem>
            <PaginationLink
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              aria-label="Go to next page"
            >
              <ChevronRight size={14} strokeWidth={2} />
            </PaginationLink>
          </PaginationItem>

          {/* Last page */}
          <PaginationItem>
            <PaginationLink
              onClick={() => onPageChange(totalPages)}
              disabled={currentPage === totalPages}
              aria-label="Go to last page"
            >
              <ChevronsRight size={14} strokeWidth={2} />
            </PaginationLink>
          </PaginationItem>

        </PaginationContent>
      </Pagination>

      {/* Right: current page indicator */}
      <span
        style={{
          fontSize: 'var(--text-xs)',
          color: '#3d3d3dff',
          fontWeight: 500,
          whiteSpace: 'nowrap',
          minWidth: '140px',
          textAlign: 'right',
        }}
      >
        Page{' '}
        <span style={{ color: 'var(--color-text-primary)', fontWeight: 600 }}>
          {currentPage}
        </span>
        {' '}of{' '}
        <span style={{ color: 'var(--color-text-primary)', fontWeight: 600 }}>
          {totalPages}
        </span>
      </span>
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────
   EXPORTS
───────────────────────────────────────────────────────────── */
export {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
};