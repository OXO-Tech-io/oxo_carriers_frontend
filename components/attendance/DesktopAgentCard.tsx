'use client';

import { useEffect, useState } from 'react';
import { Check, Copy, Monitor, Plus, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader } from '@/components/ui/Card';
import { ConfirmationDialog } from '@/components/ui/ConfirmationDialog';
import { Skeleton } from '@/components/ui/Skeleton';
import { useToast } from '@/contexts/ToastContext';
import { useAgentDevicesQuery } from '@/hooks/queries/use-attendance-query';
import {
  useGeneratePairingCodeMutation,
  useRevokeAgentDeviceMutation,
} from '@/hooks/mutations/use-attendance-mutations';
import { formatRelativeTime } from '@/lib/attendance/format';
import type { AgentPairingCode, AgentPlatform, PairedAgentDevice } from '@/types/attendance';

const PLATFORM_LABEL: Record<AgentPlatform, string> = {
  windows: 'Windows',
  macos: 'macOS',
};

/** `ABCD2345` -> `ABCD 2345`, so it can be read aloud/typed without losing place. */
const spaceCode = (code: string) =>
  code.length === 8 ? `${code.slice(0, 4)} ${code.slice(4)}` : code;

/** `582` -> `9m 42s`. */
const formatCountdown = (totalSeconds: number) => {
  const safe = Math.max(0, totalSeconds);
  return `${Math.floor(safe / 60)}m ${safe % 60}s`;
};

/**
 * Pairs the OXO Attendance desktop agent with this employee's account.
 *
 * The agent reports OS-level activity as its own session, so work done outside
 * the browser stops reading as idle. Pairing is one-way from here: this card
 * only mints the single-use code and manages already-paired devices - the code
 * is redeemed by the desktop app itself, and no agent token ever reaches the
 * browser.
 */
