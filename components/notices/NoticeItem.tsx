'use client';

import { useEffect, useRef, useState } from 'react';
import { Badge } from '@/components/ui/Badge';

interface NoticeItemProps {
  title: string;
  message: string;
  time: string;
  icon: React.ComponentType<{ className?: string }>;
  iconColor: string;
  iconBg: string;
  imageUrl?: string | null;
}

// A notice's title/message are free text from HR, so the card has to cope with
// very long titles, unbroken strings (URLs, IDs) and multi-paragraph messages
// without clipping at the card edge or leaving the rest unreadable:
//  - `break-words` wraps unbroken strings inside the column instead of letting
//    them run past the card edge.
//  - the title clamps to 2 lines and the message to 3, each with its own
//    line-height and a clear gap between them.
//  - when something is actually cut off, a "Read more" toggle expands the card
//    in place (and "Show less" collapses it again).
//  - `whitespace-pre-line` keeps the line breaks HR typed into the message.
export function NoticeItem({ title, message, time, icon: Icon, iconColor, iconBg, imageUrl }: NoticeItemProps) {
  const [expanded, setExpanded] = useState(false);
  const [canExpand, setCanExpand] = useState(false);
  const titleRef = useRef<HTMLParagraphElement>(null);
  const messageRef = useRef<HTMLParagraphElement>(null);

  // Only offer the toggle when text is really being clamped. Re-measured on
  // resize because the available width decides where lines wrap. Skipped while
  // expanded: nothing is clamped then, and the toggle has to stay put.
  useEffect(() => {
    if (expanded) return;
    const isCut = (el: HTMLElement | null) => !!el && el.scrollHeight > el.clientHeight + 1;
    const measure = () => setCanExpand(isCut(titleRef.current) || isCut(messageRef.current));
    measure();
    if (typeof ResizeObserver === 'undefined' || !messageRef.current) return;
    const observer = new ResizeObserver(measure);
    observer.observe(messageRef.current);
    return () => observer.disconnect();
  }, [title, message, expanded]);

  return (
    <div className="p-4 transition-colors duration-200 hover:bg-[var(--gray-50)]">
      {imageUrl && (
        <div className="mb-3 overflow-hidden rounded-xl shadow-sm">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={imageUrl} alt="" className="h-32 w-full object-cover" loading="lazy" />
        </div>
      )}
      <div className="flex items-start gap-3.5">
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${iconBg}`} style={{ color: iconColor }}>
          <Icon className="h-5 w-5 shrink-0" />
        </div>
        <div className="min-w-0 flex-1">
          <p
            ref={titleRef}
            className={`text-sm font-bold leading-snug break-words text-[var(--foreground)] ${expanded ? '' : 'line-clamp-2'}`}
          >
            {title}
          </p>
          <p
            ref={messageRef}
            className={`mt-1.5 text-xs leading-relaxed break-words whitespace-pre-line text-[var(--gray-500)] ${
              expanded ? '' : 'line-clamp-3'
            }`}
          >
            {message}
          </p>
          {canExpand && (
            <button
              type="button"
              onClick={() => setExpanded((open) => !open)}
              aria-expanded={expanded}
              className="mt-1.5 rounded text-xs font-bold text-[var(--primary)] hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]"
            >
              {expanded ? 'Show less' : 'Read more'}
            </button>
          )}
          <div className="mt-2">
            <Badge variant="gray">{time}</Badge>
          </div>
        </div>
      </div>
    </div>
  );
}
