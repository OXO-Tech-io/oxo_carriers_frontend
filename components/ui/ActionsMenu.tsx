'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { MoreVertical } from 'lucide-react';

export interface ActionsMenuItem {
  label: string;
  onClick: () => void;
  variant?: 'default' | 'danger';
}

interface ActionsMenuProps {
  items: ActionsMenuItem[];
}

// Row-actions dropdown for DataTable "actions" columns - replaces long wrapped rows of inline
// text-link buttons with a single trigger + portal-rendered menu, so the menu escapes the
// table's `overflow-x-auto` wrapper instead of being clipped by it.
export function ActionsMenu({ items }: ActionsMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const openMenu = () => {
    const rect = triggerRef.current?.getBoundingClientRect();
    if (rect) {
      setPosition({ top: rect.bottom + 4, left: rect.right });
    }
    setIsOpen(true);
  };

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (
        menuRef.current && !menuRef.current.contains(e.target as Node) &&
        triggerRef.current && !triggerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    // Closes on scroll rather than repositioning - the trigger's rect (and this fixed-position
    // menu) would otherwise go stale, including for the table's own horizontal scroll container.
    const handleScroll = () => setIsOpen(false);

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    window.addEventListener('scroll', handleScroll, true);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [isOpen]);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          isOpen ? setIsOpen(false) : openMenu();
        }}
        className="rounded-lg p-1.5 text-[var(--gray-400)] transition-colors hover:bg-[var(--gray-100)] hover:text-[var(--foreground)]"
        aria-label="Row actions"
        aria-haspopup="menu"
        aria-expanded={isOpen}
      >
        <MoreVertical className="h-4 w-4" />
      </button>
      {isOpen &&
        createPortal(
          <div
            ref={menuRef}
            role="menu"
            style={{ position: 'fixed', top: position.top, left: position.left, transform: 'translateX(-100%)' }}
            className="z-50 min-w-[10rem] rounded-xl border border-[var(--gray-100)] bg-[var(--card-bg)] py-1.5 shadow-lg"
          >
            {items.map((item) => (
              <button
                key={item.label}
                role="menuitem"
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsOpen(false);
                  item.onClick();
                }}
                className={`block w-full px-3.5 py-2 text-left text-sm font-medium transition-colors ${
                  item.variant === 'danger'
                    ? 'text-red-500 hover:bg-red-50'
                    : 'text-[var(--foreground)] hover:bg-[var(--gray-50)]'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>,
          document.body
        )}
    </>
  );
}
