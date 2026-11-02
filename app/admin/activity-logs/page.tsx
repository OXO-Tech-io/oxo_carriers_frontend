"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import {
  Activity,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Eye,
  Laptop,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import api from "@/lib/api";
import {
  useAgentActivityLogsQuery,
  useAgentActivitySummaryQuery,
} from "@/hooks/queries/use-agent-activity-query";
import { agentActivityService } from "@/lib/services/agent-activity.service";
import { Badge, Card, Modal, Pagination } from "@/components/ui";
import type { BadgeVariant } from "@/components/ui";

const PAGE_SIZE = 25;
const GALLERY_PAGE_SIZE = 12;

type Tab = "logs" | "screenshots";
const todayIso = () => new Date().toISOString().slice(0, 10);

const EVENT_TYPES = [
  "heartbeat",
  "idle_start",
  "idle_end",
  "window_focus",
  "screenshot",
  "media_playback",
  "media_properties",
  "search_detected",
];

const EVENT_VARIANT: Record<string, BadgeVariant> = {
  heartbeat: "gray",
  idle_start: "warning",
  idle_end: "success",
  window_focus: "primary",
  screenshot: "purple",
  media_playback: "info",
  media_properties: "info",
  search_detected: "error",
};

const eventLabel = (type: string) =>
  type.replace(/_/g, " ").replace(/^./, (c) => c.toUpperCase());

const inputClass =
  "mt-1 block rounded-lg border border-[var(--gray-200)] bg-[var(--card-bg)] p-2 text-sm text-[var(--foreground)]";

// Screenshots stored in GCS come with a short-lived signed URL that <img> loads directly.
// Legacy rows (or an expired/failed URL) fall back to fetching the bytes with the bearer
// token into an object URL.
function useScreenshotUrl(screenshotId: number, signedUrl?: string | null) {
  const [src, setSrc] = useState<string | null>(signedUrl ?? null);
  const [failed, setFailed] = useState(false);
  const [useFallback, setUseFallback] = useState(!signedUrl);

  useEffect(() => {
    setSrc(signedUrl ?? null);
    setFailed(false);
    setUseFallback(!signedUrl);
  }, [screenshotId, signedUrl]);

  useEffect(() => {
    if (!useFallback) return;
    let objectUrl: string | null = null;
    let cancelled = false;
    agentActivityService
      .getScreenshot(screenshotId)
      .then((blob) => {
        if (cancelled) return;
        objectUrl = URL.createObjectURL(blob);
        setSrc(objectUrl);
      })
      .catch(() => !cancelled && setFailed(true));
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [screenshotId, useFallback]);

  return { src, failed, onError: () => setUseFallback(true) };
}

function ScreenshotThumb({
  screenshotId,
  signedUrl,
  alt,
}: {
  screenshotId: number;
  signedUrl?: string | null;
  alt: string;
}) {
  const { src, failed, onError } = useScreenshotUrl(screenshotId, signedUrl);
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={alt}
        onError={onError}
        className="h-full w-full object-cover"
      />
    );
  }
  return (
    <div className="flex h-full w-full items-center justify-center text-xs text-[var(--gray-400)]">
      {failed ? "Unavailable" : "Loading..."}
    </div>
  );
}

