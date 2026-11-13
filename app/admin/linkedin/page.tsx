'use client';

import { useMemo, useState } from 'react';
import { format } from 'date-fns';
import {
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  Link2,
  Link2Off,
  RefreshCw,
  Search,
  ShieldAlert,
  Unlink,
  XCircle,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/contexts/ToastContext';
import { Badge, Button, Card, EmptyState, Skeleton } from '@/components/ui';
import { useLinkedinOverviewQuery } from '@/hooks/queries/use-linkedin-overview-query';
import { useLinkedinMutation, useLinkedinSyncAllMutation } from '@/hooks/mutations/use-linkedin-mutations';
import { formatMonths } from '@/lib/utils';
import type { LinkedinOverviewRow } from '@/types/profile';

type RowState = 'green' | 'red' | 'pending' | 'no_url';
type Filter = RowState | 'all';

const rowState = (r: LinkedinOverviewRow): RowState => (!r.profileUrl?.trim() ? 'no_url' : r.flag);

// Problems first: red, then still-pending, then missing URLs, then the good ones.
const SORT_ORDER: Record<RowState, number> = { red: 0, pending: 1, no_url: 2, green: 3 };

// 'YYYY-MM-DD' -> 'MMM yyyy' without a timezone-shifting Date parse.
function monthYear(ymd: string | null): string {
  if (!ymd) return '—';
  const [y, m] = ymd.split('-').map(Number);
  return format(new Date(y, m - 1, 1), 'MMM yyyy');
}

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('') || '?';

function CoverageBar({ value, state }: { value: number | null; state: RowState }) {
  if (value === null || state === 'pending' || state === 'no_url') {
    return <span className="text-xs text-[var(--gray-400)] font-medium">—</span>;
  }
  const tone = value >= 80 ? 'bg-emerald-500' : value >= 40 ? 'bg-amber-500' : 'bg-red-500';
  return (
    <div
      className="flex items-center gap-2.5 min-w-[130px]"
      title={`LinkedIn reflects ${value}% of this employee's time at OXO Tech`}
    >
      <div
        className="h-2 flex-1 rounded-full bg-[var(--gray-100)] overflow-hidden"
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="OXO Tech tenure shown on LinkedIn"
      >
        <div className={`h-full rounded-full transition-all duration-500 ${tone}`} style={{ width: `${value}%` }} />
      </div>
      <span className="text-xs font-bold tabular-nums text-[var(--foreground)] w-9 text-right">{value}%</span>
    </div>
  );
}

function FlagBadge({ state, syncing }: { state: RowState; syncing: boolean }) {
  if (state === 'green')
    return (
      <Badge variant="success" icon={<CheckCircle2 className="h-3 w-3" />}>
        OXO Tech updated
      </Badge>
    );
  if (state === 'red')
    return (
      <Badge variant="error" icon={<XCircle className="h-3 w-3" />}>
        Not updated
      </Badge>
    );
  if (state === 'no_url')
    return (
      <Badge variant="gray" icon={<Link2Off className="h-3 w-3" />}>
        No LinkedIn URL
      </Badge>
    );
  return (
    <Badge variant="warning" icon={<RefreshCw className={`h-3 w-3 ${syncing ? 'animate-spin' : ''}`} />}>
      {syncing ? 'Syncing…' : 'Not synced yet'}
    </Badge>
  );
}

function StatCard({
  label,
  value,
  hint,
  tone,
  active,
  onClick,
}: {
  label: string;
  value: string | number;
  hint: string;
  tone: 'neutral' | 'green' | 'red' | 'amber';
  active?: boolean;
  onClick?: () => void;
}) {
  const accent = {
    neutral: 'text-[var(--foreground)]',
    green: 'text-emerald-600',
    red: 'text-red-600',
    amber: 'text-amber-600',
  }[tone];
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      aria-pressed={onClick ? active : undefined}
      className={`text-left rounded-[1.375rem] bg-[var(--card-bg)] shadow-[var(--shadow)] p-5 transition-all border-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] disabled:cursor-default ${
        active ? 'border-[var(--primary)]' : onClick ? 'border-transparent hover:border-[var(--gray-200)]' : 'border-transparent'
      }`}
    >
      <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--gray-400)]">{label}</p>
      <p className={`text-3xl font-extrabold tabular-nums mt-1.5 ${accent}`}>{value}</p>
      <p className="text-xs text-[var(--gray-400)] font-medium mt-1">{hint}</p>
    </button>
  );
}

