/**
 * NotificationsPage  (/notifications)
 *
 * Full-page notification centre with:
 *   - Filter tabs: All | Unread | Learning | Approvals | Alerts
 *   - Date-grouped notification list
 *   - Pagination
 *   - Mark-all-read button
 *   - Per-item delete
 *   - Empty state
 */

import React, { useState } from 'react';
import { Bell, BellOff, CheckCheck, Loader2 } from 'lucide-react';
import { NotificationItem } from '@/components/layout/NotificationItem';
import {
  useNotificationList,
  useMarkRead,
  useMarkAllRead,
  useDeleteNotification,
} from '@/queries/notifications/useNotificationQueries';
import { useInAppNotificationStore } from '@/stores/inAppNotificationStore';
import { cn } from '@/utils/cn';
import type { NotificationTab } from '@/types/notification.types';

// ---------------------------------------------------------------------------
// Tab config
// ---------------------------------------------------------------------------

interface Tab {
  key: NotificationTab | 'unread';
  label: string;
}

const TABS: Tab[] = [
  { key: 'all',       label: 'All' },
  { key: 'unread',    label: 'Unread' },
  { key: 'learning',  label: 'Learning' },
  { key: 'approvals', label: 'Approvals' },
  { key: 'alerts',    label: 'Alerts' },
];

const PAGE_SIZE = 20;

// ---------------------------------------------------------------------------
// Date grouping helper
// ---------------------------------------------------------------------------

