import { zodResolver } from '@hookform/resolvers/zod';
import { ChevronLeft } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { z } from 'zod';
import { ErrorState } from '../../components/States.jsx';
import { useApi } from '../../hooks/useApi.js';
import { useDocumentTitle } from '../../hooks/useDocumentTitle.js';
import { getMySubmission, updateMySubmission } from '../../services/community.js';
import { getCategories } from '../../services/content.js';
import { applyApiErrors } from '../../utils/forms.js';
import { isMissing, UploadNotFound } from './UploadDetail.jsx';

const schema = z.object({
  title: z.string().trim().min(1, 'Add a title').max(120, 'Keep the title under 120 characters'),
  category: z.string().min(1, 'Choose a category'),
  description: z.string().trim().max(2000, 'Keep the description under 2000 characters'),
  caption: z.string().trim().max(500, 'Keep the caption under 500 characters'),
});
const FIELDS = ['title', 'category', 'description', 'caption'];

function EditForm({ item, categories }) {
  const navigate = useNavigate();
  const [formError, setFormError] = useState('');
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { title: item.title, category: item.category?._id ?? '', description: item.description ?? '', caption: item.caption ?? '' },
  });

  const onSubmit = async (values) => {
    setFormError('');
    try {
      await updateMySubmission(item._id, values);
      const flash = item.status === 'rejected' ? 'Changes saved. Your upload is back in the review queue.' : 'Changes saved.';
      navigate(`/dashboard/uploads/${item._id}`, { replace: true, state: { flash } });
    } catch (err) {
      if (!applyApiErrors(err, setError, FIELDS)) setFormError(err.code === 'SUBMISSION_LOCKED' ? 'This upload has been approved and can no longer be edited.' : err.message);
    }
  };

  const fieldError = (name) =>
    errors[name] && (
      <p className="field-error" role="alert">
        {errors[name].message}
      </p>
    );

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-6 max-w-xl space-y-5">
      {item.status === 'rejected' && (
        <p role="note" className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Saving your changes sends this upload back for review.
        </p>
      )}
      {formError && (
        <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {formError}
        </div>
      )}
      <div>
        <label htmlFor="ed-title" className="label">
          Title
        </label>
        <input id="ed-title" className={`input ${errors.title ? 'input-error' : ''}`} aria-invalid={Boolean(errors.title)} {...register('title')} />
        {fieldError('title')}
      </div>
      <div>
        <label htmlFor="ed-category" className="label">
          Category
        </label>
        <select id="ed-category" className={`input ${errors.category ? 'input-error' : ''}`} aria-invalid={Boolean(errors.category)} {...register('category')}>
          <option value="">Choose a category</option>
          {categories.map((c) => (
            <option key={c._id} value={c._id}>
              {c.name}
            </option>
          ))}
        </select>
        {fieldError('category')}
      </div>
      <div>
        <label htmlFor="ed-description" className="label">
          Description <span className="font-normal text-ink-muted">(optional)</span>
        </label>
        <textarea id="ed-description" rows={4} className={`input ${errors.description ? 'input-error' : ''}`} {...register('description')} />
        {fieldError('description')}
      </div>
      <div>
        <label htmlFor="ed-caption" className="label">
          Caption or context <span className="font-normal text-ink-muted">(optional)</span>
        </label>
        <input id="ed-caption" className={`input ${errors.caption ? 'input-error' : ''}`} {...register('caption')} />
        {fieldError('caption')}
      </div>
      <p className="text-sm text-ink-muted">To change the photo or video itself, delete this upload and submit a new one.</p>
      <div className="flex gap-3">
        <button type="submit" disabled={isSubmitting} className="btn-primary">
          {isSubmitting ? 'Saving…' : 'Save changes'}
        </button>
        <Link to={`/dashboard/uploads/${item._id}`} className="btn-secondary">
          Cancel
        </Link>
      </div>
    </form>
  );
}

export default function EditUpload() {
  const { id } = useParams();
  const sub = useApi((s) => getMySubmission(id, s), [id]);
  const cats = useApi((s) => getCategories(s), []);
  useDocumentTitle('Edit upload');
  useEffect(() => window.scrollTo?.({ top: 0 }), []);

  if (sub.loading || cats.loading) return <div className="h-64 animate-pulse rounded-card bg-surface" aria-busy="true" />;
  if (isMissing(sub.error)) return <UploadNotFound />;
  if (sub.error) return <ErrorState error={sub.error} onRetry={sub.reload} />;
  if (cats.error) return <ErrorState error={cats.error} onRetry={cats.reload} />;

  const item = sub.data;
  return (
    <div>
      <Link to={`/dashboard/uploads/${item._id}`} className="inline-flex items-center gap-1 text-sm text-ink-muted hover:text-ink">
        <ChevronLeft className="h-4 w-4" aria-hidden="true" /> Back to upload
      </Link>
      <h2 className="mt-3 text-2xl font-bold tracking-tight">Edit upload</h2>
      {item.status === 'approved' ? (
        <div className="mt-6 rounded-card bg-surface p-6">
          <p className="font-semibold">Approved uploads can't be edited</p>
          <p className="mt-1 text-ink-muted">Once an upload is live it is locked, so that what was reviewed is what is shown. Delete it and submit a new one if you need changes.</p>
          <Link to={`/dashboard/uploads/${item._id}`} className="btn-primary mt-4">
            Back to upload
          </Link>
        </div>
      ) : (
        <EditForm item={item} categories={cats.data ?? []} />
      )}
    </div>
  );
}
