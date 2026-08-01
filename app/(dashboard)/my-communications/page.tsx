'use client';

import { useState } from 'react';
import { Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { useMyCommunicationsQuery } from '@/hooks/queries/use-communications-query';
import { useRespondCommunicationMutation } from '@/hooks/mutations/use-communication-mutations';
import { Button, Modal } from '@/components/ui';
import type { CommunicationRecipient } from '@/types/hrModules';

export default function MyCommunicationsPage() {
  const communicationsQuery = useMyCommunicationsQuery();
  const respondMutation = useRespondCommunicationMutation();
  const [active, setActive] = useState<CommunicationRecipient | null>(null);
  const [responseText, setResponseText] = useState('');

  const handleRespond = async () => {
    if (!active) return;
    await respondMutation.mutateAsync({ id: active.communicationId, responseText: responseText || undefined });
    setActive(null);
    setResponseText('');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-[var(--foreground)]">My Communications</h1>
        <p className="text-[var(--gray-400)]">Messages and announcements from HR</p>
      </div>

      <div className="space-y-4">
        {communicationsQuery.isLoading && <p className="text-sm text-[var(--gray-400)]">Loading communications...</p>}
        {communicationsQuery.data?.length === 0 && <p className="text-sm text-[var(--gray-400)]">No communications yet.</p>}
        {communicationsQuery.data?.map((item) => {
          const isAcknowledged = !!item.respondedAt;
          const deadlinePassed = item.deadlineAt && new Date() > new Date(item.deadlineAt);
          const isLate = isAcknowledged && item.deadlineAt && new Date(item.respondedAt!) > new Date(item.deadlineAt);

          let statusBadge = null;
          if (item.requiresAcknowledgement) {
            if (isAcknowledged) {
              if (isLate) {
                statusBadge = (
                  <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                    <Clock className="h-3 w-3" /> Acknowledged (Late)
                  </span>
                );
              } else {
                statusBadge = (
                  <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                    <CheckCircle2 className="h-3 w-3" /> Acknowledged (On-Time)
                  </span>
                );
              }
            } else if (deadlinePassed) {
              statusBadge = (
                <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300">
                  <AlertCircle className="h-3 w-3" /> Overdue
                </span>
              );
            } else {
              statusBadge = (
                <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300">
                  <Clock className="h-3 w-3" /> Action Required
                </span>
              );
            }
          }

          return (
            <div
              key={item.id}
              className={`rounded-2xl border bg-[var(--card-bg)] p-5 space-y-3 transition-all ${
                !isAcknowledged && item.requiresAcknowledgement
                  ? deadlinePassed
                    ? 'border-rose-300 dark:border-rose-800/60 shadow-sm'
                    : 'border-blue-300 dark:border-blue-800/60 shadow-sm'
                  : 'border-[var(--gray-200)]'
              }`}
            >
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <h3 className="text-base font-bold text-[var(--foreground)]">{item.title}</h3>
                  <div className="flex items-center gap-3 text-xs text-[var(--gray-400)] mt-1">
                    <span>Received: {new Date(item.createdAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</span>
                    {item.deadlineAt && (
                      <span className={`font-medium flex items-center gap-1 ${deadlinePassed && !isAcknowledged ? 'text-rose-600 dark:text-rose-400' : 'text-amber-600 dark:text-amber-400'}`}>
                        <Clock className="h-3.5 w-3.5" />
                        Deadline: {new Date(item.deadlineAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                      </span>
                    )}
                  </div>
                </div>
                {statusBadge}
              </div>

              <p className="text-sm text-[var(--foreground)] whitespace-pre-wrap leading-relaxed bg-gray-50/50 dark:bg-gray-900/40 p-3.5 rounded-xl border border-gray-100 dark:border-gray-800">
                {item.body}
              </p>

              {isAcknowledged ? (
                <div className="text-xs text-[var(--gray-400)] pt-1 flex items-center justify-between">
                  <span>Acknowledged at: {new Date(item.respondedAt!).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</span>
                  {item.responseText && <span className="italic">Your Note: "{item.responseText}"</span>}
                </div>
              ) : item.requiresAcknowledgement ? (
                <div className="flex items-center justify-between pt-2 border-t border-[var(--gray-100)]">
                  <p className="text-xs text-amber-700 dark:text-amber-400 font-medium flex items-center gap-1.5">
                    <AlertCircle className="h-3.5 w-3.5" />
                    {deadlinePassed ? 'Deadline has passed. Please acknowledge as soon as possible.' : 'Please review and acknowledge this communication before the deadline.'}
                  </p>
                  <Button
                    size="sm"
                    className={deadlinePassed ? 'bg-rose-600 hover:bg-rose-700 text-white' : ''}
                    onClick={() => setActive(item)}
                  >
                    Acknowledge Communication
                  </Button>
                </div>
              ) : (
                <div className="flex justify-end pt-1">
                  <Button size="sm" variant="outline" onClick={() => setActive(item)}>
                    Acknowledge / Reply
                  </Button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Acknowledge Modal */}
      <Modal isOpen={!!active} onClose={() => setActive(null)} title="Acknowledge Communication">
        {active && (
          <div className="space-y-4">
            <div className="rounded-xl bg-blue-50 dark:bg-blue-950/30 p-3.5 border border-blue-200 dark:border-blue-800 text-xs text-blue-900 dark:text-blue-200 space-y-1">
              <p className="font-semibold flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                Confirming Acknowledgement for: "{active.title}"
              </p>
              {active.deadlineAt && (
                <p className="text-blue-700 dark:text-blue-300">
                  Deadline: {new Date(active.deadlineAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                  {new Date() > new Date(active.deadlineAt) && ' (Passed)'}
                </p>
              )}
            </div>

            <div>
              <label className="text-xs font-semibold text-[var(--foreground)] mb-1 block">Optional Note or Remarks</label>
              <textarea
                value={responseText}
                onChange={(e) => setResponseText(e.target.value)}
                rows={3}
                placeholder="Add optional notes or comments for HR..."
                className="w-full rounded-xl border border-[var(--gray-200)] bg-[var(--card-bg)] p-3 text-sm text-[var(--foreground)]"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" onClick={() => setActive(null)}>
                Cancel
              </Button>
              <Button onClick={handleRespond} isLoading={respondMutation.isPending}>
                Confirm Acknowledgement
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
