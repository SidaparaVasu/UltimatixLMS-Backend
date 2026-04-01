import React from 'react';

interface ColumnConfig {
  width?: string;   // e.g. '40%', '120px' — controls skeleton bar width in that column
  isAvatar?: boolean; // renders a square avatar placeholder before the bar (first-col pattern)
}

interface AdminTableSkeletonProps {
  rowCount?: number;
  columns?: ColumnConfig[];  // explicit per-column config
  columnCount?: number;      // fallback: used when `columns` is not provided
  showActionCol?: boolean;   // appends a narrow actions column on the right
}

// Staggered animation delays per row — makes the skeleton feel alive, not robotic
const ROW_DELAYS = [0, 40, 80, 120, 160, 200, 240, 280];

export const AdminTableSkeleton = ({
  rowCount = 5,
  columns,
  columnCount = 4,
  showActionCol = false,
}: AdminTableSkeletonProps) => {
  // Build a normalised column list
  const cols: ColumnConfig[] = columns ?? Array.from({ length: columnCount }, (_, i) => ({
    width: i === 0 ? '55%' : i === columnCount - 1 ? '45%' : '75%',
    isAvatar: i === 0,
  }));

  const allCols = showActionCol ? [...cols, { width: '32px' }] : cols;

  return (
    <div
      style={{
        width: '100%',
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
      }}
    >
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>

        {/* ── Header ── */}
        <thead>
          <tr
            style={{
              borderBottom: '1px solid var(--color-border)',
              background: 'var(--color-canvas)',
            }}
          >
            {allCols.map((col, i) => (
              <th
                key={`th-${i}`}
                style={{
                  padding: 'var(--space-3) var(--space-4)',
                  textAlign: 'left',
                }}
              >
                <div
                  className="pulse"
                  style={{
                    height: '10px',
                    width: col.width ?? '60%',
                    background: 'var(--color-border)',
                    borderRadius: 'var(--radius-sm)',
                    opacity: 0.9,
                  }}
                />
              </th>
            ))}
          </tr>
        </thead>

        {/* ── Rows ── */}
        <tbody>
          {Array.from({ length: rowCount }).map((_, rIndex) => (
            <tr
              key={`tr-${rIndex}`}
              style={{
                borderBottom:
                  rIndex < rowCount - 1
                    ? '1px solid var(--color-border)'
                    : 'none',
                animationDelay: `${ROW_DELAYS[rIndex % ROW_DELAYS.length]}ms`,
              }}
            >
              {allCols.map((col, cIndex) => (
                <td
                  key={`td-${rIndex}-${cIndex}`}
                  style={{
                    padding: 'var(--space-3) var(--space-4)',
                    verticalAlign: 'middle',
                  }}
                >
                  {/* First column: avatar square + text bar side by side */}
                  {col.isAvatar ? (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 'var(--space-3)',
                      }}
                    >
                      {/* Avatar / icon placeholder */}
                      <div
                        className="pulse"
                        style={{
                          width: '30px',
                          height: '30px',
                          borderRadius: 'var(--radius-sm)',
                          background: 'var(--color-surface-alt)',
                          flexShrink: 0,
                        }}
                      />
                      {/* Name bar */}
                      <div
                        className="pulse"
                        style={{
                          height: '13px',
                          width: col.width ?? '55%',
                          background: 'var(--color-surface-alt)',
                          borderRadius: 'var(--radius-sm)',
                        }}
                      />
                    </div>
                  ) : (
                    /* Standard cell bar */
                    <div
                      className="pulse"
                      style={{
                        height: '13px',
                        width: col.width ?? '75%',
                        background: 'var(--color-surface-alt)',
                        borderRadius: 'var(--radius-sm)',
                      }}
                    />
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};