import React from 'react';
import { LucideIcon, SearchX, GlobeX } from 'lucide-react';

type EmptyVariant = 'default' | 'search' | 'error';

interface AdminEmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
  variant?: EmptyVariant;  // 'default' = no data yet | 'search' = no results | 'error' = failed to load
}

const variantConfig: Record<EmptyVariant, {
  defaultIcon: LucideIcon;
  iconBg: string;
  iconColor: string;
}> = {
  default: {
    defaultIcon: GlobeX,
    iconBg: '#d7e6ff57',
    iconColor: 'var(--color-accent)',
  },
  search: {
    defaultIcon: SearchX,
    iconBg: '#d7e6ff57',
    iconColor: 'var(--color-accent)',
  },
  error: {
    defaultIcon: GlobeX,
    iconBg: '#d7e6ff57',
    iconColor: 'var(--color-accent)',
  },
};

export const AdminEmptyState = ({
  icon,
  title,
  description,
  action,
  variant = 'default',
}: AdminEmptyStateProps) => {
  const config = variantConfig[variant];
  const Icon = icon ?? config.defaultIcon;

  return (
    <div
      className="anim"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--space-16) var(--space-8)',
        textAlign: 'center',
        background: 'var(--color-surface)',
        border: '1px dashed var(--color-border)',
        borderRadius: 'var(--radius-lg)',
      }}
    >
      {/* Icon */}
      <div
        style={{
          width: '48px',
          height: '48px',
          borderRadius: 'var(--radius-md)',
          background: config.iconBg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: config.iconColor,
          marginBottom: 'var(--space-4)',
          flexShrink: 0,
        }}
      >
        <Icon size={22} strokeWidth={1.5} />
      </div>

      {/* Title */}
      <h3
        style={{
          margin: '0 0 var(--space-2)',
          fontSize: 'var(--text-base)',
          fontWeight: 600,
          color: 'var(--color-text-primary)',
          lineHeight: 1.3,
        }}
      >
        {title}
      </h3>

      {/* Description */}
      <p
        style={{
          margin: 0,
          fontSize: 'var(--text-sm)',
          color: 'var(--color-text-muted)',
          maxWidth: '360px',
          lineHeight: 1.6,
        }}
      >
        {description}
      </p>

      {/* Action slot */}
      {action && (
        <div style={{ marginTop: 'var(--space-4)' }}>
          {action}
        </div>
      )}
    </div>
  );
};