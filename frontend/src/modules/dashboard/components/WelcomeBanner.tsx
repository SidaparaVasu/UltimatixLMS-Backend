import React from 'react';
import { useAuthStore } from '@/stores/authStore';
import { getFullName } from '@/utils/user.utils';
import { Zap, Play } from 'lucide-react';

export const WelcomeBanner: React.FC = () => {
  const { user } = useAuthStore();
  const firstName = user?.profile?.first_name || user?.username || 'User';

  return (
    <div className="welcome-banner anim">
      <div className="welcome-left">
        <div className="welcome-greeting">Welcome back, {firstName}.</div>
        <div className="welcome-sub">You have 3 courses in progress and 1 pending assessment.</div>
        <div className="welcome-streak">
          <Zap size={12} fill="currentColor" />
          12-day learning streak
        </div>
      </div>
      
      <div className="welcome-right">
        <div className="resume-label">Continue where you left off</div>
        <div className="resume-title">Advanced Data Analytics with Python</div>
        <div className="resume-meta">Module 7 of 11 &nbsp;·&nbsp; 3h 20m remaining</div>
        <div className="resume-progress-track">
          <div className="resume-progress-fill" style={{ width: '67%' }}></div>
        </div>
        <div className="resume-progress-row">
          <span className="resume-pct">67% complete</span>
        </div>
        <button className="resume-btn">
          <Play size={14} fill="currentColor" />
          Resume Learning
        </button>
      </div>
    </div>
  );
};
