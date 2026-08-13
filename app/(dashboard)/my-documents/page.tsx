'use client';

import { Download, FileText } from 'lucide-react';
import { useMyDocumentsQuery } from '@/hooks/queries/use-documents-query';

const API_BASE = process.env.NEXT_PUBLIC_API_URL?.replace(/\/api(\/v\d+)?\/?$/, '') || 'http://localhost:5000';
const resolveFileUrl = (url: string) => `${API_BASE}${url}`;

export default function MyDocumentsPage() {
  const documentsQuery = useMyDocumentsQuery();
  // This page shows company-wide documents only - documents targeted at you
  // individually live on your Profile's Document Vault tab instead.
  const companyDocuments = (documentsQuery.data ?? []).filter((doc) => doc.targetType === 'all');

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-[var(--foreground)]">Documents</h1>
        <p className="text-[var(--gray-400)]">Company-wide documents shared with every employee</p>
      </div>

      <div className="space-y-4">
        {documentsQuery.isLoading && <p className="text-sm text-[var(--gray-400)]">Loading documents...</p>}
        {!documentsQuery.isLoading && companyDocuments.length === 0 && (
          <p className="text-sm text-[var(--gray-400)]">No company-wide documents have been shared yet.</p>
        )}
        {companyDocuments.map((doc) => (
          <div key={doc.id} className="rounded-2xl border border-[var(--gray-200)] bg-[var(--card-bg)] p-5 space-y-3">
            <div>
              <h3 className="text-base font-bold text-[var(--foreground)]">{doc.title}</h3>
              <p className="text-xs text-[var(--gray-400)] mt-1">
                Shared: {new Date(doc.createdAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
              </p>
            </div>

            {doc.description && (
              <p className="text-sm text-[var(--foreground)] whitespace-pre-wrap leading-relaxed bg-gray-50/50 dark:bg-gray-900/40 p-3.5 rounded-xl border border-gray-100 dark:border-gray-800">
                {doc.description}
              </p>
            )}

            {(doc.attachments?.length ?? 0) > 0 && (
              <div className="space-y-2 pt-1 border-t border-[var(--gray-100)]">
                {doc.attachments!.map((attachment) => (
                  <a
                    key={attachment.id}
                    href={resolveFileUrl(attachment.fileUrl)}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-[var(--gray-25)] border border-[var(--gray-100)] hover:border-[var(--primary-ring)] transition-colors"
                  >
                    <span className="flex items-center gap-2 text-xs font-semibold text-[var(--foreground)] truncate min-w-0">
                      <FileText className="h-3.5 w-3.5 shrink-0 text-[var(--primary)]" />
                      <span className="truncate">{attachment.fileName}</span>
                    </span>
                    <Download className="h-3.5 w-3.5 shrink-0 text-[var(--gray-400)]" />
                  </a>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
