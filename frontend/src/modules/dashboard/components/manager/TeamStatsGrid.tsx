import React from 'react';
import { Users, TrendingUp, BookOpen, AlertTriangle, ChevronUp, ChevronDown } from 'lucide-react';
import type { ManagerTeamStats, HrOverview } from '@/types/dashboard.types';

interface TeamStatsGridProps {
  stats: ManagerTeamStats | null | undefined;
  hrStats: HrOverview | null | undefined;
  isLoading: boolean;
}

interface StatCardProps {
  label: string;
  value: string | number;
  trend: string;
  trendDir: 'up' | 'down' | 'neutral';
  trendSub: string;
  icon: React.ElementType;
  delayClass: string;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, trend, trendDir, trendSub, icon: Icon, delayClass }) => {
  const TrendIcon = trendDir === 'up' ? ChevronUp : trendDir === 'down' ? ChevronDown : null;
  return (
    <div className={`kpi-card anim ${delayClass}`}>
      <div className="kpi-card-body">
        <div className="kpi-top">
          <div className="kpi-icon-wrap"><Icon size={18} /></div>
          <span className="kpi-label">{label}</span>
        </div>
        <div className="kpi-value">{value}</div>
        <div className={`kpi-trend ${trendDir}`}>
          {TrendIcon && <TrendIcon size={12} strokeWidth={2.5} />}
          {trend}
          <span className="kpi-trend-sub">{trendSub}</span>
        </div>
      </div>
    </div>
  );
};

const SkeletonCard: React.FC<{ delayClass: string }> = ({ delayClass }) => (
  <div className={`kpi-card anim ${delayClass}`}>
    <div className="kpi-card-body">
      <div className="kpi-top">
        <div className="pulse" style={{ width: 18, height: 18, background: 'var(--color-border)', borderRadius: 'var(--radius-sm)' }} />
        <div className="pulse" style={{ width: 80, height: 10, background: 'var(--color-border)', borderRadius: 'var(--radius-sm)' }} />
      </div>
      <div className="pulse" style={{ width: 60, height: 32, background: 'var(--color-border)', borderRadius: 'var(--radius-sm)', margin: '8px 0' }} />
      <div className="pulse" style={{ width: 100, height: 10, background: 'var(--color-border)', borderRadius: 'var(--radius-sm)' }} />
    </div>
  </div>
);

export const TeamStatsGrid: React.FC<TeamStatsGridProps> = ({ stats, hrStats, isLoading }) => {
  if (isLoading) {
    return (
      <div className="kpi-grid">
        {['delay-1', 'delay-2', 'delay-3', 'delay-4'].map((d) => (
          <SkeletonCard key={d} delayClass={d} />
        ))}
      </div>
    );
  }

  const cards: StatCardProps[] = [
    {
      label: 'Total Employees',
      value: hrStats?.total_employees ?? 0,
      trend: `${hrStats?.total_employees ?? 0} active`,
      trendDir: 'neutral',
      trendSub: 'in company',
      icon: Users,
      delayClass: 'delay-1',
    },
    {
      label: 'Completion Rate',
      value: `${hrStats?.completion_rate ?? 0}%`,
      trend: `${hrStats?.completion_rate ?? 0}%`,
      trendDir: (hrStats?.completion_rate ?? 0) >= 70 ? 'up' : 'down',
      trendSub: 'company average',
      icon: TrendingUp,
      delayClass: 'delay-2',
    },
    {
      label: 'In Progress',
      value: hrStats?.in_progress ?? 0,
      trend: `${hrStats?.in_progress ?? 0} active`,
      trendDir: 'up',
      trendSub: 'enrollments',
      icon: BookOpen,
      delayClass: 'delay-3',
    },
    {
      label: 'Overdue',
      value: hrStats?.overdue ?? 0,
      trend: hrStats?.overdue ? `${hrStats.overdue} overdue` : 'All on track',
      trendDir: hrStats?.overdue ? 'down' : 'neutral',
      trendSub: hrStats?.overdue ? 'action needed' : '',
      icon: AlertTriangle,
      delayClass: 'delay-4',
    },
  ];

  return (
    <div className="kpi-grid">
      {cards.map((card) => (
        <StatCard key={card.label} {...card} />
      ))}
    </div>
  );
};
