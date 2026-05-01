/**
 * NotificationDropdown
 *
 * Popover panel that appears when the bell icon is clicked.
 * Shows the 8 most recent notifications with mark-all-read and a
 * "View all" link to the full notifications page.
 *
 * Closes on outside click.
 */

import React, { useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BellOff, ArrowRight, Loader2 } from 'lucide-react';
import { NotificationItem } from './NotificationItem';
import {
  useNotificationList,
  useMarkRead,
  useMarkAllRead,
  useDeleteNotification,
} from '@/queries/notifications/useNotificationQueries';
import { useInAppNotificationStore } from '@/stores/inAppNotificationStore';

interface NotificationDropdownProps {
  onClose: () => void;
}

export const NotificationDropdown: React.FC<NotificationDropdownProps> = ({ onClose }) => {
  const panelRef = useRef<HTMLDivElement>(null);

  // Fetch the 8 most recent notifications (all types, all read states)
  const { data, isLoading } = useNotificationList({ page_size: 8 });
  const notifications = data?.results ?? [];

  const markRead      = useMarkRead();
  const markAllRead   = useMarkAllRead();
  const deleteNotif   = useDeleteNotification();
  const { unreadCount } = useInAppNotificationStore();

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  const handleRead = (id: number) => {
    markRead.mutate(id);
    onClose();
  };

  const handleDelete = (id: number, wasUnread: boolean) => {
    deleteNotif.mutate({ id, wasUnread });
  };

  const handleMarkAllRead = () => {
    markAllRead.mutate();
  };

  return (
    <div
      ref={panelRef}
      style={{
        position: 'absolute',
        top: 'calc(100% + 8px)',
        right: 0,
        width: '384px',
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-lg)',
        overflow: 'hidden',
        zIndex: 200,
        animation: 'ddFadeIn 140ms ease both',
      }}
    >
      {/* Fade-in keyframe */}
      <style>{`
        @keyframes ddFadeIn {
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* ── Header ─────────────────────────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '14px 16px 12px',
          borderBottom: '1px solid var(--color-border)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span
            style={{
              fontSize: 'var(--text-sm)',
              fontWeight: 600,
              color: 'var(--color-text-primary)',
            }}
          >
            Notifications
          </span>
          {unreadCount > 0 && (
            <span
              style={{
                background: 'var(--color-accent)',
                color: '#fff',
                fontSize: 10,
                fontWeight: 700,
                padding: '1px 7px',
                borderRadius: 'var(--radius-full)',
                lineHeight: '18px',
              }}
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </div>

        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            disabled={markAllRead.isPending}
            style={{
              fontSize: 'var(--text-xs)',
              fontWeight: 500,
              color: 'var(--color-accent)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '2px 4px',
              borderRadius: 'var(--radius-sm)',
              transition: 'color 150ms ease',
            }}
          >
            {markAllRead.isPending ? 'Marking…' : 'Mark all read'}
          </button>
        )}
      </div>

      {/* ── Body ───────────────────────────────────────────────────── */}
      <div style={{ maxHeight: '420px', overflowY: 'auto' }}>
        {isLoading ? (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '40px 0',
              color: 'var(--color-text-muted)',
            }}
          >
            <Loader2 size={20} className="animate-spin" />
          </div>
        ) : notifications.length === 0 ? (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '40px 24px',
              gap: 10,
              color: 'var(--color-text-muted)',
            }}
          >
            <BellOff size={28} strokeWidth={1.5} />
            <p style={{ fontSize: 'var(--text-sm)', margin: 0 }}>
              You're all caught up!
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {notifications.map((notif) => (
              <NotificationItem
                key={notif.id}
                notification={notif}
                onRead={handleRead}
                onDelete={handleDelete}
                compact
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Footer ─────────────────────────────────────────────────── */}
      <div
        style={{
          borderTop: '1px solid var(--color-border)',
          padding: '10px 16px',
        }}
      >
        <Link
          to="/notifications"
          onClick={onClose}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            fontSize: 'var(--text-sm)',
            fontWeight: 500,
            color: 'var(--color-accent)',
            textDecoration: 'none',
            padding: '6px 0',
            borderRadius: 'var(--radius-sm)',
            transition: 'color 150ms ease',
          }}
        >
          View all notifications
          <ArrowRight size={14} />
        </Link>
      </div>
    </div>
  );
};
