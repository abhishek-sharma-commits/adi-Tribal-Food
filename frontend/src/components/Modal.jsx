import { X } from 'lucide-react';
import { useEffect, useRef } from 'react';

const FOCUSABLE = 'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled])';

/** Generic dialog: Esc closes (unless `locked`), Tab stays inside, focus returns to the opener on close. */
export default function Modal({ title, onClose, locked = false, children, size = 'max-w-lg' }) {
  const ref = useRef(null);

  useEffect(() => {
    const previous = document.activeElement;
    (ref.current?.querySelector('textarea:not([disabled]), input:not([disabled]), select:not([disabled])') ?? ref.current?.querySelector(FOCUSABLE))?.focus();
    return () => previous?.focus?.();
  }, []);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape' && !locked) onClose();
      if (e.key === 'Tab') {
        const nodes = ref.current?.querySelectorAll(FOCUSABLE);
        if (!nodes?.length) return;
        const first = nodes[0];
        const last = nodes[nodes.length - 1];
        if (e.shiftKey && document.activeElement === first) (e.preventDefault(), last.focus());
        else if (!e.shiftKey && document.activeElement === last) (e.preventDefault(), first.focus());
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [locked, onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => !locked && onClose()}>
      <div ref={ref} role="dialog" aria-modal="true" aria-label={title} className={`w-full ${size} rounded-card bg-white p-6 shadow-lift`} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-4">
          <h2 className="text-xl font-bold tracking-tight">{title}</h2>
          <button type="button" onClick={onClose} disabled={locked} className="-mr-2 -mt-2 flex h-9 w-9 items-center justify-center rounded-full hover:bg-surface" aria-label="Close">
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
        <div className="mt-4">{children}</div>
      </div>
    </div>
  );
}
