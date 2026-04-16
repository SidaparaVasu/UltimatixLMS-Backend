import React, { useState } from 'react';
import { Upload, Link as LinkIcon, Video, ImageIcon, FileText, CheckCircle2 } from 'lucide-react';
import { cn } from '@/utils/cn';

export type MediaType = 'IMAGE' | 'VIDEO' | 'PDF';

interface MediaInputProps {
  label: string;
  type: MediaType;
  value?: string;
  placeholder?: string;
  helperText?: string;
  onChange: (value: string) => void;
  className?: string;
}

/**
 * A specialized, high-end input for media assets (Thumbnails, Video Lessons).
 * Supports URL entry with a fallback "Dropzone" visual.
 */
export const MediaInput: React.FC<MediaInputProps> = ({
  label,
  type,
  value,
  placeholder,
  helperText,
  onChange,
  className,
}) => {
  const [isUrlMode, setIsUrlMode] = useState(true);

  const getIcon = () => {
    switch (type) {
      case 'IMAGE': return <ImageIcon size={20} />;
      case 'VIDEO': return <Video size={20} />;
      case 'PDF': return <FileText size={20} />;
    }
  };

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">
          {label}
        </label>
        <div className="flex p-0.5 bg-slate-100 rounded-md border border-slate-200">
          <button
            onClick={() => setIsUrlMode(true)}
            className={cn(
              "px-2 py-1 text-[10px] font-bold rounded transition-all",
              isUrlMode ? "bg-white text-[var(--color-accent)] shadow-sm" : "text-slate-500"
            )}
          >
            URL
          </button>
          <button
            onClick={() => setIsUrlMode(false)}
            className={cn(
              "px-2 py-1 text-[10px] font-bold rounded transition-all",
              !isUrlMode ? "bg-white text-[var(--color-accent)] shadow-sm" : "text-slate-500"
            )}
          >
            UPLOAD
          </button>
        </div>
      </div>

      <div className={cn(
        "relative flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-xl transition-all",
        value ? "bg-slate-50 border-[var(--color-accent-subtle)]" : "bg-white border-slate-200 hover:border-slate-300"
      )}>
        {value ? (
          <div className="flex flex-col items-center text-center">
            <div className="p-3 bg-white rounded-full text-[var(--color-accent)] shadow-sm mb-3">
              <CheckCircle2 size={24} />
            </div>
            <p className="text-xs font-bold text-slate-700 mb-1">Asset Linked Successfully</p>
            <p className="text-[10px] text-slate-500 font-mono break-all max-w-[240px] truncate">
              {value}
            </p>
            <button 
              onClick={() => onChange('')}
              className="mt-4 text-[10px] font-bold text-red-500 hover:underline"
            >
              REMOVE ASSET
            </button>
          </div>
        ) : (
          <>
            <div className="mb-4 text-slate-300">
              {getIcon()}
            </div>
            
            {isUrlMode ? (
              <div className="flex flex-col items-center w-full max-w-[320px]">
                <input 
                  type="text"
                  placeholder={placeholder || 'Paste URL here...'}
                  className="w-full h-10 px-4 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-[var(--color-accent-subtle)] focus:border-[var(--color-accent)] outline-none transition-all"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      onChange((e.target as HTMLInputElement).value);
                    }
                  }}
                />
                <p className="mt-2 text-[10px] text-slate-400">
                  {helperText || `Press Enter to link this ${type.toLowerCase()}.`}
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <button
                  className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-600 shadow-sm hover:bg-slate-50 transition-all"
                >
                  <Upload size={14} />
                  BROWSE FILES
                </button>
                <p className="mt-2 text-[10px] text-slate-400">
                  Support for local uploads is coming soon.
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
