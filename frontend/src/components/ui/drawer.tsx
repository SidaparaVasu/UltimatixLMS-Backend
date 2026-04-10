import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface DrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  position?: 'left' | 'right' | 'top' | 'bottom';
  size?: string; // width for left/right, height for top/bottom
  title?: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  hideCloseButton?: boolean;
}

export const Drawer = ({ 
  open, 
  onOpenChange, 
  position = 'right',
  size = '400px',
  title, 
  description, 
  children, 
  footer,
  hideCloseButton = false
}: DrawerProps) => {
  
  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [open]);

  if (!open) return null;

  // Determine structural sizing dimensions based on injection axis
  const styleProps: React.CSSProperties = 
    (position === 'left' || position === 'right') 
      ? { width: size, maxWidth: '100vw' } 
      : { height: size, maxHeight: '100vh' };

  return (
    <div 
      className="drawer-overlay anim" 
      style={{ animationDuration: '200ms' }}
      onClick={() => onOpenChange(false)}
    >
      <div 
        className={`drawer-content drawer-${position}`}
        style={styleProps}
        onClick={e => e.stopPropagation()} // Prevent closing when clicking inside the drawer itself
      >
        {(title || description || !hideCloseButton) && (
          <div className="dialog-header" style={{ flexShrink: 0 }}>
            <div>
              {title && <h2 className="dialog-title">{title}</h2>}
              {description && <p className="dialog-desc">{description}</p>}
            </div>
            {!hideCloseButton && (
              <button 
                onClick={() => onOpenChange(false)}
                className="dialog-close-btn"
                aria-label="Close drawer"
              >
                <X size={18} strokeWidth={2} />
              </button>
            )}
          </div>
        )}
        
        <div className="dialog-body" style={{ flex: 1, overflowY: 'auto' }}>
          {children}
        </div>

        {footer && (
          <div className="dialog-footer" style={{ position: 'relative', flexShrink: 0, width: '100%', bottom: 'auto', left: 'auto' }}>
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
