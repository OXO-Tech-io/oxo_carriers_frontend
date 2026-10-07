'use client';

import { Modal } from '@/components/ui';

interface DocumentViewerProps {
  isOpen: boolean;
  onClose: () => void;
  fileUrl: string;
  fileName: string;
  mimeType?: string | null;
}

const isImageFile = (fileName: string, mimeType?: string | null): boolean => {
  if (mimeType?.startsWith('image/')) return true;
  return /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(fileName);
};

const isPdfFile = (fileName: string, mimeType?: string | null): boolean => {
  if (mimeType === 'application/pdf') return true;
  return /\.pdf$/i.test(fileName);
};

// Open-parameter fragment understood by the browser's built-in PDF viewer
// (Chrome / Edge): hides its top toolbar (download, print, zoom, etc.) and the
// side thumbnail panel. Fragments are never sent to the server, so this is
// safe to append to signed or authenticated URLs.
const PDF_VIEWER_PARAMS = 'toolbar=0&navpanes=0';

const withPdfViewerParams = (url: string): string => `${url.split('#')[0]}#${PDF_VIEWER_PARAMS}`;

/**
 * OCD-499: in-app viewer used on the employee-facing "My Documents" page so
 * employees can VIEW a shared document without a visible download/save
 * affordance (admins keep full download access on app/admin/documents).
 *
 * `onContextMenu` blocking the right-click menu, and the missing download
 * link/button, are best-effort UX only, not real DRM/security - a browser
 * can't fully prevent someone who can already view a file from saving it
 * (e.g. via devtools, screenshots, or print-to-PDF).
 */
export function DocumentViewer({ isOpen, onClose, fileUrl, fileName, mimeType }: DocumentViewerProps) {
  const isPdf = isPdfFile(fileName, mimeType);
  const isImage = isImageFile(fileName, mimeType);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={fileName} size="xl">
      <div onContextMenu={(e) => e.preventDefault()} className="w-full">
        {isPdf && (
          <embed
            src={withPdfViewerParams(fileUrl)}
            type="application/pdf"
            className="w-full h-[70vh] rounded-xl border border-[var(--gray-100)]"
          />
        )}
        {!isPdf && isImage && (
          <img
            src={fileUrl}
            alt={fileName}
            draggable={false}
            className="w-full max-h-[70vh] object-contain rounded-xl select-none"
          />
        )}
        {!isPdf && !isImage && (
          <p className="text-sm text-[var(--gray-400)] py-8 text-center">
            This file type can&apos;t be previewed here. Please contact HR if you need to view this document.
          </p>
        )}
      </div>
    </Modal>
  );
}
