import { zodResolver } from '@hookform/resolvers/zod';
import { CheckCircle2 } from 'lucide-react';
import { useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { z } from 'zod';
import { ErrorState } from '../../components/States.jsx';
import { useApi } from '../../hooks/useApi.js';
import { createSubmission, getUploadAuth, uploadToImageKit } from '../../services/community.js';
import { getCategories } from '../../services/content.js';
import { applyApiErrors } from '../../utils/forms.js';
import Dropzone from './Dropzone.jsx';
import { mediaTypeOf, validateFile, videoThumbnailUrl } from './uploadRules.js';

const schema = z.object({
  title: z.string().trim().min(1, 'Add a title').max(120, 'Keep the title under 120 characters'),
  description: z.string().trim().max(2000, 'Keep the description under 2000 characters'),
  caption: z.string().trim().max(500, 'Keep the caption under 500 characters'),
  category: z.string().min(1, 'Choose a category'),
  consent: z.literal(true, { errorMap: () => ({ message: 'Please confirm you have the right to share this' }) }),
});
const FIELDS = ['title', 'description', 'caption', 'category'];
// After these errors the uploaded file is gone or unusable, so the user has to pick and upload again.
const REUPLOAD_CODES = new Set(['MEDIA_NOT_FOUND', 'MEDIA_TYPE_NOT_ALLOWED', 'MEDIA_TOO_LARGE', 'MEDIA_FOLDER_MISMATCH', 'MEDIA_URL_MISMATCH']);

export default function UploadForm() {
  const cats = useApi((s) => getCategories(s), []);
  const [file, setFile] = useState(null);
  const [fileError, setFileError] = useState('');
  const [phase, setPhase] = useState('idle'); // idle | uploading | submitting | done
  const [progress, setProgress] = useState(0);
  const [formError, setFormError] = useState('');
  const [alreadySubmitted, setAlreadySubmitted] = useState(false);
  const uploaded = useRef(null); // survives a failed submit so a retry does not upload twice
  const abortRef = useRef(null);

  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors },
  } = useForm({ resolver: zodResolver(schema), defaultValues: { title: '', description: '', caption: '', category: '', consent: false } });

  const busy = phase === 'uploading' || phase === 'submitting';

  const choose = (chosen) => {
    const problem = validateFile(chosen);
    uploaded.current = null;
    setFormError('');
    if (problem) {
      setFile(null);
      setFileError(problem);
      return;
    }
    setFileError('');
    setFile(chosen);
  };

  const onSubmit = async (values) => {
    if (!file) {
      setFileError('Choose a photo or video to upload');
      return;
    }
    setFormError('');
    try {
      if (!uploaded.current) {
        setPhase('uploading');
        setProgress(0);
        const auth = (await getUploadAuth()).data;
        const problem = validateFile(file, auth.limits);
        if (problem) throw Object.assign(new Error(problem), { fileProblem: true });
        abortRef.current = new AbortController();
        const result = await uploadToImageKit({ file, auth, onProgress: setProgress, signal: abortRef.current.signal });
        uploaded.current = { fileId: result.fileId, url: result.url, mediaType: mediaTypeOf(file, auth.limits) };
      }

      setPhase('submitting');
      const { fileId, url, mediaType } = uploaded.current;
      await createSubmission({
        title: values.title,
        description: values.description,
        caption: values.caption,
        category: values.category,
        mediaType,
        mediaUrl: url,
        mediaFileId: fileId,
        ...(mediaType === 'video' ? { thumbnailUrl: videoThumbnailUrl(url) } : {}),
        consent: true,
      });
      setPhase('done');
    } catch (err) {
      if (err.name === 'AbortError') {
        setPhase('idle');
        return;
      }
      if (err.code === 'MEDIA_ALREADY_USED') {
        // A previous attempt reached the server even though its response never arrived.
        setAlreadySubmitted(true);
        setPhase('done');
        return;
      }
      if (err.fileProblem) setFileError(err.message);
      else if (REUPLOAD_CODES.has(err.code)) {
        uploaded.current = null;
        setFormError(`${err.message} Please upload the file again.`);
      } else if (!applyApiErrors(err, setError, FIELDS)) setFormError(err.message);
      setPhase('idle');
    }
  };

  const reallyReset = () => {
    reset();
    setFile(null);
    setFileError('');
    setFormError('');
    setAlreadySubmitted(false);
    setProgress(0);
    uploaded.current = null;
    setPhase('idle');
  };

  if (phase === 'done') {
    return (
      <div className="rounded-card border border-line p-8 text-center" role="status">
        <CheckCircle2 className="mx-auto h-10 w-10 text-green-600" aria-hidden="true" />
        <h2 className="mt-4 text-2xl font-bold tracking-tight">{alreadySubmitted ? 'This upload was already submitted' : 'Thank you! Your upload was submitted'}</h2>
        <p className="mx-auto mt-2 max-w-md text-ink-muted">It is now waiting for review by our team. Once approved, it will appear in the community gallery. It never becomes an official recipe.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button type="button" onClick={reallyReset} className="btn-primary">
            Upload another
          </button>
          <Link to="/dashboard/uploads" className="btn-secondary">
            View my uploads
          </Link>
          <Link to="/community" className="btn-secondary">
            Back to the gallery
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit, () => !file && setFileError('Choose a photo or video to upload'))} noValidate className="space-y-6">
      {formError && (
        <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {formError}
        </div>
      )}

      <Dropzone file={file} onSelect={choose} onClear={() => (setFile(null), (uploaded.current = null))} error={fileError} disabled={busy} />

      <div>
        <label htmlFor="up-title" className="label">
          Title
        </label>
        <input id="up-title" className={`input ${errors.title ? 'input-error' : ''}`} disabled={busy} aria-invalid={Boolean(errors.title)} {...register('title')} />
        {errors.title && (
          <p className="field-error" role="alert">
            {errors.title.message}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="up-category" className="label">
          Category
        </label>
        <select id="up-category" className={`input ${errors.category ? 'input-error' : ''}`} disabled={busy || cats.loading} aria-invalid={Boolean(errors.category)} {...register('category')}>
          <option value="">{cats.loading ? 'Loading categories…' : 'Choose a category'}</option>
          {(cats.data ?? []).map((c) => (
            <option key={c._id} value={c._id}>
              {c.name}
            </option>
          ))}
        </select>
        {errors.category && (
          <p className="field-error" role="alert">
            {errors.category.message}
          </p>
        )}
        {cats.error && <ErrorState error={cats.error} onRetry={cats.reload} />}
      </div>

      <div>
        <label htmlFor="up-description" className="label">
          Description <span className="font-normal text-ink-muted">(optional)</span>
        </label>
        <textarea id="up-description" rows={4} className={`input ${errors.description ? 'input-error' : ''}`} disabled={busy} {...register('description')} />
        {errors.description && (
          <p className="field-error" role="alert">
            {errors.description.message}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="up-caption" className="label">
          Caption or context <span className="font-normal text-ink-muted">(optional)</span>
        </label>
        <input id="up-caption" className={`input ${errors.caption ? 'input-error' : ''}`} placeholder="Who made it, where, for which occasion…" disabled={busy} {...register('caption')} />
        {errors.caption && (
          <p className="field-error" role="alert">
            {errors.caption.message}
          </p>
        )}
      </div>

      <div>
        <label className="flex items-start gap-3 text-sm">
          <input type="checkbox" className="mt-0.5 h-4 w-4 rounded border-line accent-brand" disabled={busy} aria-invalid={Boolean(errors.consent)} {...register('consent')} />
          <span>I took this photo or video, or have permission to share it, and I agree it may be shown publicly on Adi Food once approved.</span>
        </label>
        {errors.consent && (
          <p className="field-error" role="alert">
            {errors.consent.message}
          </p>
        )}
      </div>

      {busy && (
        <div>
          <div className="mb-1.5 flex items-center justify-between text-sm">
            <span role="status">{phase === 'uploading' ? `Uploading… ${progress}%` : 'Submitting…'}</span>
            {phase === 'uploading' && (
              <button type="button" onClick={() => abortRef.current?.abort()} className="font-semibold underline underline-offset-4">
                Cancel
              </button>
            )}
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-surface" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={phase === 'uploading' ? progress : 100} aria-label="Upload progress">
            <div className="h-full rounded-full bg-brand transition-all" style={{ width: `${phase === 'uploading' ? progress : 100}%` }} />
          </div>
        </div>
      )}

      <button type="submit" disabled={busy} className="btn-primary w-full py-3">
        {busy ? 'Working…' : 'Submit for review'}
      </button>
      <p className="text-center text-xs text-ink-muted">Submissions are reviewed before they appear publicly.</p>
    </form>
  );
}
