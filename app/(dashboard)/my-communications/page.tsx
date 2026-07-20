'use client';

import { useState } from 'react';
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
        <p className="text-[var(--gray-400)]">Messages from HR</p>
      </div>

      <div className="space-y-3">
        {communicationsQuery.isLoading && <p className="text-sm text-[var(--gray-400)]">Loading...</p>}
        {communicationsQuery.data?.length === 0 && <p className="text-sm text-[var(--gray-400)]">No communications yet.</p>}
        {communicationsQuery.data?.map((item) => (
          <div key={item.id} className="rounded-2xl border border-[var(--gray-100)] p-4 space-y-2">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-sm font-bold text-[var(--foreground)]">{item.title}</h3>
                <p className="text-xs text-[var(--gray-400)]">{new Date(item.createdAt).toLocaleString()}</p>
              </div>
              {item.respondedAt ? (
                <span className="text-xs font-semibold text-emerald-600">Responded</span>
              ) : (
                <span className="text-xs font-semibold text-amber-600">Awaiting response</span>
              )}
            </div>
            <p className="text-sm text-[var(--foreground)] whitespace-pre-wrap">{item.body}</p>
            {item.respondedAt ? (
              item.responseText && <p className="text-xs text-[var(--gray-400)] italic">Your response: {item.responseText}</p>
            ) : (
              <Button size="sm" onClick={() => setActive(item)}>
                Acknowledge / Respond
              </Button>
            )}
          </div>
        ))}
      </div>

      <Modal isOpen={!!active} onClose={() => setActive(null)} title="Respond to Communication">
        <div className="space-y-4">
          <textarea
            value={responseText}
            onChange={(e) => setResponseText(e.target.value)}
            rows={4}
            placeholder="Optional reply..."
            className="w-full rounded-xl border border-[var(--gray-200)] bg-[var(--card-bg)] p-3 text-sm text-[var(--foreground)]"
          />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setActive(null)}>
              Cancel
            </Button>
            <Button onClick={handleRespond} isLoading={respondMutation.isPending}>
              Submit
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
