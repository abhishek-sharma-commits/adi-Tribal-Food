import { Film, ImagePlus, X } from 'lucide-react';
import { useEffect, useId, useRef, useState } from 'react';
import { ACCEPT, formatBytes, mediaTypeOf } from './uploadRules.js';

export default function Dropzone({ file, onSelect, onClear, error, disabled }) {
  const id = useId();
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');
  const type = file ? mediaTypeOf(file) : null;

  useEffect(() => {
    if (!file || !type) {
      setPreviewUrl('');
      return undefined;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file, type]);

  const pick = (files) => {
    const chosen = files?.[0];
    if (chosen) onSelect(chosen);
  };

  return (
    <div>
      <span className="label">Photo or video</span>
      {file ? (
        <div className="overflow-hidden rounded-card border border-line">
          <div className="flex aspect-video items-center justify-center bg-surface">
            {type === 'image' && previewUrl && <img src={previewUrl} alt="Selected file preview" className="h-full w-full object-contain" />}
            {type === 'video' && previewUrl && <video src={previewUrl} controls preload="metadata" className="h-full w-full" aria-label="Selected video preview" />}
            {!type && <Film className="h-8 w-8 text-ink-muted" aria-hidden="true" />}
          </div>
          <div className="flex items-center justify-between gap-3 p-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{file.name}</p>
              <p className="text-xs text-ink-muted">
                {type === 'video' ? 'Video' : 'Photo'} · {formatBytes(file.size)}
              </p>
            </div>
            <button type="button" onClick={onClear} disabled={disabled} className="btn-secondary shrink-0 !px-3 !py-1.5" aria-label="Remove selected file">
              <X className="h-4 w-4" aria-hidden="true" /> Remove
            </button>
          </div>
        </div>
      ) : (
        <label
          htmlFor={id}
          onDragOver={(e) => (e.preventDefault(), !disabled && setDragging(true))}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            if (!disabled) pick(e.dataTransfer?.files);
          }}
          className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-card border-2 border-dashed px-6 py-12 text-center transition-colors ${dragging ? 'border-brand bg-brand-soft' : 'border-line hover:border-ink'} ${error ? '!border-red-600' : ''}`}
        >
          <ImagePlus className="h-8 w-8 text-ink-muted" aria-hidden="true" />
          <span className="font-semibold">Drag a file here, or click to choose</span>
          <span className="text-sm text-ink-muted">JPG, PNG, WebP, GIF or AVIF up to 10 MB · MP4, WebM or MOV up to 100 MB</span>
        </label>
      )}
      <input ref={inputRef} id={id} type="file" accept={ACCEPT} disabled={disabled} className="sr-only" onChange={(e) => (pick(e.target.files), (e.target.value = ''))} />
      {error && (
        <p className="field-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
