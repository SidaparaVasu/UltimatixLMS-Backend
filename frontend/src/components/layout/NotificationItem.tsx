/**
 * NotificationItem
 *
 * Renders a single notification row used in both the dropdown and the
 * full notifications page. Handles icon selection, unread highlight,
 * relative timestamp, and click-to-navigate behaviour.
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen, CheckCircle, Award, ClipboardList,
  ThumbsUp, ThumbsDown, ClipboardCheck, Star,
  RefreshCw, FileCheck, FileX, CalendarCheck,
  Clock, AlertTriangle, ShieldAlert, Users, UserCheck,
  X,
} from 'lucide-react';
import { cn } from '@/utils/cn';
import type { Notification, NotificationType } from '@/types/notification.types';

// ---------------------------------------------------------------------------
// Icon map — one Lucide component per notification type
// ---------------------------------------------------------------------------

const ICON_MAP: Record<NotificationType, React.ReactNode> = {
  ENROLLMENT:            <BookOpen size={16} />,
  COMPLETION:            <CheckCircle size={16} />,
  CERTIFICATE:           <Award size={16} />,
  ASSESSMENT_RESULT:     <ClipboardList size={16} />,
  TNI_APPROVAL:          <ThumbsUp size={16} />,
  TNI_REJECTION:         <ThumbsDown size={16} />,
  TNI_PENDING_REVIEW:    <ClipboardCheck size={16} />,
  SKILL_RATING:          <Star size={16} />,
  RATING_CYCLE_OPEN:     <RefreshCw size={16} />,
  PLAN_PENDING_APPROVAL: <FileCheck size={16} />,
  PLAN_APPROVED:         <FileCheck size={16} />,
  PLAN_REJECTED:         <FileX size={16} />,
  SESSION_ENROLLED:      <CalendarCheck size={16} />,
  SESSION_REMINDER:      <Clock size={16} />,
  COMPLIANCE_EXPIRY:     <AlertTriangle size={16} />,
  COMPLIANCE_ALERT:      <ShieldAlert size={16} />,
  NEW_ENROLLMENT:        <Users size={16} />,
  TEAM_COMPLETION:       <UserCheck size={16} />,
};

// ---------------------------------------------------------------------------
// Colour map — Tailwind classes per notification type
// Used for the icon background and left accent border
// ---------------------------------------------------------------------------

const COLOR_MAP: Record<NotificationType, { bg: string; text: string; border: string }> = {
  ENROLLMENT:            { bg: 'bg-blue-50',   text: 'text-blue-600',   border: 'border-l-blue-500' },
  COMPLETION:            { bg: 'bg-green-50',  text: 'text-green-600',  border: 'border-l-green-500' },
  CERTIFICATE:           { bg: 'bg-amber-50',  text: 'text-amber-600',  border: 'border-l-amber-500' },
  ASSESSMENT_RESULT:     { bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-l-purple-500' },
  TNI_APPROVAL:          { bg: 'bg-green-50',  text: 'text-green-600',  border: 'border-l-green-500' },
  TNI_REJECTION:         { bg: 'bg-red-50',    text: 'text-red-600',    border: 'border-l-red-500' },
  TNI_PENDING_REVIEW:    { bg: 'bg-orange-50', text: 'text-orange-600', border: 'border-l-orange-500' },
  SKILL_RATING:          { bg: 'bg-indigo-50', text: 'text-indigo-600', border: 'border-l-indigo-500' },
  RATING_CYCLE_OPEN:     { bg: 'bg-indigo-50', text: 'text-indigo-600', border: 'border-l-indigo-500' },
  PLAN_PENDING_APPROVAL: { bg: 'bg-orange-50', text: 'text-orange-600', border: 'border-l-orange-500' },
  PLAN_APPROVED:         { bg: 'bg-green-50',  text: 'text-green-600',  border: 'border-l-green-500' },
  PLAN_REJECTED:         { bg: 'bg-red-50',    text: 'text-red-600',    border: 'border-l-red-500' },
  SESSION_ENROLLED:      { bg: 'bg-teal-50',   text: 'text-teal-600',   border: 'border-l-teal-500' },
  SESSION_REMINDER:      { bg: 'bg-yellow-50', text: 'text-yellow-600', border: 'border-l-yellow-500' },
  COMPLIANCE_EXPIRY:     { bg: 'bg-red-50',    text: 'text-red-600',    border: 'border-l-red-500' },
  COMPLIANCE_ALERT:      { bg: 'bg-red-50',    text: 'text-red-600',    border: 'border-l-red-500' },
  NEW_ENROLLMENT:        { bg: 'bg-blue-50',   text: 'text-blue-600',   border: 'border-l-blue-500' },
  TEAM_COMPLETION:       { bg: 'bg-green-50',  text: 'text-green-600',  border: 'border-l-green-500' },
};

// ---------------------------------------------------------------------------
// Relative time helper
// ---------------------------------------------------------------------------

function relativeTime(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime();
  const mins  = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days  = Math.floor(diff / 86_400_000);

  if (mins < 1)   return 'Just now';
  if (mins < 60)  return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days === 1) return 'Yesterday';
  if (days < 7)   return `${days}d ago`;
  return new Date(isoString).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface NotificationItemProps {
  notification: Notification;
  /** Called after the item is clicked (e.g. to close the dropdown) */
  onRead?: (id: number) => void;
  /** Called when the delete button is clicked */
  onDelete?: (id: number, wasUnread: boolean) => void;
  /** Compact mode for the dropdown (no full message, tighter padding) */
  compact?: boolean;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const NotificationItem: React.FC<NotificationItemProps> = ({
  notification,
  onRead,
  onDelete,
  compact = false,
}) => {
  const navigate = useNavigate();
  const colors = COLOR_MAP[notification.notification_type] ?? COLOR_MAP.ENROLLMENT;
  const icon   = ICON_MAP[notification.notification_type]  ?? <BookOpen size={16} />;

  const handleClick = () => {
    if (!notification.is_read) {
      onRead?.(notification.id);
    }
    if (notification.action_url) {
      navigate(notification.action_url);
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete?.(notification.id, !notification.is_read);
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={(e) => e.key === 'Enter' && handleClick()}
      className={cn(
        // Base
        'group relative flex items-start gap-3 cursor-pointer transition-colors duration-150',
        'border-l-4 rounded-r-lg',
        // Padding
        compact ? 'px-4 py-3' : 'px-5 py-4',
        // Unread highlight
        notification.is_read
          ? 'bg-transparent hover:bg-slate-50 border-l-transparent'
          : cn('border-l-4', colors.border, 'bg-slate-50/60 hover:bg-slate-100/60'),
      )}
    >
      {/* Icon bubble */}
      <div
        className={cn(
          'flex-shrink-0 rounded-full flex items-center justify-center mt-0.5',
          compact ? 'w-8 h-8' : 'w-9 h-9',
          colors.bg, colors.text,
        )}
      >
        {icon}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p
            className={cn(
              'text-sm leading-snug',
              notification.is_read
                ? 'font-normal text-slate-600'
                : 'font-semibold text-slate-800',
            )}
          >
            {notification.title}
          </p>
        </div>

        {/* Message — truncated in compact mode */}
        <p
          className={cn(
            'text-xs text-slate-500 mt-0.5 leading-relaxed',
            compact ? 'line-clamp-1' : 'line-clamp-2',
          )}
        >
          {notification.message}
        </p>

        <p className="text-xs text-slate-400 mt-1">
          {relativeTime(notification.sent_at)}
        </p>
      </div>

      {/* Delete button — visible on hover */}
      {onDelete && (
        <button
          onClick={handleDelete}
          title="Delete notification"
          className={cn(
            'flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-150',
            'text-slate-400 hover:text-red-500 m-auto',
          )}
        >
          <X size={13} />
        </button>
      )}
    </div>
  );
};
