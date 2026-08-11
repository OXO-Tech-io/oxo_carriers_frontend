'use client';

import { Monitor } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { useAttendanceTracking } from '@/contexts/AttendanceTrackingContext';

const formatWhen = (value: string | null): string =>
  value ? new Date(value).toLocaleString() : '—';

/**
 * Shown when POST attendance/session/start returns 409 because the employee
 * already has an open session elsewhere.
 *
 * Two outcomes, not three: "Continue Here" force-terminates the other session
 * and opens one in this tab, and "Cancel" leaves the other session running and
 * simply does not track this tab. There is no useful "terminate the other one
 * and then also not work here" case, so it is not offered.
 */
export function SessionConflictModal() {
  const { conflict, resolveConflict, isResolvingConflict } = useAttendanceTracking();

  if (!conflict) return null;

  const device = [conflict.browser, conflict.os, conflict.deviceType]
    .filter(Boolean)
    .join(' · ');

  return (
    <Modal
      isOpen
      onClose={() => resolveConflict('cancel')}
      title="Active work session found"
      size="md"
      footer={
        <>
          <Button
            variant="outline"
            onClick={() => resolveConflict('cancel')}
            disabled={isResolvingConflict}
          >
            Cancel
          </Button>
          <Button onClick={() => resolveConflict('continue')} isLoading={isResolvingConflict}>
            Continue Here
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <p className="text-sm text-[var(--gray-500)]">
          You already have an active work session. Continue here or terminate the previous session.
        </p>

        <div className="rounded-xl border border-[var(--gray-100)] bg-[var(--gray-25)] p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--primary-light)] text-[var(--primary)]">
              <Monitor className="h-4 w-4" />
            </div>
            <dl className="min-w-0 flex-1 space-y-1.5 text-xs">
              <div className="flex justify-between gap-3">
                <dt className="font-semibold text-[var(--gray-400)]">Device</dt>
                <dd className="truncate text-right font-semibold text-[var(--foreground)]">
                  {device || 'Unknown device'}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="font-semibold text-[var(--gray-400)]">Signed in</dt>
                <dd className="text-right font-semibold text-[var(--foreground)]">
                  {formatWhen(conflict.loginAt)}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="font-semibold text-[var(--gray-400)]">Last activity</dt>
                <dd className="text-right font-semibold text-[var(--foreground)]">
                  {formatWhen(conflict.lastHeartbeatAt)}
                </dd>
              </div>
              {conflict.ipAddress && (
                <div className="flex justify-between gap-3">
                  <dt className="font-semibold text-[var(--gray-400)]">IP address</dt>
                  <dd className="text-right font-semibold text-[var(--foreground)]">
                    {conflict.ipAddress}
                  </dd>
                </div>
              )}
            </dl>
          </div>
        </div>

        <p className="text-xs text-[var(--gray-400)]">
          Continuing here closes the previous session and starts a new one on this device.
        </p>
      </div>
    </Modal>
  );
}
