'use client';

import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { Activity, Laptop } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import api from '@/lib/api';
import { useAgentActivityLogsQuery, useAgentActivitySummaryQuery } from '@/hooks/queries/use-agent-activity-query';
import { Badge, Card, Pagination } from '@/components/ui';
import type { BadgeVariant } from '@/components/ui';

const PAGE_SIZE = 25;
const todayIso = () => new Date().toISOString().slice(0, 10);

const EVENT_TYPES = [
  'heartbeat',
  'idle_start',
  'idle_end',
  'window_focus',
  'screenshot',
  'media_playback',
  'media_properties',
  'search_detected',
];

const EVENT_VARIANT: Record<string, BadgeVariant> = {
  heartbeat: 'gray',
  idle_start: 'warning',
  idle_end: 'success',
  window_focus: 'primary',
  screenshot: 'purple',
  media_playback: 'info',
  media_properties: 'info',
  search_detected: 'error',
};

const eventLabel = (type: string) =>
  type.replace(/_/g, ' ').replace(/^./, (c) => c.toUpperCase());

const inputClass =
  'mt-1 block rounded-lg border border-[var(--gray-200)] bg-[var(--card-bg)] p-2 text-sm text-[var(--foreground)]';

export default function AdminActivityLogsPage() {
  const { user, isSuperAdmin } = useAuth();

  const [from, setFrom] = useState(todayIso());
  const [to, setTo] = useState(todayIso());
  const [employeeId, setEmployeeId] = useState('');
  const [eventType, setEventType] = useState('');
  const [page, setPage] = useState(0);

  const [accessLoading, setAccessLoading] = useState(true);
  const [canView, setCanView] = useState(false);

  useEffect(() => {
    const resolveAccess = async () => {
      if (isSuperAdmin) {
        setCanView(true);
        setAccessLoading(false);
        return;
      }
      if (!user) {
        setCanView(false);
        setAccessLoading(false);
        return;
      }
      try {
        setAccessLoading(true);
        const res = await api.get('/permissions/me');
        const level = res.data?.permissionLevels?.attendance;
        setCanView(level === 'read' || level === 'write');
      } catch {
        setCanView(false);
      } finally {
        setAccessLoading(false);
      }
    };

    resolveAccess();
  }, [isSuperAdmin, user?.id]);

  const summaryQuery = useAgentActivitySummaryQuery({ from, to }, canView);
  const logsQuery = useAgentActivityLogsQuery(
    {
      from,
      to,
      employeeId: employeeId || undefined,
      eventType: eventType || undefined,
      limit: PAGE_SIZE,
      offset: page * PAGE_SIZE,
    },
    canView,
  );

  const summaries = summaryQuery.data ?? [];
  const logs = logsQuery.data?.logs ?? [];
  const total = logsQuery.data?.total ?? 0;

  if (accessLoading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="rounded-2xl bg-white border border-[var(--gray-200)] p-10 text-center text-[var(--gray-500)] shadow-[var(--shadow-sm)]">
          Checking permission access...
        </div>
      </div>
    );
  }

  if (!canView) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center max-w-sm">
          <Activity className="h-16 w-16 mx-auto mb-4 text-[var(--gray-300)]" />
          <h2 className="text-xl font-bold text-[var(--gray-700)]">Access Denied</h2>
          <p className="mt-2 text-[var(--gray-500)]">You do not have permission to view activity logs.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-[var(--foreground)]">Activity Logs</h1>
        <p className="text-[var(--gray-400)]">
          Activity reported by each employee's OXO Activity Monitor Agent while clocked in, matched to the employee by
          device ID. Updates every few seconds.
        </p>
      </div>

      <Card padding="md">
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="text-xs font-semibold text-[var(--gray-400)]">From</label>
            <input
              type="date"
              value={from}
              max={to}
              onChange={(e) => {
                setFrom(e.target.value);
                setPage(0);
              }}
              className={inputClass}
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-[var(--gray-400)]">To</label>
            <input
              type="date"
              value={to}
              min={from}
              max={todayIso()}
              onChange={(e) => {
                setTo(e.target.value);
                setPage(0);
              }}
              className={inputClass}
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-[var(--gray-400)]">Employee</label>
            <select
              value={employeeId}
              onChange={(e) => {
                setEmployeeId(e.target.value);
                setPage(0);
              }}
              className={inputClass}
            >
              <option value="">All employees</option>
              {summaries.map((s) => (
                <option key={s.employeeId} value={s.employeeId}>
                  {s.firstName} {s.lastName} ({s.employeeId})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-[var(--gray-400)]">Event</label>
            <select
              value={eventType}
              onChange={(e) => {
                setEventType(e.target.value);
                setPage(0);
              }}
              className={inputClass}
            >
              <option value="">All events</option>
              {EVENT_TYPES.map((type) => (
                <option key={type} value={type}>
                  {eventLabel(type)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      <div>
        <h2 className="text-lg font-bold text-[var(--foreground)]">Devices</h2>
        <p className="mb-3 text-xs text-[var(--gray-400)]">Employees who reported activity in this range.</p>
        {summaryQuery.isLoading ? (
          <p className="text-sm text-[var(--gray-400)]">Loading...</p>
        ) : summaries.length === 0 ? (
          <p className="text-sm text-[var(--gray-400)]">
            No activity reported. The employee needs a device ID on their profile, the agent running, and an HRIS tab
            open while clocked in.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {summaries.map((s) => {
              const selected = employeeId === s.employeeId;
              return (
                <button
                  key={s.employeeId}
                  type="button"
                  onClick={() => {
                    setEmployeeId(selected ? '' : s.employeeId);
                    setPage(0);
                  }}
                  className="text-left"
                >
                  <Card
                    padding="md"
                    className={`relative overflow-hidden transition-shadow hover:shadow-md ${
                      selected ? 'ring-2 ring-[var(--primary)]' : ''
                    }`}
                  >
                    <div className="absolute top-0 left-0 h-1.5 w-full" style={{ backgroundColor: 'var(--primary)' }} />
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 space-y-1">
                        <p className="truncate text-sm font-bold text-[var(--foreground)]">
                          {s.firstName} {s.lastName}
                        </p>
                        <p className="text-xs font-medium text-[var(--gray-400)]">{s.employeeId}</p>
                        <p className="truncate font-mono text-[11px] text-[var(--gray-400)]" title={s.deviceId}>
                          {s.deviceId}
                        </p>
                        <p className="pt-1 text-xs text-[var(--gray-500)]">
                          {s.eventCount} events · {s.windowCount} window switches · {s.idleCount} idle
                        </p>
                        <p className="text-xs text-[var(--gray-400)]">
                          Last seen {s.lastEventAt ? format(new Date(s.lastEventAt), 'MMM d, h:mm:ss a') : '—'}
                        </p>
                      </div>
                      <div
                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-white shadow-md"
                        style={{ backgroundColor: 'var(--primary)' }}
                      >
                        <Laptop className="h-5 w-5" />
                      </div>
                    </div>
                  </Card>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div>
        <h2 className="text-lg font-bold text-[var(--foreground)]">Event Log</h2>
        <p className="mb-3 text-xs text-[var(--gray-400)]">Newest first. Hover a window title to see it in full.</p>
        <Card padding="none" className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--gray-200)] text-left text-xs uppercase tracking-wider text-[var(--gray-400)]">
                <th className="px-4 py-3 font-bold">Time</th>
                <th className="px-4 py-3 font-bold">Employee</th>
                <th className="px-4 py-3 font-bold">Employee ID</th>
                <th className="px-4 py-3 font-bold">Device ID</th>
                <th className="px-4 py-3 font-bold">Event</th>
                <th className="px-4 py-3 font-bold">Application</th>
                <th className="px-4 py-3 font-bold">Window</th>
                <th className="px-4 py-3 font-bold text-right">Mouse</th>
                <th className="px-4 py-3 font-bold text-right">Keys</th>
              </tr>
            </thead>
            <tbody>
              {logsQuery.isLoading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-[var(--gray-400)]">
                    Loading...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-[var(--gray-400)]">
                    No events for these filters.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="border-b border-[var(--gray-100)] last:border-0">
                    <td className="whitespace-nowrap px-4 py-3 text-[var(--foreground)]">
                      {format(new Date(log.startTs), 'MMM d, h:mm:ss a')}
                    </td>
                    <td className="px-4 py-3 text-[var(--foreground)]">
                      {log.firstName} {log.lastName}
                    </td>
                    <td className="px-4 py-3 text-[var(--gray-500)]">{log.employeeId}</td>
                    <td className="px-4 py-3 font-mono text-xs text-[var(--gray-500)]">{log.deviceId}</td>
                    <td className="px-4 py-3">
                      <Badge variant={EVENT_VARIANT[log.eventType] ?? 'gray'}>{eventLabel(log.eventType)}</Badge>
                    </td>
                    <td className="px-4 py-3 text-[var(--gray-500)]">{log.appName ?? '—'}</td>
                    <td
                      className="max-w-xs truncate px-4 py-3 text-[var(--foreground)]"
                      title={log.windowTitle ?? undefined}
                    >
                      {log.windowTitle ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-[var(--gray-500)]">
                      {log.mouseEventCount}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-[var(--gray-500)]">{log.keyEventCount}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </Card>
        {total > PAGE_SIZE && (
          <Pagination
            pageIndex={page}
            pageCount={Math.ceil(total / PAGE_SIZE)}
            onPageChange={setPage}
            pageSize={PAGE_SIZE}
            totalItems={total}
          />
        )}
      </div>
    </div>
  );
}
