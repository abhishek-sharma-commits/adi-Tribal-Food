import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { formatDate } from '../../utils/format.js';

const FOCUSABLE = 'button, [href], input, select, textarea, video[controls], [tabindex]:not([tabindex="-1"])';

/** Modal viewer for gallery items: Esc closes, arrow keys move between items, focus stays inside. */
export default function MediaPreview({ items, index, onClose, onIndex }) {
  const item = items[index];
  const dialogRef = useRef(null);
  const closeRef = useRef(null);

  useEffect(() => {
    const previous = document.activeElement;
    closeRef.current?.focus();
    return () => previous?.focus?.();
  }, []);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowRight' && index < items.length - 1) onIndex(index + 1);
      else if (e.key === 'ArrowLeft' && index > 0) onIndex(index - 1);
      else if (e.key === 'Tab') {
        const nodes = dialogRef.current?.querySelectorAll(FOCUSABLE);
        if (!nodes?.length) return;
        const first = nodes[0];
        const last = nodes[nodes.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [index, items.length, onClose, onIndex]);

  const isVideo = item.mediaType === 'video';
  const navBtn = 'absolute top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white text-ink shadow-lift disabled:hidden';

  return (
    <div ref={dialogRef} role="dialog" aria-modal="true" aria-label={item.title} className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4" onClick={onClose}>
      <button ref={closeRef} type="button" onClick={onClose} className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white text-ink" aria-label="Close preview">
        <X className="h-5 w-5" aria-hidden="true" />
      </button>
      <button type="button" onClick={(e) => (e.stopPropagation(), onIndex(index - 1))} disabled={index === 0} className={`${navBtn} left-4`} aria-label="Previous item">
        <ChevronLeft className="h-5 w-5" aria-hidden="true" />
      </button>
      <button type="button" onClick={(e) => (e.stopPropagation(), onIndex(index + 1))} disabled={index === items.length - 1} className={`${navBtn} right-4`} aria-label="Next item">
        <ChevronRight className="h-5 w-5" aria-hidden="true" />
      </button>

      <figure className="flex max-h-full max-w-4xl flex-col items-center" onClick={(e) => e.stopPropagation()}>
        {isVideo ? (
          <video key={item._id} controls preload="metadata" poster={item.thumbnailUrl || undefined} src={item.mediaUrl} className="max-h-[70vh] w-auto max-w-full rounded-xl bg-black" aria-label={item.title} />
        ) : (
          <img src={item.mediaUrl} alt={item.title} className="max-h-[70vh] w-auto max-w-full rounded-xl object-contain" />
        )}
        <figcaption className="mt-4 max-w-2xl text-center text-white">
          <p className="text-lg font-semibold">{item.title}</p>
          {item.caption && <p className="mt-1 text-sm text-white/90">{item.caption}</p>}
          {item.description && <p className="mt-1 text-sm text-white/80">{item.description}</p>}
          <p className="mt-2 text-xs text-white/70">
            {[item.uploadedBy?.fullName && `Shared by ${item.uploadedBy.fullName}`, item.category?.name, formatDate(item.publishedAt)].filter(Boolean).join(' · ')}
          </p>
        </figcaption>
      </figure>
    </div>
  );
}
