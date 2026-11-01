import { Camera, Play } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';

/** With `onOpen` the tile is a button (opens the preview); without it, it links to the gallery. */
export default function GalleryTile({ item, onOpen }) {
  const isVideo = item.mediaType === 'video';
  const [broken, setBroken] = useState(false);
  const preview = isVideo ? item.thumbnailUrl : item.mediaUrl;
  const label = `${isVideo ? 'Video' : 'Photo'}: ${item.title}`;
  const className = 'group relative block aspect-square w-full overflow-hidden rounded-card bg-surface text-left';

  const content = (
    <>
      {preview && !broken ? (
        <img src={preview} alt={item.title} loading="lazy" onError={() => setBroken(true)} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-ink-muted" aria-hidden="true">
          {isVideo ? <Play className="h-8 w-8" /> : <Camera className="h-8 w-8" />}
        </div>
      )}
      <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-xs font-medium shadow-card">
        {isVideo ? <Play className="h-3 w-3" aria-hidden="true" /> : <Camera className="h-3 w-3" aria-hidden="true" />}
        {isVideo ? 'Video' : 'Photo'}
      </span>
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-3 pt-8 text-white">
        <p className="line-clamp-1 text-sm font-medium">{item.title}</p>
        {item.uploadedBy?.fullName && <p className="text-xs text-white/80">by {item.uploadedBy.fullName}</p>}
      </div>
    </>
  );

  if (onOpen) {
    return (
      <button type="button" onClick={onOpen} className={className} aria-label={label}>
        {content}
      </button>
    );
  }
  return (
    <Link to="/community" className={className} aria-label={label}>
      {content}
    </Link>
  );
}
