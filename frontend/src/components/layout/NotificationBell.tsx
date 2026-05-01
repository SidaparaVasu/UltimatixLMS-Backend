/**
 * NotificationBell
 *
 * Renders the bell icon with an unread badge and toggles the dropdown.
 *
 * The unread count is read from Zustand (seeded by the 30-second polling
 * query in useUnreadCount) so the badge updates without re-rendering the
 * entire header on every poll.
 */

import React from 'react';
import { Bell } from 'lucide-react';
import { useInAppNotificationStore } from '@/stores/inAppNotificationStore';
import { useUnreadCount } from '@/queries/notifications/useNotificationQueries';
import { NotificationDropdown } from './NotificationDropdown';

export const NotificationBell: React.FC = () => {
  const { unreadCount, isDropdownOpen, toggleDropdown, closeDropdown } =
    useInAppNotificationStore();

  // Start the 30-second polling loop and keep Zustand in sync.
  // This hook is safe to call here — it only runs when authenticated.
  useUnreadCount();

  return (
    // Wrapper needs position:relative so the dropdown is positioned relative to the bell
    <div style={{ position: 'relative', flexShrink: 0 }}>
      {/* Bell button */}
      <button
        onClick={toggleDropdown}
        className="topnav-icon-btn"
        title="Notifications"
        aria-label={
          unreadCount > 0
            ? `${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}`
            : 'Notifications'
        }
        aria-haspopup="true"
        aria-expanded={isDropdownOpen}
      >
        <Bell size={18} />

        {/* Badge — only shown when there are unread notifications */}
        {unreadCount > 0 && (
          <span
            style={{
              position: 'absolute',
              top: 5,
              right: 5,
              minWidth: 16,
              height: 16,
              background: 'var(--color-danger)',
              color: '#fff',
              fontSize: 9,
              fontWeight: 700,
              borderRadius: 'var(--radius-full)',
              border: '2px solid var(--color-surface)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              lineHeight: 1,
              padding: '0 3px',
              // Smooth pop-in when count first appears
              animation: 'badgePop 200ms ease both',
            }}
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}

        {/* Keyframe for badge pop-in */}
        <style>{`
          @keyframes badgePop {
            from { transform: scale(0.5); opacity: 0; }
            to   { transform: scale(1);   opacity: 1; }
          }
        `}</style>
      </button>

      {/* Dropdown panel */}
      {isDropdownOpen && (
        <NotificationDropdown onClose={closeDropdown} />
      )}
    </div>
  );
};
