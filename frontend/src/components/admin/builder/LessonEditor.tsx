import React, { useState, useEffect } from 'react';
import { Save, FileText, Video, Link as LinkIcon, UploadCloud, LayoutList, MonitorPlay, Presentation } from 'lucide-react';
import { CurriculumNode, ContentType } from './CurriculumTree';
import { cn } from '@/utils/cn';
import { QuizBuilder } from './QuizBuilder';

interface LessonEditorProps {
  node: CurriculumNode;
  onSave: (id: string, updates: Partial<CurriculumNode>) => void;
}

export const LessonEditor: React.FC<LessonEditorProps> = ({ node, onSave }) => {
  const [title, setTitle] = useState(node.title);
  const [contentType, setContentType] = useState<ContentType>(node.contentType || 'VIDEO');

  useEffect(() => {
    setTitle(node.title);
    setContentType(node.contentType || 'VIDEO');
  }, [node]);

  const handleSave = () => {
    onSave(node.id, { title, contentType });
  };

  const renderIcon = () => {
    switch (contentType) {
      case 'VIDEO': return <Video size={20} />;
      case 'PDF': return <FileText size={20} />;
      case 'PPT': return <Presentation size={20} />;
      case 'QUIZ': return <LayoutList size={20} />;
      default: return <LinkIcon size={20} />;
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#12141c] text-white overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 px-6 py-3 border-b border-slate-800/80 bg-[#0a0c10] shrink-0">
        <div className="flex items-center gap-3">
          {/* <div className="w-10 h-10 rounded-md bg-blue-500/20 text-blue-400 flex items-center justify-center">
            {renderIcon()}
          </div> */}
          <div>
            <h2 className="text-xl font-bold tracking-tight">Lesson Editor</h2>
            <p className="text-xs text-slate-400">Configure learning materials</p>
          </div>
        </div>
        <button 
          onClick={handleSave}
          className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-md shadow-[0_0_15px_rgba(37,99,235,0.2)] transition-all flex items-center gap-2"
        >
          <Save size={16} />
          Save Lesson Draft
        </button>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar p-6 space-y-6">
        
        {/* Metadata Section */}
        <section className="space-y-4">
          <div className="flex flex-col">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">Lesson Title</label>
            <input 
              type="text" 
              value={title} 
              onChange={e => setTitle(e.target.value)}
              className="px-4 py-3 bg-[#0a0c10] border border-slate-700 rounded-md text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-medium"
              placeholder="e.g. Setting up the Environment"
            />
          </div>
        </section>

        {/* Content Type Switcher */}
        <section className="space-y-4">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2 block">Content Format</label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full">
            {[
              { type: 'VIDEO', label: 'MP4 (YouTube)', icon: Video, active: true },
              { type: 'PDF', label: 'PDF Document', icon: FileText, active: true },
              { type: 'PPT', label: 'PPT Viewer', icon: Presentation, active: true },
              { type: 'LINK', label: 'External Link', icon: LinkIcon, active: true },
              { type: 'QUIZ', label: 'Assessment', icon: LayoutList, active: true },
              { type: 'SCORM', label: 'SCORM Package', icon: MonitorPlay, active: false },
            ].map(format => (
              <button
                key={format.type}
                disabled={!format.active}
                onClick={() => setContentType(format.type as ContentType)}
                className={cn(
                  "flex items-center justify-center gap-2 p-3 rounded-md border transition-all relative overflow-hidden",
                  contentType === format.type 
                    ? "bg-blue-500/10 border-blue-500 text-blue-400" 
                    : format.active
                      ? "bg-slate-800/30 border-slate-700 text-slate-400 hover:bg-slate-800 hover:text-white"
                      : "bg-[#0b0d13] border-slate-800 text-slate-600 cursor-not-allowed opacity-50"
                )}
              >
                {!format.active && (
                   <div className="absolute top-0 right-0 bg-slate-800 text-[8px] px-1 text-slate-400 rounded-bl-sm">
                     SOON
                   </div>
                )}
                <format.icon size={16} />
                <span className="text-[11px] font-bold tracking-wide">{format.label}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Sub-Editor Stubs */}
        <section className="pt-6 border-t border-slate-800">
          
          {contentType === 'VIDEO' && (
            <div className="space-y-4">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-widest block">Video Source URL</label>
              <input 
                type="url" 
                placeholder="https://www.youtube.com/watch?v=..." 
                className="w-full px-4 py-3 bg-[#0a0c10] border border-slate-700 rounded-md text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-medium text-sm"
              />
              <div className="h-48 rounded-lg bg-[#0a0c10] border border-slate-800 flex items-center justify-center text-slate-500">
                 <div className="text-center">
                    <Video size={32} className="mx-auto mb-2 opacity-50" />
                    <p className="text-xs">Video extraction preview will appear here</p>
                 </div>
              </div>
            </div>
          )}

          {(contentType === 'PDF' || contentType === 'PPT') && (
             <div className="space-y-4">
               <label className="text-xs font-semibold text-slate-400 uppercase tracking-widest block">Upload {contentType} Document</label>
               <div className="border-2 border-dashed border-slate-700 rounded-md p-12 flex flex-col items-center justify-center text-center hover:border-blue-500/50 hover:bg-blue-500/5 transition-all cursor-pointer">
                <UploadCloud size={48} className="text-slate-500 mb-4" />
                <h4 className="text-sm font-bold text-slate-300 mb-1">Upload {contentType}</h4>
                <p className="text-xs text-slate-500 max-w-xs mb-3">Drag and drop your .{contentType.toLowerCase()} or .potx file here.</p>
                <div className="px-3 py-1 bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded-full text-[10px] font-bold">
                  Files will be seen in-browser
                </div>
              </div>
             </div>
          )}

          {contentType === 'LINK' && (
             <div className="space-y-4">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-widest block">External Resource Configuration</label>
              
              <div className="flex flex-col gap-4">
                <input 
                  type="url" 
                  placeholder="https://example.com/reference-material" 
                  className="w-full px-4 py-3 bg-[#0a0c10] border border-slate-700 rounded-md text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-medium text-sm"
                />
                
                <label className="flex items-center gap-3 p-4 border border-slate-700 bg-slate-800/30 rounded-md cursor-pointer hover:bg-slate-800/50 transition">
                  <input type="checkbox" className="w-4 h-4 rounded border-slate-600 bg-slate-900 text-blue-500 focus:ring-blue-500 focus:ring-offset-slate-900" />
                  <div>
                    <p className="text-sm font-semibold text-white">Require "Mark Completed"</p>
                    <p className="text-xs text-slate-400 text-balance">
                      The learner must explicitly click "Mark Completed" after visiting this link for it to register as finished.
                    </p>
                  </div>
                </label>
              </div>
            </div>
          )}

          {contentType === 'QUIZ' && (
            <div className="pt-2">
               <QuizBuilder />
            </div>
          )}
        </section>

      </div>
    </div>
  );
};
