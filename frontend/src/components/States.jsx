import { AlertCircle } from 'lucide-react';

export function CardSkeleton({ ratio = 'aspect-[4/3]' }) {
  return (
    <div className="animate-pulse" aria-hidden="true">
      <div className={`${ratio} w-full rounded-card bg-surface`} />
      <div className="mt-3 h-4 w-3/4 rounded bg-surface" />
      <div className="mt-2 h-3 w-1/2 rounded bg-surface" />
    </div>
  );
}

export function EmptyState({ title, text }) {
  return (
    <div className="rounded-card bg-surface px-6 py-10 text-center">
      <p className="font-semibold">{title}</p>
      {text && <p className="mx-auto mt-1 max-w-md text-sm text-ink-muted">{text}</p>}
    </div>
  );
}

export function ErrorState({ error, onRetry }) {
  return (
    <div role="alert" className="flex flex-col items-center gap-3 rounded-card border border-line px-6 py-8 text-center">
      <AlertCircle className="h-6 w-6 text-brand" aria-hidden="true" />
      <p className="text-sm text-ink-muted">{error?.message ?? 'Something went wrong.'}</p>
      {onRetry && (
        <button type="button" onClick={onRetry} className="btn-secondary">
          Try again
        </button>
      )}
    </div>
  );
}
