'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/contexts/ToastContext';
import { useFormQuery, useFormSettingsQuery, useFormThemeQuery } from '@/hooks/queries/use-forms-query';
import { useUpdateFormSettingsMutation, useUpdateFormThemeMutation } from '@/hooks/mutations/use-form-mutations';
import { FileUpload } from '@/components/ui';
import type { FormSettings, FormTheme } from '@/types/hrModules';

function ToggleRow({ label, hint, checked, onChange, disabled }: { label: string; hint?: string; checked: boolean; onChange: () => void; disabled?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5">
      <div>
        <p className="text-sm font-semibold text-[var(--foreground)]">{label}</p>
        {hint && <p className="text-xs text-[var(--gray-400)]">{hint}</p>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={onChange}
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${checked ? 'bg-[var(--primary)]' : 'bg-[var(--gray-200)]'} disabled:opacity-50`}
      >
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-5' : 'translate-x-0.5'}`} />
      </button>
    </div>
  );
}

const toDatetimeLocal = (iso?: string | null) => {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export default function FormSettingsClient() {
  const params = useParams<{ id: string }>();
  const formId = Number(params.id);
  const { isHR, isSuperAdmin } = useAuth();
  const toast = useToast();

  const formQuery = useFormQuery(formId);
  const settingsQuery = useFormSettingsQuery(formId);
  const themeQuery = useFormThemeQuery(formId);
  const updateSettings = useUpdateFormSettingsMutation(formId);
  const updateTheme = useUpdateFormThemeMutation(formId);

  const [settings, setSettings] = useState<FormSettings | null>(null);
  const [theme, setTheme] = useState<FormTheme | null>(null);

  // Seed local (optimistically-editable) state from the query the first time it resolves — done
  // during render (React's documented "adjusting state" pattern), not in an effect, so this never
  // clobbers in-flight local edits on a background refetch.
  if (settingsQuery.data && settings === null) setSettings(settingsQuery.data);
  if (themeQuery.data && theme === null) setTheme(themeQuery.data);

  if (!isHR && !isSuperAdmin) {
    return <p className="text-sm text-[var(--gray-400)]">You do not have access to this page.</p>;
  }

  if (formQuery.isLoading || settingsQuery.isLoading || themeQuery.isLoading || !settings || !theme) {
    return (
      <div className="flex items-center justify-center py-24 text-[var(--gray-400)]">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  }

  // Each field is an individual immediate PUT with optimistic local state (infrequent toggles,
  // no debounce needed — unlike the builder's per-keystroke field saves).
  const patchSettings = async (patch: Partial<FormSettings>) => {
    const prev = settings;
    setSettings((s) => (s ? { ...s, ...patch } : s));
    try {
      const updated = await updateSettings.mutateAsync(patch);
      setSettings(updated);
    } catch {
      setSettings(prev);
      toast.error('Could not save setting');
    }
  };

  const patchTheme = async (patch: Partial<FormTheme>, file?: File | null) => {
    const prev = theme;
    setTheme((t) => (t ? { ...t, ...patch } : t));
    try {
      const updated = await updateTheme.mutateAsync({ patch, headerImage: file });
      setTheme(updated);
    } catch {
      setTheme(prev);
      toast.error('Could not save theme');
    }
  };

  return (
    <div className="max-w-2xl space-y-6 animate-fade-in">
      <div>
        <Link href={`/admin/forms/${formId}/edit`} className="flex items-center gap-1.5 text-sm font-semibold text-[var(--gray-400)] hover:text-[var(--foreground)]">
          <ArrowLeft className="h-4 w-4" /> Back to builder
        </Link>
        <h1 className="mt-2 text-3xl font-bold text-[var(--foreground)]">Settings</h1>
        <p className="text-[var(--gray-400)]">{formQuery.data?.form.title}</p>
      </div>

      <div className="rounded-2xl border border-[var(--gray-100)] bg-[var(--card-bg)] p-5">
        <h3 className="text-sm font-bold text-[var(--foreground)] mb-1">Responses</h3>
        <div className="divide-y divide-[var(--gray-50)]">
          <ToggleRow
            label="Accept responses"
            hint="Turn off to stop new submissions without unpublishing the form"
            checked={settings.acceptResponses}
            onChange={() => patchSettings({ acceptResponses: !settings.acceptResponses })}
          />
          <ToggleRow
            label="Allow editing after submit"
            hint="Employees can revisit and update their response"
            checked={settings.allowEditAfterSubmit}
            onChange={() => patchSettings({ allowEditAfterSubmit: !settings.allowEditAfterSubmit })}
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3">
          <div>
            <label className="text-xs font-semibold text-[var(--gray-400)] flex items-center gap-1">
              Submission Deadline / Close Date (optional)
            </label>
            <input
              type="datetime-local"
              value={toDatetimeLocal(settings.closeAt)}
              onChange={(e) => patchSettings({ closeAt: e.target.value ? new Date(e.target.value).toISOString() : null })}
              className="mt-1 w-full rounded-lg border border-[var(--gray-200)] bg-[var(--card-bg)] p-2 text-sm text-[var(--foreground)]"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-[var(--gray-400)]">Response limit (optional)</label>
            <input
              type="number"
              min={0}
              value={settings.responseLimit ?? ''}
              onChange={(e) => patchSettings({ responseLimit: e.target.value ? Number(e.target.value) : null })}
              placeholder="Unlimited"
              className="mt-1 w-full rounded-lg border border-[var(--gray-200)] bg-[var(--card-bg)] p-2 text-sm text-[var(--foreground)]"
            />
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-[var(--gray-100)] bg-[var(--card-bg)] p-5">
        <h3 className="text-sm font-bold text-[var(--foreground)] mb-1">Notifications</h3>
        <div className="divide-y divide-[var(--gray-50)]">
          <ToggleRow
            label="Notify me on every response"
            checked={settings.notifyOwnerOnResponse}
            onChange={() => patchSettings({ notifyOwnerOnResponse: !settings.notifyOwnerOnResponse })}
          />
          <ToggleRow
            label="Notify respondent"
            hint="Send the employee a confirmation after they submit"
            checked={settings.notifyRespondent}
            onChange={() => patchSettings({ notifyRespondent: !settings.notifyRespondent })}
          />
        </div>
        <div className="pt-3">
          <label className="text-xs font-semibold text-[var(--gray-400)]">Thank-you message</label>
          <textarea
            defaultValue={settings.thankYouMessage ?? ''}
            onBlur={(e) => patchSettings({ thankYouMessage: e.target.value || null })}
            rows={2}
            placeholder="Thanks for your response!"
            className="mt-1 w-full rounded-lg border border-[var(--gray-200)] bg-[var(--card-bg)] p-2 text-sm text-[var(--foreground)]"
          />
        </div>
      </div>

      <div className="rounded-2xl border border-[var(--gray-100)] bg-[var(--card-bg)] p-5 space-y-4">
        <h3 className="text-sm font-bold text-[var(--foreground)]">Theme</h3>
        <div>
          <label className="text-xs font-semibold text-[var(--gray-400)]">Primary color</label>
          <div className="mt-1 flex items-center gap-2">
            <input
              type="color"
              value={theme.primaryColor ?? '#2563EB'}
              onChange={(e) => setTheme((t) => (t ? { ...t, primaryColor: e.target.value } : t))}
              onBlur={(e) => patchTheme({ primaryColor: e.target.value })}
              className="h-9 w-9 cursor-pointer rounded border border-[var(--gray-200)] bg-transparent p-0.5"
            />
            <span className="text-sm text-[var(--gray-400)]">{theme.primaryColor ?? '#2563EB'}</span>
          </div>
        </div>
        <div>
          <label className="text-xs font-semibold text-[var(--gray-400)]">Header image</label>
          <div className="mt-1">
            <FileUpload
              accept="image/*"
              existingFiles={theme.headerImageUrl ? [{ name: 'Header image', url: theme.headerImageUrl }] : []}
              onRemoveExisting={() => patchTheme({ headerImageUrl: null })}
              onFilesSelected={(files) => {
                const file = files[0] ?? null;
                if (file) void patchTheme({}, file);
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
