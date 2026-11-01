import { useEffect, useRef } from 'react';

/** Confirmation modal for destructive actions. Focus starts on Cancel; Esc cancels; Tab stays inside. */
export default function ConfirmDialog({ title, message, confirmLabel = 'Delete', busy = false, error = '', onConfirm, onCancel }) {
  const ref = useRef(null);
  const cancelRef = useRef(null);

  useEffect(() => {
    const previous = document.activeElement;
    cancelRef.current?.focus();
    return () => previous?.focus?.();
  }, []);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape' && !busy) onCancel();
      if (e.key === 'Tab') {
        const nodes = ref.current?.querySelectorAll('button:not([disabled])');
        if (!nodes?.length) return;
        const first = nodes[0];
        const last = nodes[nodes.length - 1];
        if (e.shiftKey && document.activeElement === first) (e.preventDefault(), last.focus());
        else if (!e.shiftKey && document.activeElement === last) (e.preventDefault(), first.focus());
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [busy, onCancel]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => !busy && onCancel()}>
      <div ref={ref} role="alertdialog" aria-modal="true" aria-labelledby="confirm-title" aria-describedby="confirm-message" className="w-full max-w-md rounded-card bg-white p-6 shadow-lift" onClick={(e) => e.stopPropagation()}>
        <h2 id="confirm-title" className="text-xl font-bold tracking-tight">
          {title}
        </h2>
        <p id="confirm-message" className="mt-2 text-ink-muted">
          {message}
        </p>
        {error && (
          <p role="alert" className="mt-3 text-sm text-red-600">
            {error}
          </p>
        )}
        <div className="mt-6 flex justify-end gap-3">
          <button ref={cancelRef} type="button" onClick={onCancel} disabled={busy} className="btn-secondary">
            Cancel
          </button>
          <button type="button" onClick={onConfirm} disabled={busy} className="btn bg-red-600 text-white hover:bg-red-700">
            {busy ? 'Working…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
