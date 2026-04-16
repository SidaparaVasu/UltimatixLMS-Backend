import React, { useState, useEffect } from 'react';
import { Save, Folder } from 'lucide-react';
import { CurriculumNode } from './CurriculumTree';
import { AdminInput } from '@/components/admin/form';

interface SectionEditorProps {
  node: CurriculumNode;
  onSave: (id: string, updates: Partial<CurriculumNode>) => void;
}

export const SectionEditor: React.FC<SectionEditorProps> = ({ node, onSave }) => {
  const [title, setTitle] = useState(node.title);

  useEffect(() => {
    setTitle(node.title);
  }, [node]);

  const handleSave = () => {
    onSave(node.id, { title });
  };

  return (
    <div className="flex flex-col w-full h-full bg-[#12141c] text-white overflow-hidden">
      <div className="flex items-center justify-between gap-3 px-6 py-3 border-b border-slate-800/80 bg-[#0a0c10] shrink-0">
        <div className="flex items-center gap-3">
          {/* <div className="w-10 h-10 rounded-md bg-amber-500/20 text-amber-500 flex items-center justify-center">
            <Folder size={20} />
          </div> */}
          <div>
            <h2 className="text-xl font-bold tracking-tight">Section Details</h2>
            <p className="text-xs text-slate-400">Manage grouping for your lessons</p>
          </div>
        </div>
        <button 
          onClick={handleSave}
          className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-md shadow-[0_0_15px_rgba(37,99,235,0.2)] transition-all flex items-center gap-2"
        >
          <Save size={16} />
          Save Section
        </button>
      </div>

      <div className="p-6 flex-1">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">Section Title</label>
            <input 
              type="text" 
              value={title} 
              onChange={e => setTitle(e.target.value)}
              className="px-4 py-3 bg-[#0a0c10] border border-slate-700 rounded-md text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-medium"
              placeholder="e.g. Introduction to the Course"
            />
          </div>
          
          <div className="mt-2 pt-6 border-t border-slate-800">
            <h3 className="text-sm font-semibold mb-2">Section Settings</h3>
             <p className="text-xs text-slate-500">
               Additional section configuration like sequencing constraints or prerequisites can be managed here in the future.
             </p>
          </div>
        </div>
      </div>
    </div>
  );
};