function getDateGroup(isoString: string): string {
  const date  = new Date(isoString);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  const sameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth()    === b.getMonth()    &&
    a.getDate()     === b.getDate();

  if (sameDay(date, today))     return 'Today';
  if (sameDay(date, yesterday)) return 'Yesterday';

  const diffDays = Math.floor((today.getTime() - date.getTime()) / 86_400_000);
  if (diffDays < 7) return 'This Week';
  if (diffDays < 30) return 'This Month';
  return 'Older';
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const NotificationsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab['key']>('all');
  const [page, setPage] = useState(1);

  const { unreadCount } = useInAppNotificationStore();

  // Build query params from active tab
  const queryParams = {
    ...(activeTab === 'unread'
      ? { is_read: false }
      : activeTab !== 'all'
      ? { tab: activeTab as NotificationTab }
      : {}),
    page,
    page_size: PAGE_SIZE,
  };

  const { data, isLoading, isFetching } = useNotificationList(queryParams);
  const notifications = data?.results ?? [];
  const totalCount    = data?.count ?? 0;
  const totalPages    = Math.ceil(totalCount / PAGE_SIZE);

  const markRead    = useMarkRead();
  const markAllRead = useMarkAllRead();
  const deleteNotif = useDeleteNotification();

  const handleTabChange = (tab: Tab['key']) => {
    setActiveTab(tab);
    setPage(1);
  };

  const handleMarkAllRead = () => {
    markAllRead.mutate();
  };

  // Group notifications by date label
  const grouped: Record<string, typeof notifications> = {};
  const groupOrder: string[] = [];
  for (const notif of notifications) {
    const group = getDateGroup(notif.sent_at);
    if (!grouped[group]) {
      grouped[group] = [];
      groupOrder.push(group);
    }
    grouped[group].push(notif);
  }

  return (
    <div style={{ paddingTop: 'var(--space-8)', paddingBottom: 'var(--space-16)' }}>

      {/* ── Page header ──────────────────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 'var(--space-6)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <div
            style={{
              width: 40, height: 40,
              borderRadius: 'var(--radius-lg)',
              background: 'var(--color-accent-subtle)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--color-accent)',
            }}
          >
            <Bell size={20} />
          </div>
          <div>
            <h1
              style={{
                fontSize: 'var(--text-md)',
                fontWeight: 700,
                color: 'var(--color-text-primary)',
                margin: 0,
                lineHeight: 1.2,
              }}
            >
              Notifications
            </h1>
            {unreadCount > 0 && (
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', margin: 0 }}>
                {unreadCount} unread
              </p>
            )}
          </div>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            disabled={markAllRead.isPending}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              height: 36,
              padding: '0 14px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border)',
              background: 'var(--color-surface)',
              fontSize: 'var(--text-sm)',
              fontWeight: 500,
              color: 'var(--color-text-secondary)',
              cursor: 'pointer',
              transition: 'all 150ms ease',
            }}
          >
            <CheckCheck size={15} />
            {markAllRead.isPending ? 'Marking…' : 'Mark all read'}
          </button>
        )}
      </div>

      {/* ── Filter tabs ──────────────────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          gap: 4,
          borderBottom: '1px solid var(--color-border)',
          marginBottom: 'var(--space-5)',
        }}
      >
        {TABS.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => handleTabChange(tab.key)}
              style={{
                padding: '8px 14px',
                fontSize: 'var(--text-sm)',
                fontWeight: isActive ? 600 : 400,
                color: isActive ? 'var(--color-accent)' : 'var(--color-text-secondary)',
                background: 'none',
                border: 'none',
                borderBottom: isActive
                  ? '2px solid var(--color-accent)'
                  : '2px solid transparent',
                marginBottom: -1,
                cursor: 'pointer',
                transition: 'color 150ms ease, border-color 150ms ease',
                whiteSpace: 'nowrap',
              }}
            >
              {tab.label}
              {tab.key === 'unread' && unreadCount > 0 && (
                <span
                  style={{
                    marginLeft: 6,
                    background: 'var(--color-accent)',
                    color: '#fff',
                    fontSize: 10,
                    fontWeight: 700,
                    padding: '1px 6px',
                    borderRadius: 'var(--radius-full)',
                  }}
                >
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Content ──────────────────────────────────────────────── */}
      <div
        style={{
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden',
        }}
      >
        {isLoading ? (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '60px 0',
              color: 'var(--color-text-muted)',
            }}
          >
            <Loader2 size={24} className="animate-spin" />
          </div>
        ) : notifications.length === 0 ? (
          /* Empty state */
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '64px 24px',
              gap: 12,
              color: 'var(--color-text-muted)',
            }}
          >
            <BellOff size={36} strokeWidth={1.25} />
            <p style={{ fontSize: 'var(--text-sm)', fontWeight: 500, margin: 0 }}>
              {activeTab === 'unread'
                ? "You're all caught up — no unread notifications."
                : 'No notifications here yet.'}
            </p>
          </div>
        ) : (
          /* Date-grouped list */
          <div>
            {groupOrder.map((group, gi) => (
              <div key={group}>
                {/* Group label */}
                <div
                  style={{
                    padding: '10px 20px 6px',
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    color: 'var(--color-text-muted)',
                    background: 'var(--color-canvas)',
                    borderBottom: '1px solid var(--color-border)',
                    ...(gi > 0 ? { borderTop: '1px solid var(--color-border)' } : {}),
                  }}
                >
                  {group}
                </div>

                {/* Items in this group */}
                {grouped[group].map((notif, idx) => (
                  <div
                    key={notif.id}
                    style={{
                      borderBottom:
                        idx < grouped[group].length - 1
                          ? '1px solid var(--color-border)'
                          : 'none',
                    }}
                  >
                    <NotificationItem
                      notification={notif}
                      onRead={(id) => markRead.mutate(id)}
                      onDelete={(id, wasUnread) =>
                        deleteNotif.mutate({ id, wasUnread })
                      }
                      compact={false}
                    />
                  </div>
                ))}
              </div>
            ))}

            {/* Subtle loading overlay on background refetch */}
            {isFetching && !isLoading && (
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  padding: 'var(--space-3)',
                  borderTop: '1px solid var(--color-border)',
                  color: 'var(--color-text-muted)',
                }}
              >
                <Loader2 size={16} className="animate-spin" />
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Pagination ───────────────────────────────────────────── */}
      {totalPages > 1 && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: 'var(--space-5)',
          }}
        >
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', margin: 0 }}>
            Page {page} of {totalPages} · {totalCount} total
          </p>

          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              style={{
                height: 34,
                padding: '0 14px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-border)',
                background: 'var(--color-surface)',
                fontSize: 'var(--text-sm)',
                fontWeight: 500,
                color: page === 1 ? 'var(--color-text-muted)' : 'var(--color-text-primary)',
                cursor: page === 1 ? 'not-allowed' : 'pointer',
                opacity: page === 1 ? 0.5 : 1,
              }}
            >
              ← Prev
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              style={{
                height: 34,
                padding: '0 14px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-border)',
                background: 'var(--color-surface)',
                fontSize: 'var(--text-sm)',
                fontWeight: 500,
                color: page === totalPages ? 'var(--color-text-muted)' : 'var(--color-text-primary)',
                cursor: page === totalPages ? 'not-allowed' : 'pointer',
                opacity: page === totalPages ? 0.5 : 1,
              }}
            >
              Next →
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationsPage;
