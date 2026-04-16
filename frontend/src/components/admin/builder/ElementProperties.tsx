import React from 'react';
import { CurriculumNode } from './CurriculumTree';
import { Database, FileKey, Tag, Clock } from 'lucide-react';

interface ElementPropertiesProps {
  selectedNode: CurriculumNode | null;
}

export const ElementProperties: React.FC<ElementPropertiesProps> = ({ selectedNode }) => {
  if (!selectedNode) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center text-slate-500 h-full">
        <FileKey size={32} className="mb-4 opacity-20" />
        <p className="text-xs">Select an element from the curriculum tree to inspect its internal properties.</p>
      </div>
    );
  }

  const isNew = selectedNode.id.startsWith('new-');

  return (
    <div className="flex flex-col h-full bg-[#161925] text-slate-300">
      <div className="p-4 border-b border-slate-800/50 bg-[#1a1d2d]">
        <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">Inspector</h3>
        <p className="text-sm font-semibold truncate text-white">{selectedNode.title}</p>
      </div>

      <div className="p-4 space-y-6 flex-1 overflow-y-auto custom-scrollbar">
        {/* Technical Data */}
        <div className="space-y-3">
          <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-800 pb-2 flex items-center gap-2">
            <Database size={12} /> Technical IDs
          </h4>
          
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="text-slate-500">React Key:</div>
            <div className="font-mono text-slate-300 truncate" title={selectedNode.id}>{selectedNode.id}</div>
            
            <div className="text-slate-500">Node Type:</div>
            <div className="font-semibold text-blue-400">{selectedNode.type}</div>

            {selectedNode.type === 'LESSON' && (
              <>
                <div className="text-slate-500">Format:</div>
                <div className="text-emerald-400">{selectedNode.contentType || 'UNSET'}</div>
              </>
            )}
            
            <div className="text-slate-500">DB State:</div>
            <div>
              {isNew ? (
                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500/20 text-amber-500 uppercase tracking-widest">Unsaved Draft</span>
              ) : (
                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-500/20 text-emerald-500 uppercase tracking-widest">Persisted</span>
              )}
            </div>
          </div>
        </div>

        {/* Audit logs stub */}
        {!isNew && (
          <div className="space-y-3">
            <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-800 pb-2 flex items-center gap-2">
              <Clock size={12} /> Versioning
            </h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="text-slate-500">Created:</div>
              <div className="text-slate-300">Just now</div>
              
              <div className="text-slate-500">Last Modified:</div>
              <div className="text-slate-300">Just now</div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
