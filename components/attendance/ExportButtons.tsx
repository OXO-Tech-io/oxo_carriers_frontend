'use client';

import { useState } from 'react';
import { FileSpreadsheet, FileText, Table2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/contexts/ToastContext';
import { downloadBlob } from '@/lib/utils';
import type { AttendanceDownload } from '@/lib/services/attendance.service';
import type { AttendanceExportFormat } from '@/types/attendance';

interface ExportButtonsProps {
  /** Resolves to the blob plus the filename the server chose. */
  onExport: (format: AttendanceExportFormat) => Promise<AttendanceDownload>;
  disabled?: boolean;
  className?: string;
}

const FORMATS: Array<{
  format: AttendanceExportFormat;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { format: 'excel', label: 'Excel', icon: FileSpreadsheet },
  { format: 'csv', label: 'CSV', icon: Table2 },
  { format: 'pdf', label: 'PDF', icon: FileText },
];

/** Excel / CSV / PDF group. Only the clicked button shows a spinner. */
export function ExportButtons({ onExport, disabled = false, className = '' }: ExportButtonsProps) {
  const toast = useToast();
  const [pending, setPending] = useState<AttendanceExportFormat | null>(null);

  const handleExport = async (format: AttendanceExportFormat) => {
    setPending(format);
    try {
      const { blob, filename } = await onExport(format);
      downloadBlob(blob, filename);
    } catch (error) {
      console.error(`[Attendance] ${format} export failed:`, error);
      toast.error('Export failed', 'The report could not be generated. Please try again.');
    } finally {
      setPending(null);
    }
  };

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      {FORMATS.map(({ format, label, icon: Icon }) => (
        <Button
          key={format}
          variant="outline"
          size="sm"
          disabled={disabled || (pending !== null && pending !== format)}
          isLoading={pending === format}
          leftIcon={<Icon className="h-3.5 w-3.5" />}
          onClick={() => void handleExport(format)}
        >
          {label}
        </Button>
      ))}
    </div>
  );
}
