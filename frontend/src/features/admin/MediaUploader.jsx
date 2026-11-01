import { Upload } from 'lucide-react';
import { useId, useRef, useState } from 'react';
import { getUploadAuth, uploadToImageKit } from '../../services/community.js';
import { ACCEPT, DEFAULT_LIMITS, mediaTypeOf, validateFile, videoThumbnailUrl } from '../community/uploadRules.js';

const IMAGE_ACCEPT = DEFAULT_LIMITS.allowedTypes.image.join(',');

/**
 * Uploads one image (or video) straight to ImageKit's official folder and reports the result.
 * `kind="image"` restricts to photos; `kind="any"` also allows video.
 */
export default function MediaUploader({ kind = 'image', label, onUploaded, disabled }) {
  const id = useId();
  const abortRef = useRef(null);
  const [progress, setProgress] = useState(null); // null = idle
  const [error, setError] = useState('');

  const choose = async (file) => {
    setError('');
    let problem = validateFile(file);
    if (!problem && kind === 'image' && mediaTypeOf(file) !== 'image') problem = 'Please choose a photo (JPG, PNG, WebP, GIF or AVIF).';
    if (problem) return setError(problem);

    try {
      setProgress(0);
      const auth = (await getUploadAuth('official')).data;
      problem = validateFile(file, auth.limits);
      if (problem) throw new Error(problem);
      abortRef.current = new AbortController();
      const result = await uploadToImageKit({ file, auth, onProgress: setProgress, signal: abortRef.current.signal });
      const type = mediaTypeOf(file, auth.limits);
      onUploaded({ type, url: result.url, fileId: result.fileId, thumbnailUrl: type === 'video' ? videoThumbnailUrl(result.url) : '', fileName: file.name });
    } catch (err) {
      if (err.name !== 'AbortError') setError(err.message);
    } finally {
      setProgress(null);
    }
  };

  const uploading = progress !== null;
  return (
    <div>
      <label htmlFor={id} className={`btn-secondary cursor-pointer ${disabled || uploading ? 'pointer-events-none opacity-60' : ''}`}>
        <Upload className="h-4 w-4" aria-hidden="true" /> {uploading ? `Uploading… ${progress}%` : label}
      </label>
      <input id={id} type="file" accept={kind === 'image' ? IMAGE_ACCEPT : ACCEPT} className="sr-only" disabled={disabled || uploading} onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ''; if (f) choose(f); }} />
      {uploading && (
        <div className="mt-2 flex items-center gap-3">
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress} aria-label="Upload progress">
            <div className="h-full rounded-full bg-brand transition-all" style={{ width: `${progress}%` }} />
          </div>
          <button type="button" onClick={() => abortRef.current?.abort()} className="text-sm font-semibold underline underline-offset-4">
            Cancel
          </button>
        </div>
      )}
      {error && (
        <p role="alert" className="field-error">
          {error}
        </p>
      )}
    </div>
  );
}