function ScreenshotViewer({
  screenshotId,
  signedUrl,
  title,
  position,
  onPrev,
  onNext,
  onClose,
}: {
  screenshotId: number;
  signedUrl?: string | null;
  title: string;
  /** "3 of 12" within the current page; null when opened from the table. */
  position: { index: number; count: number } | null;
  onPrev?: () => void;
  onNext?: () => void;
  onClose: () => void;
}) {
  const { src, failed, onError } = useScreenshotUrl(screenshotId, signedUrl);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") onPrev?.();
      if (e.key === "ArrowRight") onNext?.();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onPrev, onNext]);

  const navButton =
    "inline-flex items-center gap-1 rounded-lg border border-[var(--gray-200)] px-3 py-1.5 text-sm font-semibold text-[var(--foreground)] transition-colors hover:bg-[var(--gray-50)] disabled:cursor-not-allowed disabled:opacity-40";

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={title}
      size="xl"
      footer={
        <div className="flex w-full items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button type="button" className={navButton} onClick={onPrev} disabled={!onPrev}>
              <ChevronLeft className="h-4 w-4" />
              Previous
            </button>
            <button type="button" className={navButton} onClick={onNext} disabled={!onNext}>
              Next
              <ChevronRight className="h-4 w-4" />
            </button>
            {position && (
              <span className="ml-1 text-xs text-[var(--gray-400)]">
                {position.index + 1} of {position.count}
              </span>
            )}
          </div>
          {src && (
            <a
              href={src}
              target="_blank"
              rel="noopener noreferrer"
              className={navButton}
            >
              <ExternalLink className="h-4 w-4" />
              Open full size
            </a>
          )}
        </div>
      }
    >
      <div className="bg-[var(--gray-100)] p-4">
        {failed ? (
          <p className="py-16 text-center text-sm text-[var(--gray-400)]">
            Could not load this screenshot.
          </p>
        ) : !src ? (
          <div className="flex aspect-video w-full animate-pulse items-center justify-center rounded-lg bg-[var(--gray-200)] text-sm text-[var(--gray-400)]">
            Loading...
          </div>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={src}
            alt={title}
            onError={onError}
            className="mx-auto max-h-[70vh] w-auto max-w-full rounded-lg border border-[var(--gray-200)] bg-white shadow-md"
          />
        )}
      </div>
    </Modal>
  );
}

