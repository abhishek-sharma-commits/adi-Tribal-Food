import { X } from 'lucide-react';
import { useEffect, useState } from 'react';

function Lightbox({ item, onClose }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div role="dialog" aria-modal="true" aria-label={item.caption || 'Photo'} className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4" onClick={onClose}>
      <button type="button" onClick={onClose} className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white text-ink" aria-label="Close photo">
        <X className="h-5 w-5" aria-hidden="true" />
      </button>
      <figure className="max-h-full max-w-5xl" onClick={(e) => e.stopPropagation()}>
        <img src={item.url} alt={item.caption || ''} className="max-h-[80vh] w-auto rounded-xl object-contain" />
        {item.caption && <figcaption className="mt-2 text-center text-sm text-white/90">{item.caption}</figcaption>}
      </figure>
    </div>
  );
}

/** Additional photos (with lightbox) and videos from a recipe's media list. */
export default function MediaGallery({ media = [], title }) {
  const [open, setOpen] = useState(null);
  const images = media.filter((m) => m.type === 'image');
  const videos = media.filter((m) => m.type === 'video');
  if (!images.length && !videos.length) return null;

  return (
    <section aria-label="Photos and videos" className="mt-8 space-y-6">
      {images.length > 0 && (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {images.map((m, i) => (
            <li key={m.url + i}>
              <button type="button" onClick={() => setOpen(m)} className="block aspect-square w-full overflow-hidden rounded-card bg-surface" aria-label={`Open photo ${i + 1} of ${images.length}${m.caption ? `: ${m.caption}` : ''}`}>
                <img src={m.url} alt={m.caption || `${title}, photo ${i + 1}`} loading="lazy" className="h-full w-full object-cover transition-transform duration-300 hover:scale-105" />
              </button>
            </li>
          ))}
        </ul>
      )}
      {videos.map((m, i) => (
        <figure key={m.url + i}>
          <video controls preload="metadata" poster={m.thumbnailUrl || undefined} src={m.url} className="w-full rounded-card bg-black" aria-label={m.caption || `${title}, video ${i + 1}`} />
          {m.caption && <figcaption className="mt-2 text-sm text-ink-muted">{m.caption}</figcaption>}
        </figure>
      ))}
      {open && <Lightbox item={open} onClose={() => setOpen(null)} />}
    </section>
  );
}