export default function LinkedinSyncPage() {
  const { isSuperAdmin } = useAuth();
  const toast = useToast();
  const { data, isLoading, isError, refetch, isFetching } = useLinkedinOverviewQuery(isSuperAdmin);
  const connect = useLinkedinMutation('connect');
  const refresh = useLinkedinMutation('refresh');
  const disconnect = useLinkedinMutation('disconnect');
  const syncAll = useLinkedinSyncAllMutation();

  const [filter, setFilter] = useState<Filter>('all');
  const [query, setQuery] = useState('');
  const [busyId, setBusyId] = useState<number | null>(null);

  const rows = useMemo(() => data ?? [], [data]);

  const counts = useMemo(() => {
    const c = { green: 0, red: 0, pending: 0, no_url: 0 };
    let sum = 0;
    let n = 0;
    for (const r of rows) {
      c[rowState(r)] += 1;
      if (r.coveragePercent !== null && (r.flag === 'green' || r.flag === 'red')) {
        sum += r.coveragePercent;
        n += 1;
      }
    }
    return { ...c, avg: n ? Math.round(sum / n) : null };
  }, [rows]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows
      .filter((r) => filter === 'all' || rowState(r) === filter)
      .filter(
        (r) =>
          !q ||
          r.name.toLowerCase().includes(q) ||
          (r.employeeId ?? '').toLowerCase().includes(q) ||
          (r.department ?? '').toLowerCase().includes(q) ||
          (r.latestCompany ?? '').toLowerCase().includes(q),
      )
      .sort((a, b) => SORT_ORDER[rowState(a)] - SORT_ORDER[rowState(b)] || a.name.localeCompare(b.name));
  }, [rows, filter, query]);

  if (!isSuperAdmin) {
    return (
      <Card padding="lg" className="max-w-xl mx-auto text-center">
        <ShieldAlert className="h-8 w-8 mx-auto text-[var(--gray-400)]" />
        <h1 className="text-lg font-bold mt-3 text-[var(--foreground)]">Administrators only</h1>
        <p className="text-sm text-[var(--gray-400)] mt-1">Only administrators can view employee LinkedIn connections.</p>
      </Card>
    );
  }

  const errorMessage = (e: unknown) => (e instanceof Error ? e.message : 'Something went wrong');

  const act = (m: typeof connect, r: LinkedinOverviewRow, ok: string) => {
    setBusyId(r.id);
    m.mutate(r.id, {
      onSuccess: () => toast.success(ok, r.name),
      onError: (e) => toast.error('LinkedIn', errorMessage(e)),
      onSettled: () => setBusyId(null),
    });
  };

  const runSyncAll = () =>
    syncAll.mutate(undefined, {
      onSuccess: ({ queued }) =>
        toast.success('Sync queued', `${queued} employee${queued === 1 ? '' : 's'} will be read on the importer's next run`),
      onError: (e) => toast.error('LinkedIn', errorMessage(e)),
    });

  const FILTERS: { key: Filter; label: string; count: number }[] = [
    { key: 'all', label: 'All', count: rows.length },
    { key: 'red', label: 'Not updated', count: counts.red },
    { key: 'green', label: 'OXO Tech updated', count: counts.green },
    { key: 'pending', label: 'Not synced', count: counts.pending },
    { key: 'no_url', label: 'No URL', count: counts.no_url },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[var(--foreground)]">LinkedIn Sync</h1>
          <p className="text-sm text-[var(--gray-400)] font-medium mt-1 max-w-2xl">
            Checks that each employee&apos;s latest LinkedIn role is <strong>OXO Tech</strong>, and how much of their time at OXO
            Tech their profile shows, measured from the join date.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            leftIcon={<RefreshCw className={`h-3.5 w-3.5 ${isFetching ? 'animate-spin' : ''}`} />}
            onClick={() => refetch()}
            disabled={isFetching}
          >
            Reload
          </Button>
          <Button
            size="sm"
            leftIcon={<Link2 className="h-3.5 w-3.5" />}
            onClick={runSyncAll}
            isLoading={syncAll.isPending}
            disabled={syncAll.isPending || isLoading}
          >
            Sync all employees
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-28 rounded-[1.375rem]" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="OXO Tech updated"
            value={counts.green}
            hint="Latest role is OXO Tech"
            tone="green"
            active={filter === 'green'}
            onClick={() => setFilter(filter === 'green' ? 'all' : 'green')}
          />
          <StatCard
            label="Not updated"
            value={counts.red}
            hint="Latest role is elsewhere"
            tone="red"
            active={filter === 'red'}
            onClick={() => setFilter(filter === 'red' ? 'all' : 'red')}
          />
          <StatCard
            label="Waiting for sync"
            value={counts.pending + counts.no_url}
            hint={`${counts.no_url} without a LinkedIn URL`}
            tone="amber"
            active={filter === 'pending'}
            onClick={() => setFilter(filter === 'pending' ? 'all' : 'pending')}
          />
          <StatCard
            label="Average tenure shown"
            value={counts.avg === null ? '—' : `${counts.avg}%`}
            hint="Of OXO time shown on LinkedIn"
            tone="neutral"
          />
        </div>
      )}

      <Card padding="none" className="overflow-hidden">
        <div className="p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3 border-b border-[var(--gray-100)]">
          <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter employees">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                type="button"
                onClick={() => setFilter(f.key)}
                aria-pressed={filter === f.key}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] ${
                  filter === f.key
                    ? 'bg-[var(--primary)] text-white'
                    : 'bg-[var(--gray-50)] text-[var(--gray-600)] hover:bg-[var(--gray-100)]'
                }`}
              >
                {f.label} <span className="opacity-70 tabular-nums">{f.count}</span>
              </button>
            ))}
          </div>
          <label className="relative w-full sm:w-72">
            <span className="sr-only">Search employees</span>
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--gray-400)]" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search name, ID, department, company"
              className="w-full pl-9 pr-3 py-2 rounded-full text-sm bg-[var(--gray-50)] border border-transparent focus:border-[var(--primary)] focus:outline-none"
            />
          </label>
        </div>

        {isError ? (
          <div className="p-10 text-center">
            <AlertTriangle className="h-7 w-7 mx-auto text-red-500" />
            <p className="text-sm font-bold mt-2 text-[var(--foreground)]">Could not load LinkedIn data</p>
            <Button variant="outline" size="sm" className="mt-3" onClick={() => refetch()}>
              Try again
            </Button>
          </div>
        ) : isLoading ? (
          <div className="p-5 space-y-3">
            {[0, 1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        ) : visible.length === 0 ? (
          <div className="p-6">
            <EmptyState title="No employees match" description="Try a different filter or search term." />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-left">
              <thead>
                <tr className="text-[10px] font-bold uppercase tracking-wider text-[var(--gray-400)] border-b border-[var(--gray-100)]">
                  <th className="px-5 py-3">Employee</th>
                  <th className="px-3 py-3">LinkedIn</th>
                  <th className="px-3 py-3">Joined OXO</th>
                  <th className="px-3 py-3">LinkedIn start</th>
                  <th className="px-3 py-3">Updated after</th>
                  <th className="px-3 py-3">Tenure shown</th>
                  <th className="px-3 py-3">Last sync</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--gray-100)]">
                {visible.map((r) => {
                  const state = rowState(r);
                  const synced = state === 'green' || state === 'red';
                  const syncing = r.connected && r.syncPending;
                  const busy = busyId === r.id;
                  return (
                    <tr key={r.id} className="hover:bg-[var(--gray-50)] align-middle">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 shrink-0 rounded-full bg-[var(--primary-light)] text-[var(--primary)] text-xs font-bold grid place-items-center">
                            {initials(r.name)}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-[var(--foreground)] truncate">{r.name || r.email}</p>
                            <p className="text-xs text-[var(--gray-400)] font-medium truncate">
                              {[r.employeeId, r.department].filter(Boolean).join(' · ') || '—'}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3.5">
                        <div className="flex flex-col items-start gap-1">
                          <FlagBadge state={state} syncing={syncing} />
                          {synced && (
                            <p className="text-xs text-[var(--gray-500)] font-medium max-w-[220px] truncate">
                              {r.latestCompany ?? 'No role found on LinkedIn'}
                              {r.latestTitle ? ` · ${r.latestTitle}` : ''}
                            </p>
                          )}
                          {r.syncError && (
                            <p className="text-xs text-red-600 font-medium max-w-[220px] truncate" title={r.syncError}>
                              {r.syncError}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-3.5 text-sm font-semibold text-[var(--foreground)]">{monthYear(r.hireDate)}</td>
                      <td className="px-3 py-3.5 text-sm font-semibold text-[var(--foreground)]">
                        {synced ? monthYear(r.linkedinUpdateDate) : '—'}
                      </td>
                      <td className="px-3 py-3.5 text-sm font-semibold text-[var(--foreground)]">
                        {synced
                          ? r.monthsAfterJoining !== null
                            ? formatMonths(r.monthsAfterJoining)
                            : r.linkedinUpdateDate
                              ? 'On join date'
                              : '—'
                          : '—'}
                      </td>
                      <td className="px-3 py-3.5">
                        <CoverageBar value={r.coveragePercent} state={state} />
                      </td>
                      <td className="px-3 py-3.5 text-xs text-[var(--gray-400)] font-medium whitespace-nowrap">
                        {r.lastSyncedAt ? format(new Date(r.lastSyncedAt), 'dd MMM yyyy, HH:mm') : '—'}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-end gap-1.5">
                          {r.profileUrl && (
                            <a
                              href={r.profileUrl.startsWith('http') ? r.profileUrl : `https://${r.profileUrl}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 rounded-full text-[var(--gray-400)] hover:text-[var(--primary)] hover:bg-[var(--gray-50)]"
                              aria-label={`Open ${r.name}'s LinkedIn profile`}
                              title="Open LinkedIn profile"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          )}
                          {state !== 'no_url' && (
                            <Button
                              variant="outline"
                              size="sm"
                              leftIcon={<RefreshCw className="h-3.5 w-3.5" />}
                              disabled={busy || syncing}
                              isLoading={busy && (connect.isPending || refresh.isPending)}
                              onClick={() =>
                                r.connected ? act(refresh, r, 'Refresh requested') : act(connect, r, 'Sync requested')
                              }
                            >
                              {syncing ? 'Pending' : r.connected ? 'Refresh' : 'Sync'}
                            </Button>
                          )}
                          {r.connected && (
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() => act(disconnect, r, 'LinkedIn data removed')}
                              className="p-2 rounded-full text-[var(--gray-400)] hover:text-red-600 hover:bg-red-50 disabled:opacity-50"
                              aria-label={`Disconnect ${r.name}`}
                              title="Disconnect and remove synced data"
                            >
                              <Unlink className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <p className="text-xs text-[var(--gray-400)] font-medium">
        Tenure shown is the share of the time since the join date that the OXO Tech role on LinkedIn covers (100% means it is
        listed from the join date). Employees whose newest LinkedIn role is not OXO Tech show 0%. Data is refreshed by the
        LinkedIn importer.
      </p>
    </div>
  );
}
