import { ChevronLeft, ChevronRight } from 'lucide-react';

function pageWindow(page, total) {
  const pages = new Set([1, total, page - 1, page, page + 1]);
  const sorted = [...pages].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);
  const out = [];
  sorted.forEach((p, i) => {
    if (i > 0 && p - sorted[i - 1] > 1) out.push('…');
    out.push(p);
  });
  return out;
}

export default function Pagination({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null;
  const item = 'flex h-10 min-w-10 items-center justify-center rounded-full px-3 text-sm font-medium';
  return (
    <nav aria-label="Pagination" className="mt-10 flex items-center justify-center gap-1">
      <button type="button" onClick={() => onChange(page - 1)} disabled={page <= 1} className={`${item} hover:bg-surface disabled:opacity-40`} aria-label="Previous page">
        <ChevronLeft className="h-4 w-4" aria-hidden="true" />
      </button>
      {pageWindow(page, totalPages).map((p, i) =>
        p === '…' ? (
          <span key={`gap-${i}`} className={`${item} text-ink-muted`} aria-hidden="true">
            …
          </span>
        ) : (
          <button key={p} type="button" onClick={() => onChange(p)} aria-current={p === page ? 'page' : undefined} aria-label={`Page ${p}`} className={`${item} ${p === page ? 'bg-ink text-white' : 'hover:bg-surface'}`}>
            {p}
          </button>
        )
      )}
      <button type="button" onClick={() => onChange(page + 1)} disabled={page >= totalPages} className={`${item} hover:bg-surface disabled:opacity-40`} aria-label="Next page">
        <ChevronRight className="h-4 w-4" aria-hidden="true" />
      </button>
    </nav>
  );
}
