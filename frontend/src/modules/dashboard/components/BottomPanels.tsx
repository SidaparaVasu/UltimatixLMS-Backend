import React from 'react';
import { Check, Play, Award, HelpCircle, Bell, TriangleAlert, BookOpen, Star } from 'lucide-react';

export const ActivityFeed: React.FC = () => {
  const activities = [
    { type: 'complete', icon: Check, title: 'Completed course', course: 'Project Management Foundation', time: '2h ago' },
    { type: 'started', icon: Play, title: 'Started module', course: 'Advanced Python Decorators', time: '5h ago' },
    { type: 'cert', icon: Award, title: 'Earned certificate', course: 'Cloud Security Audit Q1', time: 'Yesterday' },
    { type: 'assessment', icon: HelpCircle, title: 'Attempted assessment', course: 'InfoSec Awareness', time: '2 days ago' },
    { type: 'complete', icon: Check, title: 'Completed', course: 'Anti-Bribery & Compliance Module 3', time: '2 days ago' },
  ];

  return (
    <div className="activity-panel anim delay-5">
      <div className="panel-head">
        <span className="panel-title">Recent Activity</span>
        <span className="panel-link">View All</span>
      </div>
      <div className="activity-list">
        {activities.map((act, i) => (
          <div key={i} className="activity-item">
            <div className={`activity-icon act-${act.type}`}>
              <act.icon size={16} />
            </div>
            <div className="activity-text">
              {act.title} <strong>{act.course}</strong>
            </div>
            <div className="activity-time">{act.time}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const NotificationPanel: React.FC = () => {
  const notifications = [
    { title: 'New Course Assigned', body: 'Workplace Safety Essentials has been assigned by your manager.', unread: true, icon: BookOpen, type: 'assign' },
    { title: 'Compliance Deadline Approaching', body: 'Info Security Awareness is due in 5 days. 88% completed.', unread: true, icon: TriangleAlert, type: 'alert' },
    { title: 'Certificate Expiry Notice', body: 'ITIL v4 Foundation certificate expires in 45 days. Renew now.', unread: false, icon: Award, type: 'cert' },
    { title: 'Training Reminder', body: 'Leadership Workshop starts on 4 April. Confirm attendance.', unread: false, icon: Clock, type: 'reminder' },
    { title: 'Badge Earned', body: 'Compliance Hero badge awarded for completing 3 compliance modules.', unread: false, icon: Star, type: 'achievement' },
  ];

  return (
    <div className="activity-panel anim delay-6">
      <div className="panel-head">
        <span className="panel-title">Notifications</span>
        <span className="panel-link">Mark all read</span>
      </div>
      <div className="activity-list">
        {notifications.map((notif, i) => (
          <div key={i} className={`notif-item ${notif.unread ? 'unread' : ''}`}>
            <div className={`notif-icon ni-${notif.type}`}>
              <notif.icon size={16} />
            </div>
            <div className="notif-content">
              <div className="notif-title">{notif.title}</div>
              <div className="notif-body">{notif.body}</div>
            </div>
            {notif.unread && <div className="notif-unread-dot" />}
          </div>
        ))}
      </div>
    </div>
  );
};

// Internal icon hack to fix the Clock import from lucide-react (it was Clock in HTML icons)
import { Clock } from 'lucide-react';
