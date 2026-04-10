import React from 'react';
import { X } from 'lucide-react';

interface AdminFilterChipsProps {
  activeFilters: [string, string][];
  onRemove: (key: string) => void;
  onClearAll: () => void;
  getLabel?: (key: string, val: string) => string;
  getKeyLabel?: (key: string) => string;
}

export const AdminFilterChips: React.FC<AdminFilterChipsProps> = ({
  activeFilters,
  onRemove,
  onClearAll,
  getLabel = (_, v) => v,
  getKeyLabel = (k) => k
}) => {
  if (activeFilters.length === 0) return null;

  return (
    <div className="anim delay-2" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: 'var(--space-4)', paddingBottom: 'var(--space-2)' }}>
      {activeFilters.map(([key, val]) => (
        <div key={key} style={{ 
          display: 'flex', alignItems: 'center', gap: '6px', 
          background: 'var(--color-surface-alt)', border: '1px solid var(--color-border)',
          padding: '4px 10px', borderRadius: '16px', fontSize: '12px' 
        }}>
          <span style={{ textTransform: 'capitalize', color: 'var(--color-text-muted)' }}>
            {getKeyLabel(key)}:
          </span>
          <span style={{ fontWeight: 500, color: 'var(--color-text-primary)', maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {getLabel(key, val)}
          </span>
          <X 
            size={14} 
            style={{ cursor: 'pointer', color: 'var(--color-text-muted)', marginLeft: '2px' }} 
            onClick={() => onRemove(key)} 
            onMouseEnter={e => e.currentTarget.style.color = 'var(--destructive)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--color-text-muted)'}
          />
        </div>
      ))}
      {activeFilters.length > 1 && (
        <button 
          onClick={onClearAll} 
          style={{ background: 'none', border: 'none', color: 'var(--color-accent)', cursor: 'pointer', fontSize: '13px', fontWeight: 500, padding: '4px 8px' }}
          onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
          onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}
        >
          Clear All
        </button>
      )}
    </div>
  );
};
