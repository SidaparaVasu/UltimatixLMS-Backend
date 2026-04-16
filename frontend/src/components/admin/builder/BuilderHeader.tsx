import React from 'react';
import { X, Play, Save, CheckCircle2 } from 'lucide-react';
import { cn } from '@/utils/cn';

interface BuilderHeaderProps {
  title: string;
  status: 'DRAFT' | 'PUBLISHED';
  hasUnsavedChanges: boolean;
  onSave: () => void;
  onPreview: () => void;
  onClose: () => void;
  onPublish?: () => void;
}

/**
 * The high-end command bar for the full-screen Course Builder.
 * Manages the course lifecycle (Save, Preview, Publish, Exit).
 */
export const BuilderHeader: React.FC<BuilderHeaderProps> = ({
  title,
  status,
  hasUnsavedChanges,
  onSave,
  onPreview,
  onClose,
  onPublish,
}) => {
  return (
    <header className="sticky top-0 z-50 flex items-center justify-between h-14 px-4 bg-white border-b border-[var(--color-border)] shadow-sm">
      <div className="flex items-center gap-4">
        <button
          onClick={onClose}
          className="p-1.5 rounded-md hover:bg-slate-100 text-slate-500 transition-colors"
          title="Exit Builder"
        >
          <X size={20} />
        </button>
        
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-bold text-[var(--color-text-primary)] truncate max-w-[300px]">
              {title || 'Untitled Course'}
            </h1>
            <span className={cn(
              "px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider",
              status === 'PUBLISHED' 
                ? "bg-green-100 text-green-700" 
                : "bg-slate-100 text-slate-600"
            )}>
              {status}
            </span>
          </div>
          <div className="flex items-center gap-1.5 mt-0.5">
            <div className={cn(
              "w-1.5 h-1.5 rounded-full",
              hasUnsavedChanges ? "bg-amber-500" : "bg-green-500"
            )} />
            <span className="text-[10px] text-[var(--color-text-muted)] font-medium">
              {hasUnsavedChanges ? 'Unsaved Changes' : 'All changes saved to context'}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={onPreview}
          className="flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-bold text-slate-600 hover:bg-slate-50 border border-slate-200 transition-all"
        >
          <Play size={14} />
          LIVE PREVIEW
        </button>

        <button
          onClick={onSave}
          disabled={!hasUnsavedChanges}
          className={cn(
            "flex items-center gap-2 px-4 py-1.5 rounded-md text-xs font-bold transition-all",
            hasUnsavedChanges 
              ? "bg-[var(--color-accent)] text-white shadow-sm hover:brightness-110" 
              : "bg-slate-100 text-slate-400 cursor-not-allowed"
          )}
        >
          <Save size={14} />
          SAVE DRAFT
        </button>

        <div className="w-px h-6 bg-slate-200 mx-1" />

        <button
          onClick={onPublish}
          className="flex items-center gap-2 px-4 py-1.5 rounded-md text-xs font-bold bg-green-600 text-white shadow-sm hover:bg-green-700 transition-all"
        >
          <CheckCircle2 size={14} />
          PUBLISH
        </button>
      </div>
    </header>
  );
};
