import { ChevronLeft } from 'lucide-react';
import { useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import ConfirmDialog from '../../components/ConfirmDialog.jsx';
import { ErrorState } from '../../components/States.jsx';
import StatusBadge from '../../features/community/StatusBadge.jsx';
import { useApi } from '../../hooks/useApi.js';
import { useDocumentTitle } from '../../hooks/useDocumentTitle.js';
import { deleteMySubmission, getMySubmission } from '../../services/community.js';
import { formatDate } from '../../utils/format.js';

export function UploadNotFound() {
  return (
    <div className="rounded-card bg-surface px-6 py-12 text-center">
      <h2 className="text-xl font-bold tracking-tight">Upload not found</h2>
      <p className="mt-1 text-ink-muted">It may have been deleted, or it doesn't belong to your account.</p>
      <Link to="/dashboard/uploads" className="btn-primary mt-5">
        Back to my uploads
      </Link>
    </div>
  );
}

export const isMissing = (error) => error?.status === 404 || error?.code === 'INVALID_ID';

export default function UploadDetail() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { data: item, loading, error, reload } = useApi((s) => getMySubmission(id, s), [id]);
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  useDocumentTitle(item?.title);

  if (loading) return <div className="h-64 animate-pulse rounded-card bg-surface" aria-busy="true" />;
  if (isMissing(error)) return <UploadNotFound />;
  if (error) return <ErrorState error={error} onRetry={reload} />;

  const remove = async () => {
    setDeleting(true);
    setDeleteError('');
    try {
      await deleteMySubmission(item._id);
      navigate('/dashboard/uploads', { replace: true, state: { flash: 'Submission deleted.' } });
    } catch (err) {
      setDeleteError(err.message);
      setDeleting(false);
    }
  };

  return (
    <article>
      <Link to="/dashboard/uploads" className="inline-flex items-center gap-1 text-sm text-ink-muted hover:text-ink">
        <ChevronLeft className="h-4 w-4" aria-hidden="true" /> My uploads
      </Link>

      {location.state?.flash && (
        <p role="status" className="mt-4 rounded-xl bg-green-50 px-4 py-3 text-sm text-green-800">
          {location.state.flash}
        </p>
      )}

      <div className="mt-4 flex flex-wrap items-start justify-between gap-3">
        <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">{item.title}</h2>
        <StatusBadge status={item.status} />
      </div>

      <div className="mt-5 overflow-hidden rounded-card bg-surface">
        {item.mediaType === 'video' ? (
          <video controls preload="metadata" poster={item.thumbnailUrl || undefined} src={item.mediaUrl} className="max-h-[480px] w-full bg-black" aria-label={item.title} />
        ) : (
          <img src={item.mediaUrl} alt={item.title} className="max-h-[480px] w-full object-contain" />
        )}
      </div>

      {item.status === 'rejected' && (
        <div role="note" className="mt-5 rounded-card border border-red-200 bg-red-50 p-4">
          <p className="font-semibold text-red-800">Why this wasn't approved</p>
          <p className="mt-1 text-red-700">{item.rejectionReason || 'No reason was recorded.'}</p>
          <p className="mt-2 text-sm text-red-700">You can edit the details and resubmit it for review.</p>
        </div>
      )}
      {item.status === 'pending' && <p className="mt-5 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">Our team will review this soon. It becomes public once approved.</p>}
      {item.status === 'approved' && (
        <p className="mt-5 rounded-xl bg-green-50 px-4 py-3 text-sm text-green-800">
          This upload is live in the{' '}
          <Link to="/community" className="font-semibold underline underline-offset-4">
            community gallery
          </Link>
          .
        </p>
      )}

      <dl className="mt-6 grid gap-x-8 gap-y-4 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-ink-muted">Type</dt>
          <dd className="font-medium">{item.mediaType === 'video' ? 'Video' : 'Photo'}</dd>
        </div>
        <div>
          <dt className="text-ink-muted">Category</dt>
          <dd className="font-medium">{item.category?.name ?? 'None'}</dd>
        </div>
        <div>
          <dt className="text-ink-muted">Submitted</dt>
          <dd className="font-medium">{formatDate(item.createdAt)}</dd>
        </div>
        {item.reviewedAt && (
          <div>
            <dt className="text-ink-muted">Reviewed</dt>
            <dd className="font-medium">{formatDate(item.reviewedAt)}</dd>
          </div>
        )}
        {item.description && (
          <div className="sm:col-span-2">
            <dt className="text-ink-muted">Description</dt>
            <dd className="whitespace-pre-line">{item.description}</dd>
          </div>
        )}
        {item.caption && (
          <div className="sm:col-span-2">
            <dt className="text-ink-muted">Caption</dt>
            <dd className="whitespace-pre-line">{item.caption}</dd>
          </div>
        )}
      </dl>

      <div className="mt-8 flex flex-wrap gap-3">
        {item.status !== 'approved' && (
          <Link to={`/dashboard/uploads/${item._id}/edit`} className="btn-primary">
            {item.status === 'rejected' ? 'Edit and resubmit' : 'Edit details'}
          </Link>
        )}
        <button type="button" onClick={() => setConfirming(true)} className="btn-secondary text-red-700">
          Delete
        </button>
      </div>

      {confirming && (
        <ConfirmDialog title="Delete this upload?" message={`“${item.title}” will be permanently removed${item.status === 'approved' ? ' from the community gallery' : ''}. This can't be undone.`} busy={deleting} error={deleteError} onConfirm={remove} onCancel={() => setConfirming(false)} />
      )}
    </article>
  );
}