export default function AdminActivityLogsPage() {
  const { user, isSuperAdmin } = useAuth();

  const [from, setFrom] = useState(todayIso());
  const [to, setTo] = useState(todayIso());
  const [employeeId, setEmployeeId] = useState("");
  const [deviceId, setDeviceId] = useState("");
  const [eventType, setEventType] = useState("");
  const [page, setPage] = useState(0);
  const [tab, setTab] = useState<Tab>("logs");
  const [viewing, setViewing] = useState<{
    id: number;
    url: string | null;
    title: string;
  } | null>(null);

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
        const res = await api.get("/permissions/me");
        const level = res.data?.permissionLevels?.attendance;
        setCanView(level === "read" || level === "write");
      } catch {
        setCanView(false);
      } finally {
        setAccessLoading(false);
      }
    };

    resolveAccess();
  }, [isSuperAdmin, user?.id]);

  const pageSize = tab === "screenshots" ? GALLERY_PAGE_SIZE : PAGE_SIZE;

  const summaryQuery = useAgentActivitySummaryQuery({ from, to }, canView);
  const logsQuery = useAgentActivityLogsQuery(
    {
      from,
      to,
      employeeId: employeeId || undefined,
      deviceId: deviceId || undefined,
      eventType: tab === "screenshots" ? "screenshot" : eventType || undefined,
      limit: pageSize,
      offset: page * pageSize,
    },
    canView,
  );

  const summaries = summaryQuery.data ?? [];
  // Distinct devices (narrowed to the chosen employee) for the Device filter.
  const deviceOptions = Array.from(
    new Set(
      summaries
        .filter((s) => !employeeId || s.employeeId === employeeId)
        .map((s) => s.deviceId),
    ),
  );
  const logs = logsQuery.data?.logs ?? [];
  const total = logsQuery.data?.total ?? 0;

  type LogRow = (typeof logs)[number];
  const screenshotLogs = logs.filter((l) => l.screenshotId);
  const viewerTitle = (log: LogRow) =>
    `${log.firstName} ${log.lastName} · ${format(new Date(log.startTs), "MMM d, h:mm:ss a")}`;
  const openViewer = (log: LogRow) =>
    setViewing({
      id: log.screenshotId!,
      url: log.screenshotUrl,
      title: viewerTitle(log),
    });
  const viewingIndex = viewing
    ? screenshotLogs.findIndex((l) => l.screenshotId === viewing.id)
    : -1;
  const stepViewer = (delta: number) => {
    const target = screenshotLogs[viewingIndex + delta];
    if (target) openViewer(target);
  };

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
          <h2 className="text-xl font-bold text-[var(--gray-700)]">
            Access Denied
          </h2>
          <p className="mt-2 text-[var(--gray-500)]">
            You do not have permission to view activity logs.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-[var(--foreground)]">
          Activity Logs
        </h1>
        <p className="text-[var(--gray-400)]">
          Activity reported by each employee's OXO Activity Monitor Agent while
          clocked in, matched to the employee by device ID. Updates every few
          seconds.
        </p>
      </div>

      <div className="flex gap-1 border-b border-[var(--gray-200)]">
        {(
          [
            ["logs", "Activity Logs"],
            ["screenshots", "Screenshots"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => {
              setTab(key);
              setPage(0);
            }}
            className={`-mb-px border-b-2 px-4 py-2 text-sm font-semibold transition-colors ${
              tab === key
                ? "border-[var(--primary)] text-[var(--primary)]"
                : "border-transparent text-[var(--gray-400)] hover:text-[var(--foreground)]"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <Card padding="md">
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="text-xs font-semibold text-[var(--gray-400)]">
              From
            </label>
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
            <label className="text-xs font-semibold text-[var(--gray-400)]">
              To
            </label>
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
            <label className="text-xs font-semibold text-[var(--gray-400)]">
              Employee
            </label>
            <select
              value={employeeId}
              onChange={(e) => {
                setEmployeeId(e.target.value);
                setDeviceId("");
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
            <label className="text-xs font-semibold text-[var(--gray-400)]">
              Device
            </label>
            <select
              value={deviceId}
              onChange={(e) => {
                setDeviceId(e.target.value);
                setPage(0);
              }}
              className={inputClass}
            >
              <option value="">All devices</option>
              {deviceOptions.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
          {tab === "logs" && (
            <div>
              <label className="text-xs font-semibold text-[var(--gray-400)]">
                Event
              </label>
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
          )}
        </div>
      </Card>

      <div>
        <h2 className="text-lg font-bold text-[var(--foreground)]">Devices</h2>
        <p className="mb-3 text-xs text-[var(--gray-400)]">
          Employees who reported activity in this range.
        </p>
        {summaryQuery.isLoading ? (
          <p className="text-sm text-[var(--gray-400)]">Loading...</p>
        ) : summaries.length === 0 ? (
          <p className="text-sm text-[var(--gray-400)]">
            No activity reported. The employee needs a device ID on their
            profile, the agent running, and an HRIS tab open while clocked in.
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
                    setEmployeeId(selected ? "" : s.employeeId);
                    setPage(0);
                  }}
                  className="text-left"
                >
                  <Card
                    padding="md"
                    className={`relative overflow-hidden transition-shadow hover:shadow-md ${
                      selected ? "ring-2 ring-[var(--primary)]" : ""
                    }`}
                  >
                    <div
                      className="absolute top-0 left-0 h-1.5 w-full"
                      style={{ backgroundColor: "var(--primary)" }}
                    />
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 space-y-1">
                        <p className="truncate text-sm font-bold text-[var(--foreground)]">
                          {s.firstName} {s.lastName}
                        </p>
                        <p className="text-xs font-medium text-[var(--gray-400)]">
                          {s.employeeId}
                        </p>
                        <p
                          className="truncate font-mono text-[11px] text-[var(--gray-400)]"
                          title={s.deviceId}
                        >
                          {s.deviceId}
                        </p>
                        <p className="pt-1 text-xs text-[var(--gray-500)]">
                          {s.eventCount} events · {s.windowCount} window
                          switches · {s.idleCount} idle
                        </p>
                        <p className="text-xs text-[var(--gray-400)]">
                          Last seen{" "}
                          {s.lastEventAt
                            ? format(
                                new Date(s.lastEventAt),
                                "MMM d, h:mm:ss a",
                              )
                            : "—"}
                        </p>
                      </div>
                      <div
                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-white shadow-md"
                        style={{ backgroundColor: "var(--primary)" }}
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
        <h2 className="text-lg font-bold text-[var(--foreground)]">
          {tab === "logs" ? "Event Log" : "Screenshots"}
        </h2>
        <p className="mb-3 text-xs text-[var(--gray-400)]">
          {tab === "logs"
            ? "Newest first. Hover a window title to see it in full."
            : "Newest first. Click a screenshot to view it full size."}
        </p>
        {tab === "logs" ? (
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
                    <td
                      colSpan={8}
                      className="px-4 py-8 text-center text-[var(--gray-400)]"
                    >
                      Loading...
                    </td>
                  </tr>
                ) : logs.length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-4 py-8 text-center text-[var(--gray-400)]"
                    >
                      No events for these filters.
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr
                      key={log.id}
                      className="border-b border-[var(--gray-100)] last:border-0"
                    >
                      <td className="whitespace-nowrap px-4 py-3 text-[var(--foreground)]">
                        {format(new Date(log.startTs), "MMM d, h:mm:ss a")}
                      </td>
                      <td className="px-4 py-3 text-[var(--foreground)]">
                        {log.firstName} {log.lastName}
                      </td>
                      <td className="px-4 py-3 text-[var(--gray-500)]">
                        {log.employeeId}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-[var(--gray-500)]">
                        {log.deviceId}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={EVENT_VARIANT[log.eventType] ?? "gray"}>
                          {eventLabel(log.eventType)}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-[var(--gray-500)]">
                        {log.appName ?? "—"}
                      </td>
                      <td
                        className="max-w-xs truncate px-4 py-3 text-[var(--foreground)]"
                        title={log.windowTitle ?? undefined}
                      >
                        {log.screenshotId ? (
                          <button
                            type="button"
                            onClick={() => openViewer(log)}
                            className="inline-flex items-center gap-1.5 rounded-full bg-[var(--primary)]/10 px-3 py-1 text-xs font-semibold text-[var(--primary)] transition-colors hover:bg-[var(--primary)] hover:text-white"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            View
                          </button>
                        ) : (
                          (log.windowTitle ?? "—")
                        )}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-[var(--gray-500)]">
                        {log.mouseEventCount}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-[var(--gray-500)]">
                        {log.keyEventCount}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </Card>
        ) : logsQuery.isLoading ? (
          <p className="text-sm text-[var(--gray-400)]">Loading...</p>
        ) : logs.length === 0 ? (
          <p className="text-sm text-[var(--gray-400)]">
            No screenshots for these filters.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {logs.map((log) =>
              log.screenshotId ? (
                <Card
                  key={log.id}
                  padding="none"
                  className="group overflow-hidden transition-all hover:-translate-y-0.5 hover:shadow-lg"
                >
                  <button
                    type="button"
                    onClick={() => openViewer(log)}
                    aria-label={`View screenshot of ${log.firstName} ${log.lastName}`}
                    className="relative block aspect-video w-full overflow-hidden bg-[var(--gray-100)]"
                  >
                    <ScreenshotThumb
                      screenshotId={log.screenshotId}
                      signedUrl={log.screenshotUrl}
                      alt={`Screenshot of ${log.firstName} ${log.lastName}`}
                    />
                    <span className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/40">
                      <span className="inline-flex translate-y-1 items-center gap-1.5 rounded-full bg-white px-4 py-1.5 text-sm font-semibold text-[var(--foreground)] opacity-0 shadow-md transition-all group-hover:translate-y-0 group-hover:opacity-100">
                        <Eye className="h-4 w-4" />
                        View
                      </span>
                    </span>
                    <span className="absolute bottom-2 right-2 rounded-md bg-black/60 px-2 py-0.5 text-[11px] font-medium text-white">
                      {format(new Date(log.startTs), "h:mm a")}
                    </span>
                  </button>
                  <div className="flex items-center justify-between gap-2 p-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-[var(--foreground)]">
                        {log.firstName} {log.lastName}
                      </p>
                      <p className="truncate text-xs text-[var(--gray-400)]">
                        {format(new Date(log.startTs), "MMM d, yyyy")} ·{" "}
                        <span className="font-mono">{log.deviceId}</span>
                      </p>
                    </div>
                  </div>
                </Card>
              ) : null,
            )}
          </div>
        )}
        {total > pageSize && (
          <Pagination
            pageIndex={page}
            pageCount={Math.ceil(total / pageSize)}
            onPageChange={setPage}
            pageSize={pageSize}
            totalItems={total}
          />
        )}
      </div>

      {viewing && (
        <ScreenshotViewer
          screenshotId={viewing.id}
          signedUrl={viewing.url}
          title={viewing.title}
          position={
            viewingIndex >= 0
              ? { index: viewingIndex, count: screenshotLogs.length }
              : null
          }
          onPrev={viewingIndex > 0 ? () => stepViewer(-1) : undefined}
          onNext={
            viewingIndex >= 0 && viewingIndex < screenshotLogs.length - 1
              ? () => stepViewer(1)
              : undefined
          }
          onClose={() => setViewing(null)}
        />
      )}
    </div>
  );
}
