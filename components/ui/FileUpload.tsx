'use client';

import { useRef, useState, type DragEvent, type ChangeEvent } from 'react';
import { UploadCloud, X, Paperclip } from 'lucide-react';

interface ExistingFile {
  name: string;
  url: string;
}

interface FileUploadProps {
  accept?: string;
  multiple?: boolean;
  maxSizeMB?: number;
  /** Total number of files allowed (selected + existing). Omitted means no cap. */
  maxFiles?: number;
  onFilesSelected: (files: File[]) => void;
  existingFiles?: ExistingFile[];
  onRemoveExisting?: (url: string) => void;
  /** Overrides the default "unsupported file type" message when `accept` rejects a file. */
  typeErrorMessage?: string;
}

/**
 * The native `accept` attribute on <input type="file"> is only a picker
 * *filter hint* - browsers don't enforce it on drag-and-drop or on an
 * explicit "All Files" selection, so without this check any file type could
 * be silently accepted regardless of `accept` (OCD-516/OCD-495/OCD-570).
 */
const isFileTypeAllowed = (file: File, accept?: string): boolean => {
  if (!accept) return true;
  const rules = accept
    .split(',')
    .map((rule) => rule.trim().toLowerCase())
    .filter(Boolean);
  if (rules.length === 0) return true;
  const fileName = file.name.toLowerCase();
  const mimeType = (file.type || '').toLowerCase();
  return rules.some((rule) => {
    if (rule.startsWith('.')) return fileName.endsWith(rule);
    if (rule.endsWith('/*')) return mimeType.startsWith(rule.slice(0, -1));
    return mimeType === rule;
  });
};

export function FileUpload({
  accept,
  multiple = false,
  maxSizeMB = 10,
  maxFiles,
  onFilesSelected,
  existingFiles = [],
  onRemoveExisting,
  typeErrorMessage,
}: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [selected, setSelected] = useState<File[]>([]);
  const [error, setError] = useState('');

  const handleFiles = (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    const files = Array.from(fileList);
    const invalidType = files.find((f) => !isFileTypeAllowed(f, accept));
    if (invalidType) {
      setError(typeErrorMessage ?? `"${invalidType.name}" is not a supported file type.`);
      return;
    }
    const tooLarge = files.find((f) => f.size > maxSizeMB * 1024 * 1024);
    if (tooLarge) {
      setError(`"${tooLarge.name}" exceeds the ${maxSizeMB}MB limit`);
      return;
    }
    const next = multiple ? [...selected, ...files] : files.slice(0, 1);
    // In single-file mode a new selection always replaces the existing/previously-selected file
    // rather than adding to it, so only multi-file mode needs to count existingFiles toward the cap.
    const projectedTotal = multiple ? existingFiles.length + next.length : next.length;
    if (maxFiles && projectedTotal > maxFiles) {
      setError(`You can upload at most ${maxFiles} file${maxFiles === 1 ? '' : 's'}`);
      return;
    }
    setError('');
    setSelected(next);
    onFilesSelected(next);
  };

  const removeSelected = (index: number) => {
    const next = selected.filter((_, i) => i !== index);
    setSelected(next);
    onFilesSelected(next);
  };

  return (
    <div className="space-y-3">
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e: DragEvent) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e: DragEvent) => {
          e.preventDefault();
          setDragOver(false);
          handleFiles(e.dataTransfer.files);
        }}
        className={`flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed p-6 text-center cursor-pointer transition-colors ${
          dragOver
            ? 'border-[var(--primary)] bg-[var(--primary-light)]'
            : 'border-[var(--gray-200)] bg-[var(--gray-25)] hover:border-[var(--primary)]'
        }`}
      >
        <UploadCloud className="h-6 w-6 text-[var(--gray-400)]" />
        <p className="text-xs font-semibold text-[var(--foreground)]">Click to upload or drag and drop</p>
        <p className="text-[10px] text-[var(--gray-400)]">
          {multiple && maxFiles ? `Up to ${maxFiles} files · ` : ''}Max {maxSizeMB}MB per file
        </p>
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          className="hidden"
          onChange={(e: ChangeEvent<HTMLInputElement>) => handleFiles(e.target.files)}
        />
      </div>

      {error && <p className="text-xs text-red-500 font-medium">{error}</p>}

      {(selected.length > 0 || existingFiles.length > 0) && (
        <ul className="space-y-2">
          {existingFiles.map((f) => (
            <li
              key={f.url}
              className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-[var(--gray-25)] border border-[var(--gray-100)]"
            >
              <a
                href={f.url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 text-xs font-semibold text-[var(--primary)] truncate min-w-0"
              >
                <Paperclip className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{f.name}</span>
              </a>
              {onRemoveExisting && (
                <button
                  type="button"
                  onClick={() => onRemoveExisting(f.url)}
                  className="text-[var(--gray-400)] hover:text-red-500 shrink-0"
                  aria-label={`Remove ${f.name}`}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </li>
          ))}
          {selected.map((f, i) => (
            <li
              key={`${f.name}-${i}`}
              className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-[var(--gray-25)] border border-[var(--gray-100)]"
            >
              <span className="flex items-center gap-2 text-xs font-semibold text-[var(--foreground)] truncate min-w-0">
                <Paperclip className="h-3.5 w-3.5 shrink-0 text-[var(--gray-400)]" />
                <span className="truncate">{f.name}</span>
              </span>
              <button
                type="button"
                onClick={() => removeSelected(i)}
                className="text-[var(--gray-400)] hover:text-red-500 shrink-0"
                aria-label={`Remove ${f.name}`}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
