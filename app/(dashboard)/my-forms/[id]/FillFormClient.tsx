'use client';

import { useRouter, useParams } from 'next/navigation';
import { useState } from 'react';
import { useFormQuery } from '@/hooks/queries/use-forms-query';
import { useSubmitFormResponseMutation } from '@/hooks/mutations/use-form-mutations';
import { Button, FileUpload } from '@/components/ui';

export default function FillFormClient() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const formId = Number(params.id);

  const formQuery = useFormQuery(formId);
  const submitMutation = useSubmitFormResponseMutation(formId);

  const [values, setValues] = useState<Record<number, string>>({});
  const [files, setFiles] = useState<Record<number, File>>({});

  if (formQuery.isLoading) return <p className="text-sm text-[var(--gray-400)]">Loading...</p>;
  if (!formQuery.data) return <p className="text-sm text-red-500">Form not found</p>;

  const { form, fields } = formQuery.data;

  const handleSubmit = async () => {
    const answers = fields
      .filter((f) => f.fieldType !== 'file')
      .map((f) => ({ fieldId: f.id, value: values[f.id] }));
    await submitMutation.mutateAsync({ answers, files });
    router.push('/my-forms');
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl">
      <div>
        <h1 className="text-3xl font-bold text-[var(--foreground)]">{form.title}</h1>
        {form.description && <p className="text-[var(--gray-400)]">{form.description}</p>}
      </div>

      <div className="space-y-5">
        {fields
          .sort((a, b) => a.orderIndex - b.orderIndex)
          .map((field) => (
            <div key={field.id}>
              <label className="text-sm font-semibold text-[var(--foreground)]">
                {field.label}
                {field.required && <span className="text-red-500"> *</span>}
              </label>

              {field.fieldType === 'text' && (
                <input
                  value={values[field.id] ?? ''}
                  onChange={(e) => setValues((prev) => ({ ...prev, [field.id]: e.target.value }))}
                  className="mt-1 w-full rounded-xl border border-[var(--gray-200)] bg-[var(--card-bg)] p-2.5 text-sm text-[var(--foreground)]"
                />
              )}

              {field.fieldType === 'radio' && (
                <div className="mt-2 space-y-1.5">
                  {(field.options ?? []).map((option) => (
                    <label key={option} className="flex items-center gap-2 text-sm text-[var(--foreground)]">
                      <input
                        type="radio"
                        name={`field-${field.id}`}
                        checked={values[field.id] === option}
                        onChange={() => setValues((prev) => ({ ...prev, [field.id]: option }))}
                      />
                      {option}
                    </label>
                  ))}
                </div>
              )}

              {field.fieldType === 'select' && (
                <select
                  value={values[field.id] ?? ''}
                  onChange={(e) => setValues((prev) => ({ ...prev, [field.id]: e.target.value }))}
                  className="mt-1 w-full rounded-xl border border-[var(--gray-200)] bg-[var(--card-bg)] p-2.5 text-sm text-[var(--foreground)]"
                >
                  <option value="">Select...</option>
                  {(field.options ?? []).map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              )}

              {field.fieldType === 'file' && (
                <div className="mt-1">
                  <FileUpload
                    onFilesSelected={(selected) => {
                      if (selected[0]) setFiles((prev) => ({ ...prev, [field.id]: selected[0] }));
                    }}
                  />
                </div>
              )}
            </div>
          ))}
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSubmit} isLoading={submitMutation.isPending}>
          Submit
        </Button>
      </div>
    </div>
  );
}
