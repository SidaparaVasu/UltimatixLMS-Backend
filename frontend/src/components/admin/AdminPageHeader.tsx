import React from 'react';
import { LucideIcon } from 'lucide-react';

interface Breadcrumb {
  label: string;
  href?: string;
  onClick?: () => void;
}

interface AdminPageHeaderProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  breadcrumbs?: Breadcrumb[];
  action?: React.ReactNode;
  meta?: React.ReactNode; // e.g. record count badge, status pill
}

export const AdminPageHeader = ({
  title,
  description,
  icon: Icon,
  breadcrumbs,
  action,
  meta,
}: AdminPageHeaderProps) => {
  return (
    <div
      className="anim delay-1"
      style={{
        marginBottom: 'var(--space-6)',
      }}
    >
      {/* Breadcrumb row */}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-2)',
            marginBottom: 'var(--space-3)',
          }}
        >
          {breadcrumbs.map((crumb, i) => {
            const isLast = i === breadcrumbs.length - 1;
            return (
              <React.Fragment key={i}>
                {i > 0 && (
                  <span
                    style={{
                      color: 'var(--color-text-muted)',
                      fontSize: 'var(--text-xs)',
                      userSelect: 'none',
                    }}
                  >
                    /
                  </span>
                )}
                {isLast || (!crumb.href && !crumb.onClick) ? (
                  <span
                    style={{
                      fontSize: 'var(--text-xs)',
                      fontWeight: isLast ? 500 : 400,
                      color: isLast
                        ? 'var(--color-text-secondary)'
                        : 'var(--color-text-muted)',
                    }}
                  >
                    {crumb.label}
                  </span>
                ) : (
                  <a
                    href={crumb.href}
                    onClick={crumb.onClick}
                    style={{
                      fontSize: 'var(--text-xs)',
                      fontWeight: 400,
                      color: 'var(--color-text-muted)',
                      textDecoration: 'none',
                      transition: 'color 150ms ease',
                      cursor: 'pointer',
                    }}
                    onMouseEnter={e =>
                      ((e.currentTarget as HTMLAnchorElement).style.color =
                        'var(--color-text-primary)')
                    }
                    onMouseLeave={e =>
                      ((e.currentTarget as HTMLAnchorElement).style.color =
                        'var(--color-text-muted)')
                    }
                  >
                    {crumb.label}
                  </a>
                )}
              </React.Fragment>
            );
          })}
        </nav>
      )}

      {/* Main header row */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 'var(--space-4)',
          flexWrap: 'wrap',
        }}
      >
        {/* Left: icon + title + description + meta */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 'var(--space-4)',
          }}
        >
          {/* Icon block — only rendered if icon is provided */}
          {Icon && (
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--color-accent-subtle)',
                color: 'var(--color-accent)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                marginTop: '2px',
              }}
            >
              <Icon size={18} strokeWidth={1.75} />
            </div>
          )}

          <div>
            {/* Title row: title + optional meta inline */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-3)',
                flexWrap: 'wrap',
              }}
            >
              <h1
                style={{
                  margin: 0,
                  fontSize: '20px',
                  fontWeight: 700,
                  color: 'var(--color-text-primary)',
                  fontFamily: 'var(--font-body)',
                  lineHeight: 1.25,
                  letterSpacing: '-0.01em',
                }}
              >
                {title}
              </h1>

              {/* Inline meta: count badge, status pill, etc. */}
              {meta && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--space-2)',
                  }}
                >
                  {meta}
                </div>
              )}
            </div>

            {/* Description */}
            {description && (
              <p
                style={{
                  margin: '5px 0 0',
                  fontSize: 'var(--text-sm)',
                  color: 'var(--color-text-muted)',
                  lineHeight: 1.55,
                  maxWidth: '560px',
                }}
              >
                {description}
              </p>
            )}
          </div>
        </div>

        {/* Right: action slot */}
        {action && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-3)',
              flexShrink: 0,
            }}
          >
            {action}
          </div>
        )}
      </div>

      {/* Bottom border rule — visually grounds the header */}
      <div
        style={{
          marginTop: 'var(--space-5)',
          height: '1px',
          background: 'var(--color-border)',
        }}
      />
    </div>
  );
};