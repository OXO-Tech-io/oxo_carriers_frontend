'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, CheckCheck } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useNotificationsQuery } from '@/hooks/queries/use-notifications-query';
import { useUnreadNotificationsCountQuery } from '@/hooks/queries/use-unread-notifications-count-query';
import { useMarkNotificationReadMutation } from '@/hooks/mutations/use-mark-notification-read-mutation';
import { useMarkAllNotificationsReadMutation } from '@/hooks/mutations/use-mark-all-notifications-read-mutation';
import type { AppNotification } from '@/types/profile';

export function NotificationBell() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { data: notifications = [] } = useNotificationsQuery({ limit: 10 });
  const { data: unreadCount = 0 } = useUnreadNotificationsCountQuery();
  const markRead = useMarkNotificationReadMutation();
  const markAllRead = useMarkAllNotificationsReadMutation();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNotificationClick = (notification: AppNotification) => {
    if (!notification.isRead) {
      markRead.mutate(notification.id);
    }
    setOpen(false);
    if (notification.link) {
      router.push(notification.link);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative p-2.5 rounded-xl text-[var(--gray-400)] hover:bg-[var(--gray-50)] hover:text-[var(--foreground)] transition-colors duration-200"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
          </span>
        )}
      </button>

      {open && (
        <div
          className="absolute right-0 mt-2 w-80 origin-top-right rounded-2xl bg-[var(--card-bg)] shadow-[var(--shadow-lg)] border border-[var(--gray-100)] py-2 animate-fade-in z-50"
          role="menu"
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--gray-100)]">
            <p className="text-sm font-bold text-[var(--foreground)]">Notifications</p>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={() => markAllRead.mutate()}
                className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-[var(--primary)] hover:opacity-75"
              >
                <CheckCheck className="h-3 w-3" />
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="px-4 py-8 text-center text-xs text-[var(--gray-400)] font-medium">No notifications yet</p>
            ) : (
              notifications.map((n) => (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => handleNotificationClick(n)}
                  className={`flex w-full flex-col items-start gap-0.5 px-4 py-3 text-left border-b border-[var(--gray-50)] last:border-0 hover:bg-[var(--gray-25)] transition-colors ${
                    !n.isRead ? 'bg-[var(--primary-light)]/30' : ''
                  }`}
                >
                  <div className="flex items-center gap-2 w-full">
                    {!n.isRead && <span className="h-1.5 w-1.5 rounded-full bg-[var(--primary)] shrink-0" />}
                    <p className="text-xs font-bold text-[var(--foreground)] truncate">{n.title}</p>
                  </div>
                  <p className="text-xs text-[var(--gray-500)] line-clamp-2">{n.message}</p>
                  <p className="text-[10px] text-[var(--gray-400)] mt-0.5">
                    {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                  </p>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
