import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: string;
}

export const Dialog = ({ 
  open, 
  onOpenChange, 
  title, 
  description, 
  children, 
  footer,
  maxWidth = '500px' 
}: DialogProps) => {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [open]);

  if (!open) return null;

  return createPortal(
    <div 
      className="dialog-overlay anim"
      style={{ animationDuration: '200ms', zIndex: 9999 }}
      onClick={() => onOpenChange(false)}
    >
      <div 
        className="dialog-content anim delay-1"
        style={{ maxWidth, animationDuration: '300ms', transformOrigin: 'center' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="dialog-header">
          <div>
            <h2 className="dialog-title">{title}</h2>
            {description && <p className="dialog-desc">{description}</p>}
          </div>
          <button 
            onClick={() => onOpenChange(false)}
            className="dialog-close-btn"
            aria-label="Close dialog"
          >
            <X size={18} strokeWidth={2} />
          </button>
        </div>
        
        <div className="dialog-body no-scrollbar">
          {children}
        </div>

        {footer && (
          <div className="dialog-footer">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};
