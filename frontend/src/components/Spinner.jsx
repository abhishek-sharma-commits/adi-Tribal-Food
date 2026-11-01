export default function Spinner({ label = 'Loading' }) {
  return (
    <div role="status" className="flex items-center gap-3 text-ink-muted">
      <span className="h-5 w-5 animate-spin rounded-full border-2 border-line border-t-ink" aria-hidden="true" />
      <span className="text-sm">{label}…</span>
    </div>
  );
}
