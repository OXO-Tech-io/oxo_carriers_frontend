export function generateNumericStaticParams(count = 500) {
  return Array.from({ length: count }, (_, i) => ({ id: String(i + 1) }));
}

/**
 * Save a Blob the browser already has in memory under `filename`. Used by every
 * report/export button - the API streams the file back through axios with
 * `responseType: 'blob'`, so there is no URL to link to directly.
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
