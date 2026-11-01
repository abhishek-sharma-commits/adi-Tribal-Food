import { Camera, Play } from 'lucide-react';
import { useState } from 'react';

export default function MediaThumb({ item, className = '' }) {
  const [broken, setBroken] = useState(false);
  const isVideo = item.mediaType === 'video';
  const src = isVideo ? item.thumbnailUrl : item.mediaUrl;
  return (
    <div className={`overflow-hidden bg-surface ${className}`}>
      {src && !broken ? (
        <img src={src} alt="" loading="lazy" onError={() => setBroken(true)} className="h-full w-full object-cover" />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-ink-muted" aria-hidden="true">
          {isVideo ? <Play className="h-5 w-5" /> : <Camera className="h-5 w-5" />}
        </div>
      )}
    </div>
  );
}