export function DesktopAgentCard() {
  const toast = useToast();
  const devicesQuery = useAgentDevicesQuery();
  const generateMutation = useGeneratePairingCodeMutation();
  const revokeMutation = useRevokeAgentDeviceMutation();

  const [pairing, setPairing] = useState<AgentPairingCode | null>(null);
  const [remainingSec, setRemainingSec] = useState(0);
  const [isExpired, setIsExpired] = useState(false);
  const [copied, setCopied] = useState(false);
  const [revokeTarget, setRevokeTarget] = useState<PairedAgentDevice | null>(null);

  // Countdown to `expiresAt`. Ticking off the wall clock rather than
  // decrementing means a backgrounded tab still shows the true remaining time
  // when the user comes back to it.
  useEffect(() => {
    if (!pairing) return;

    const tick = () => {
      const expiresMs = new Date(pairing.expiresAt).getTime();
      const left = Number.isFinite(expiresMs)
        ? Math.max(0, Math.round((expiresMs - Date.now()) / 1000))
        : 0;
      setRemainingSec(left);
      if (left <= 0) {
        setPairing(null);
        setIsExpired(true);
      }
    };

    tick();
    const intervalId = window.setInterval(tick, 1000);
    return () => window.clearInterval(intervalId);
  }, [pairing]);

  // Revert the copy button's confirmation tick on its own.
  useEffect(() => {
    if (!copied) return;
    const timeoutId = window.setTimeout(() => setCopied(false), 2000);
    return () => window.clearTimeout(timeoutId);
  }, [copied]);

  const handleGenerate = async () => {
    try {
      const result = await generateMutation.mutateAsync();
      setIsExpired(false);
      setCopied(false);
      setPairing(result);
    } catch (error) {
      console.error('[Attendance] Pairing code generation failed:', error);
      toast.error('Could not generate a code', 'Please try again in a moment.');
    }
  };

  const handleCopy = async () => {
    if (!pairing) return;
    try {
      await navigator.clipboard.writeText(pairing.code);
      setCopied(true);
    } catch {
      toast.error('Could not copy the code', 'Copy it manually from the box above.');
    }
  };

  const handleRevoke = async () => {
    if (!revokeTarget) return;
    const name = revokeTarget.deviceName ?? 'Unknown device';
    try {
      await revokeMutation.mutateAsync(revokeTarget.id);
      setRevokeTarget(null);
      toast.success('Device revoked', `${name} can no longer track time for you.`);
    } catch (error) {
      console.error('[Attendance] Device revoke failed:', error);
      toast.error('Could not revoke device', 'Please refresh the page and try again.');
    }
  };

  const devices = devicesQuery.data ?? [];

  return (
    <Card padding="md">
      <CardHeader
        title="Desktop Agent"
        subtitle="Track your work automatically on this PC, even when this page isn't open."
        action={
          <Button
            variant={pairing ? 'outline' : 'primary'}
            size="sm"
            isLoading={generateMutation.isPending}
            leftIcon={
              pairing ? <RefreshCw className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />
            }
            onClick={() => void handleGenerate()}
          >
            {pairing ? 'New Code' : 'Generate Pairing Code'}
          </Button>
        }
      />

      {pairing && (
        <div className="rounded-xl border border-[var(--gray-100)] bg-[var(--gray-50)] p-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-[var(--gray-400)]">
                Pairing code
              </p>
              <p className="mt-1 font-mono text-3xl font-extrabold tracking-[0.2em] text-[var(--foreground)]">
                {spaceCode(pairing.code)}
              </p>
              <p className="mt-1 text-xs font-semibold text-[var(--gray-400)]">
                Expires in {formatCountdown(remainingSec)}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              leftIcon={
                copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />
              }
              onClick={() => void handleCopy()}
            >
              {copied ? 'Copied' : 'Copy'}
            </Button>
          </div>
          <p className="mt-3 border-t border-[var(--gray-100)] pt-3 text-xs font-semibold text-[var(--gray-500)]">
            Open the OXO Attendance desktop app, choose Pair Device, and enter this code within 10
            minutes.
          </p>
        </div>
      )}

      {isExpired && !pairing && (
        <div className="rounded-xl border border-[var(--warning)] bg-[var(--warning-light)] p-3">
          <p className="text-xs font-bold text-[var(--warning-text)]">
            Expired — generate a new code.
          </p>
        </div>
      )}

      {/* Paired devices */}
      <div className="mt-6 border-t border-[var(--gray-50)] pt-4">
        <p className="text-xs font-bold uppercase tracking-wider text-[var(--gray-400)]">
          Paired Devices
        </p>

        {devicesQuery.isLoading ? (
          <div className="mt-3 space-y-2">
            {Array.from({ length: 2 }).map((_, index) => (
              <Skeleton key={index} className="h-14 w-full rounded-xl" />
            ))}
          </div>
        ) : devicesQuery.isError ? (
          <p className="py-6 text-center text-xs font-semibold text-[var(--error-text)]">
            Your paired devices could not be loaded. Please refresh the page.
          </p>
        ) : devices.length === 0 ? (
          <p className="py-6 text-center text-xs font-semibold text-[var(--gray-400)]">
            No devices paired yet. Generate a code to connect your PC.
          </p>
        ) : (
          <ul className="mt-3 space-y-2">
            {devices.map((device) => (
              <DeviceRow
                key={device.id}
                device={device}
                onRevoke={() => setRevokeTarget(device)}
              />
            ))}
          </ul>
        )}
      </div>

      <ConfirmationDialog
        isOpen={!!revokeTarget}
        onClose={() => setRevokeTarget(null)}
        onConfirm={() => void handleRevoke()}
        title="Revoke Device"
        message={`Revoke "${revokeTarget?.deviceName ?? 'Unknown device'}"? The desktop agent on that PC will stop tracking your time until you pair it again.`}
        confirmLabel="Revoke"
        variant="danger"
        isLoading={revokeMutation.isPending}
      />
    </Card>
  );
}

function DeviceRow({
  device,
  onRevoke,
}: {
  device: PairedAgentDevice;
  onRevoke: () => void;
}) {
  const isRevoked = !!device.revokedAt;

  return (
    <li
      className={`flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--gray-100)] p-3 ${
        isRevoked ? 'opacity-60' : ''
      }`}
    >
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--gray-50)]">
          <Monitor className="h-4 w-4 text-[var(--gray-400)]" aria-hidden />
        </span>
        <div>
          <p className="text-sm font-bold text-[var(--foreground)]">
            {device.deviceName ?? 'Unknown device'}
          </p>
          <p className="text-xs font-semibold text-[var(--gray-400)]">
            {device.platform ? PLATFORM_LABEL[device.platform] : 'Unknown OS'}
            {' · Last seen '}
            {device.lastUsedAt ? formatRelativeTime(device.lastUsedAt) : 'Never'}
          </p>
        </div>
      </div>

      {isRevoked ? (
        <span
          className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold"
          style={{ backgroundColor: 'var(--gray-50)', color: 'var(--gray-500)' }}
        >
          Revoked
        </span>
      ) : (
        <Button variant="outline" size="sm" onClick={onRevoke}>
          Revoke
        </Button>
      )}
    </li>
  );
}
