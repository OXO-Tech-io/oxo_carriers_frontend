'use client';

import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { Check, ChevronDown, Search } from 'lucide-react';

export interface SearchableSelectOption {
  value: string;
  label: string;
  /** Right-aligned secondary text, e.g. a figure for that option. */
  meta?: string;
  /** Extra text matched by the search box but not displayed. */
  keywords?: string;
}

interface SearchableSelectProps {
  value: string | null;
  options: SearchableSelectOption[];
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  searchPlaceholder?: string;
  className?: string;
}

// Accessible combobox (button + filterable listbox): type to filter, Arrow keys
// to move, Enter to pick, Escape / outside click to close.
export function SearchableSelect({
  value,
  options,
  onChange,
  label,
  placeholder = 'Select...',
  searchPlaceholder = 'Search...',
  className = '',
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const listId = useId();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => `${o.label} ${o.keywords ?? ''}`.toLowerCase().includes(q));
  }, [options, query]);

  const selected = options.find((o) => o.value === value);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  useEffect(() => {
    listRef.current?.children[active]?.scrollIntoView({ block: 'nearest' });
  }, [active, open]);

  const openList = () => {
    setQuery('');
    const idx = options.findIndex((o) => o.value === value);
    setActive(Math.max(idx, 0));
    setOpen(true);
  };

  const pick = (opt: SearchableSelectOption) => {
    onChange(opt.value);
    setOpen(false);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((i) => Math.min(i + 1, Math.max(filtered.length - 1, 0)));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filtered[active]) pick(filtered[active]);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setOpen(false);
    }
  };

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      {label && (
        <label className="block text-[10px] font-bold text-[var(--gray-400)] uppercase tracking-wider mb-1.5">
          {label}
        </label>
      )}
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        onClick={() => (open ? setOpen(false) : openList())}
        className="flex w-full items-center justify-between gap-2 rounded-xl border border-[var(--gray-100)] bg-[var(--card-bg)] px-3.5 py-2.5 text-left text-sm font-semibold text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
      >
        <span className={`truncate ${selected ? '' : 'text-[var(--gray-400)]'}`}>
          {selected?.label ?? placeholder}
        </span>
        <ChevronDown className={`h-4 w-4 shrink-0 text-[var(--gray-400)] transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute z-30 mt-2 w-full min-w-[260px] overflow-hidden rounded-xl border border-[var(--gray-100)] bg-[var(--card-bg)] shadow-lg">
          <div className="flex items-center gap-2 border-b border-[var(--gray-100)] px-3 py-2">
            <Search className="h-4 w-4 shrink-0 text-[var(--gray-400)]" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setActive(0);
              }}
              onKeyDown={onKeyDown}
              placeholder={searchPlaceholder}
              role="combobox"
              aria-expanded
              aria-controls={listId}
              aria-activedescendant={filtered[active] ? `${listId}-${filtered[active].value}` : undefined}
              className="w-full bg-transparent text-sm font-medium text-[var(--foreground)] placeholder:text-[var(--gray-400)] focus:outline-none"
            />
          </div>
          <ul ref={listRef} id={listId} role="listbox" className="max-h-64 overflow-y-auto py-1">
            {filtered.length === 0 && (
              <li className="px-3.5 py-3 text-xs font-medium text-[var(--gray-400)]">No matches</li>
            )}
            {filtered.map((opt, i) => (
              <li
                key={opt.value}
                id={`${listId}-${opt.value}`}
                role="option"
                aria-selected={opt.value === value}
                onMouseEnter={() => setActive(i)}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => pick(opt)}
                className={`flex cursor-pointer items-center gap-2 px-3.5 py-2 text-sm ${
                  i === active ? 'bg-[var(--primary-light)]' : ''
                }`}
              >
                <Check className={`h-3.5 w-3.5 shrink-0 text-[var(--primary)] ${opt.value === value ? '' : 'invisible'}`} />
                <span className="flex-1 truncate font-semibold text-[var(--foreground)]">{opt.label}</span>
                {opt.meta && <span className="shrink-0 text-[11px] font-medium text-[var(--gray-400)]">{opt.meta}</span>}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
