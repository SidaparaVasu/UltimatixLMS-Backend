import React, { useRef, useState, useEffect } from 'react';
import { ChevronDown, Plus, Loader2 } from 'lucide-react';

interface SearchableDropdownProps<T extends Record<string, unknown>> {
  items: T[];
  labelKey: keyof T;
  valueKey: keyof T;
  value: number | null;
  onChange: (id: number) => void;
  placeholder?: string;
  /** IDs that are already mapped — shown greyed out and unselectable */
  disabledIds?: number[];
  disabled?: boolean;
  /**
   * When provided, a "Create & add" row appears in the No Results state.
   * Called with the current search string; should resolve when creation is done.
   */
  onCreateOption?: (label: string) => Promise<void>;
  createLabel?: string;
}

export function SearchableDropdown<T extends Record<string, unknown>>({
  items,
  labelKey,
  valueKey,
  value,
  onChange,
  placeholder = 'Search...',
  disabledIds = [],
  disabled = false,
  onCreateOption,
  createLabel = 'Create',
}: SearchableDropdownProps<T>) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [creating, setCreating] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedItem = items.find((i) => i[valueKey] === value);
  const displayLabel = selectedItem ? String(selectedItem[labelKey]) : '';

  const filtered = items.filter((i) =>
    String(i[labelKey]).toLowerCase().includes(search.toLowerCase())
  );

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSelect = (id: number) => {
    onChange(id);
    setSearch('');
    setOpen(false);
  };

  const handleCreate = async () => {
    if (!onCreateOption || !search.trim() || creating) return;
    setCreating(true);
    try {
      await onCreateOption(search.trim());
      setSearch('');
      setOpen(false);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen((o) => !o)}
        className="w-full flex items-center justify-between bg-[#0a0c10] border border-slate-700 rounded-md px-3 py-1.5 text-xs text-left text-white focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <span className={displayLabel ? 'text-white' : 'text-slate-500'}>
          {displayLabel || placeholder}
        </span>
        <ChevronDown size={12} className="text-slate-500 shrink-0 ml-2" />
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full bg-[#1a1d27] border border-slate-700 rounded-md shadow-xl overflow-hidden">
          <div className="p-1.5 border-b border-slate-700">
            <input
              autoFocus
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Type to filter..."
              className="w-full bg-[#0a0c10] px-2 py-1 text-xs text-white rounded focus:outline-none"
            />
          </div>
          <ul className="max-h-44 overflow-y-auto">
            {filtered.length === 0 ? (
              <li className="px-3 py-2 text-xs text-slate-500">
                {onCreateOption && search.trim() ? (
                  <button
                    onClick={handleCreate}
                    disabled={creating}
                    className="flex items-center gap-1.5 text-blue-400 hover:text-blue-300 disabled:opacity-50 w-full text-left"
                  >
                    {creating ? (
                      <Loader2 size={11} className="animate-spin shrink-0" />
                    ) : (
                      <Plus size={11} className="shrink-0" />
                    )}
                    {createLabel} &ldquo;{search.trim()}&rdquo;
                  </button>
                ) : (
                  <span className="italic">No results</span>
                )}
              </li>
            ) : (
              filtered.map((item) => {
                const id = item[valueKey] as number;
                const label = String(item[labelKey]);
                const isDisabled = disabledIds.includes(id);
                const isSelected = id === value;
                return (
                  <li
                    key={id}
                    onClick={() => !isDisabled && handleSelect(id)}
                    className={`px-3 py-1.5 text-xs cursor-pointer flex items-center justify-between
                      ${isDisabled ? 'text-slate-600 cursor-default' : 'text-slate-200 hover:bg-slate-700'}
                      ${isSelected ? 'bg-blue-600/20 text-blue-300' : ''}
                    `}
                  >
                    {label}
                  </li>
                );
              })
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
