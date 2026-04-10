import React from 'react';
import { CheckCircle, BookOpen, Award, BarChart2, ChevronUp, ChevronDown } from 'lucide-react';

interface StatItemProps {
  label: string;
  value: string | number;
  trend: string;
  trendDir: 'up' | 'down';
  trendSub: string;
  icon: React.ElementType;
  delayClass: string;
}

const StatCard: React.FC<StatItemProps> = ({ 
  label, value, trend, trendDir, trendSub, icon: Icon, delayClass 
}) => {
  const TrendIcon = trendDir === 'up' ? ChevronUp : ChevronDown;

  return (
    <div className={`kpi-card anim ${delayClass}`}>
      <div className="kpi-accent-bar" aria-hidden="true" />
      <div className="kpi-card-body">
        <div className="kpi-top">
          <div className="kpi-icon-wrap">
            <Icon size={18} />
          </div>
          <span className="kpi-label">{label}</span>
        </div>
        <div className="kpi-value">{value}</div>
        <div className={`kpi-trend ${trendDir}`}>
          <TrendIcon size={12} strokeWidth={2.5} />
          {trend}
          <span className="kpi-trend-sub">{trendSub}</span>
        </div>
      </div>
    </div>
  );
};

export const StatsGrid: React.FC = () => {
  const stats: StatItemProps[] = [
    {
      label: "Training Completion",
      value: "78%",
      trend: "+6.2%",
      trendDir: "up",
      trendSub: "vs last quarter",
      icon: CheckCircle,
      delayClass: "delay-1"
    },
    {
      label: "Active Courses",
      value: "3",
      trend: "+1",
      trendDir: "up",
      trendSub: "enrolled this month",
      icon: BookOpen,
      delayClass: "delay-2"
    },
    {
      label: "Certifications",
      value: "7",
      trend: "+2",
      trendDir: "up",
      trendSub: "earned this year",
      icon: Award,
      delayClass: "delay-3"
    },
    {
      label: "Skill Gap Score",
      value: "24%",
      trend: "-8%",
      trendDir: "down",
      trendSub: "reduced (good)",
      icon: BarChart2,
      delayClass: "delay-4"
    }
  ];

  return (
    <div className="kpi-grid">
      {stats.map((stat) => (
        <StatCard key={stat.label} {...stat} />
      ))}
    </div>
  );
};
