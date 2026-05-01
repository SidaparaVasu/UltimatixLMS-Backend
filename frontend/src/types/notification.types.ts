/**
 * Notification types
 *
 * Mirrors the backend Notification model and NotificationType constants.
 * Used by the API layer, Zustand store, TanStack Query hooks, and all
 * notification UI components.
 */

export type NotificationType =
  // Learner
  | 'ENROLLMENT'
  | 'COMPLETION'
  | 'CERTIFICATE'
  | 'ASSESSMENT_RESULT'
  // TNI / Skill
  | 'TNI_APPROVAL'
  | 'TNI_REJECTION'
  | 'TNI_PENDING_REVIEW'
  | 'SKILL_RATING'
  | 'RATING_CYCLE_OPEN'
  // Training plan / approval
  | 'PLAN_PENDING_APPROVAL'
  | 'PLAN_APPROVED'
  | 'PLAN_REJECTED'
  // Session
  | 'SESSION_ENROLLED'
  | 'SESSION_REMINDER'
  // Compliance / admin
  | 'COMPLIANCE_EXPIRY'
  | 'COMPLIANCE_ALERT'
  | 'NEW_ENROLLMENT'
  | 'TEAM_COMPLETION';

// ---------------------------------------------------------------------------
// Frontend filter tab categories
// Maps to the ?tab= query param on GET /notifications/
// ---------------------------------------------------------------------------

export type NotificationTab = 'all' | 'learning' | 'approvals' | 'alerts';

// ---------------------------------------------------------------------------
// Core notification record
// ---------------------------------------------------------------------------

export interface Notification {
  id: number;
  notification_type: NotificationType;
  title: string;
  message: string;
  /** Frontend route to navigate to on click, e.g. '/my-learning' */
  action_url: string;
  /** Source model name for deep-linking, e.g. 'UserCourseEnrollment' */
  entity_type: string;
  /** Source record PK as string */
  entity_id: string;
  is_read: boolean;
  /** ISO timestamp when is_read was set to true. Null while unread. */
  read_at: string | null;
  /** ISO timestamp when the notification was created */
  sent_at: string;
}

// ---------------------------------------------------------------------------
// API response shapes
// ---------------------------------------------------------------------------

/** Response from GET /notifications/unread-count/ */
export interface UnreadCountResponse {
  count: number;
}

/** Response from POST /notifications/mark-all-read/ */
export interface MarkAllReadResponse {
  updated: number;
}

// ---------------------------------------------------------------------------
// Query param types
// ---------------------------------------------------------------------------

export interface NotificationListParams {
  /** Filter by read state. Omit to return all. */
  is_read?: boolean;
  /** Frontend tab filter — maps to a group of notification_types on the backend */
  tab?: NotificationTab;
  page?: number;
  page_size?: number;
}

// ---------------------------------------------------------------------------
// UI metadata per notification type
// Used by NotificationItem to pick the right icon and accent colour
// ---------------------------------------------------------------------------

export interface NotificationMeta {
  /** Lucide icon name */
  icon: string;
  /** Tailwind colour token for the left accent border and icon */
  color: string;
  /** Human-readable label for the type */
  label: string;
}

export const NOTIFICATION_META: Record<NotificationType, NotificationMeta> = {
  ENROLLMENT:           { icon: 'BookOpen',        color: 'var(--color-accent)',   label: 'Course Enrolled' },
  COMPLETION:           { icon: 'CheckCircle',     color: 'var(--color-success)',  label: 'Course Completed' },
  CERTIFICATE:          { icon: 'Award',           color: 'var(--color-warning)',  label: 'Certificate Ready' },
  ASSESSMENT_RESULT:    { icon: 'ClipboardList',   color: 'var(--color-accent)', label: 'Assessment Result' },
  TNI_APPROVAL:         { icon: 'ThumbsUp',        color: 'var(--color-success)',  label: 'Training Need Approved' },
  TNI_REJECTION:        { icon: 'ThumbsDown',      color: 'var(--color-destructive)',    label: 'Training Need Rejected' },
  TNI_PENDING_REVIEW:   { icon: 'ClipboardCheck',  color: 'var(--color-warning)', label: 'Training Need Pending' },
  SKILL_RATING:         { icon: 'Star',            color: 'var(--color-accent)', label: 'Skill Rating Submitted' },
  RATING_CYCLE_OPEN:    { icon: 'RefreshCw',       color: 'var(--color-accent)', label: 'Rating Cycle Open' },
  PLAN_PENDING_APPROVAL:{ icon: 'FileCheck',       color: 'var(--color-warning)', label: 'Plan Awaiting Approval' },
  PLAN_APPROVED:        { icon: 'FileCheck',       color: 'var(--color-success)',  label: 'Training Plan Approved' },
  PLAN_REJECTED:        { icon: 'FileX',           color: 'var(--color-destructive)',    label: 'Training Plan Rejected' },
  SESSION_ENROLLED:     { icon: 'CalendarCheck',   color: 'var(--color-accent)',   label: 'Session Enrolled' },
  SESSION_REMINDER:     { icon: 'Clock',           color: 'var(--color-warning)', label: 'Session Reminder' },
  COMPLIANCE_EXPIRY:    { icon: 'AlertTriangle',   color: 'var(--color-destructive)',    label: 'Compliance Expiring' },
  COMPLIANCE_ALERT:     { icon: 'ShieldAlert',     color: 'var(--color-destructive)',    label: 'Compliance Alert' },
  NEW_ENROLLMENT:       { icon: 'Users',           color: 'var(--color-accent)',   label: 'New Enrollment' },
  TEAM_COMPLETION:      { icon: 'UserCheck',       color: 'var(--color-success)',  label: 'Team Completion' },
};
