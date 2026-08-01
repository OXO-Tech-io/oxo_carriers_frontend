'use client';

interface PaginationProps {
  pageIndex: number;
  pageCount: number;
  onPageChange: (index: number) => void;
  pageSize?: number;
  totalItems?: number;
}

export function Pagination({ pageIndex, pageCount, onPageChange, pageSize, totalItems }: PaginationProps) {
  if (pageCount <= 1) return null;

  const pages = Array.from({ length: pageCount }, (_, i) => i).filter(
    (i) => i === 0 || i === pageCount - 1 || Math.abs(i - pageIndex) <= 1
  );

  const rangeLabel = () => {
    if (!pageSize || totalItems === undefined) return null;
    const start = pageIndex * pageSize + 1;
    const end = Math.min((pageIndex + 1) * pageSize, totalItems);
    return `Showing ${start}–${end} of ${totalItems}`;
  };

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-1">
      <p className="text-xs font-medium text-[var(--gray-400)]">{rangeLabel()}</p>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onPageChange(Math.max(0, pageIndex - 1))}
          disabled={pageIndex === 0}
          className="px-3 py-1.5 rounded-lg text-xs font-semibold text-[var(--gray-500)] hover:bg-[var(--gray-50)] disabled:opacity-40 disabled:pointer-events-none transition-colors"
        >
          Prev
        </button>
        {pages.map((p, idx) => {
          const prev = pages[idx - 1];
          const showEllipsis = prev !== undefined && p - prev > 1;
          return (
            <span key={p} className="flex items-center">
              {showEllipsis && <span className="px-1.5 text-xs text-[var(--gray-300)]">&hellip;</span>}
              <button
                type="button"
                onClick={() => onPageChange(p)}
                className={`h-7 w-7 rounded-lg text-xs font-bold transition-colors ${
                  p === pageIndex
                    ? 'bg-[var(--primary)] text-white'
                    : 'text-[var(--gray-500)] hover:bg-[var(--gray-50)]'
                }`}
              >
                {p + 1}
              </button>
            </span>
          );
        })}
        <button
          type="button"
          onClick={() => onPageChange(Math.min(pageCount - 1, pageIndex + 1))}
          disabled={pageIndex === pageCount - 1}
          className="px-3 py-1.5 rounded-lg text-xs font-semibold text-[var(--gray-500)] hover:bg-[var(--gray-50)] disabled:opacity-40 disabled:pointer-events-none transition-colors"
        >
          Next
        </button>
      </div>
    </div>
  );
}
