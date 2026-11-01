import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import ConfirmDialog from '../../components/ConfirmDialog.jsx';
import Pagination from '../../components/Pagination.jsx';
import { EmptyState, ErrorState } from '../../components/States.jsx';
import UploadRow from '../../features/community/UploadRow.jsx';
import { useApi } from '../../hooks/useApi.js';
import { useDocumentTitle } from '../../hooks/useDocumentTitle.js';
import { useQueryParams } from '../../hooks/useQueryParams.js';
import { deleteMySubmission, listMySubmissions } from '../../services/community.js';

const PAGE_SIZE = 10;
const STATUS_TABS = [
  { value: '', label: 'All', count: 'total' },
  { value: 'pending', label: 'Pending', count: 'pending' },
  { value: 'approved', label: 'Approved', count: 'approved' },
  { value: 'rejected', label: 'Rejected', count: 'rejected' },
];
const TYPE_TABS = [
  { value: '', label: 'All types' },
  { value: 'image', label: 'Photos' },
  { value: 'video', label: 'Videos' },
];

export default function MyUploads() {
  useDocumentTitle('My uploads');
  const location = useLocation();
  const { params, update } = useQueryParams();
  const status = ['pending', 'approved', 'rejected'].includes(params.get('status')) ? params.get('status') : '';
  const mediaType = ['image', 'video'].includes(params.get('type')) ? params.get('type') : '';
  const page = Math.max(1, parseInt(params.get('page'), 10) || 1);

  const { data, meta, loading, error, reload } = useApi((s) => listMySubmissions({ status, mediaType, page, limit: PAGE_SIZE }, s), [status, mediaType, page]);
  const [target, setTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [flash, setFlash] = useState(location.state?.flash ?? '');

  const confirmDelete = async () => {
    setDeleting(true);
    setDeleteError('');
    try {
      await deleteMySubmission(target._id);
      setTarget(null);
      setFlash('Submission deleted.');
      if (data.length === 1 && page > 1) update({ page: page - 1 > 1 ? page - 1 : '' }, { keepPage: true });
      else reload();
    } catch (err) {
      setDeleteError(err.message);
    } finally {
      setDeleting(false);
    }
  };

  const pill = (active) => `chip ${active ? '!border-ink !bg-ink !text-white' : ''}`;
  const counts = meta?.counts;
  const items = data ?? [];

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-2xl font-bold tracking-tight">My uploads</h2>
        <Link to="/dashboard/upload" className="btn-primary">
          Upload photos or videos
        </Link>
      </div>

      {flash && (
        <p role="status" className="mt-4 rounded-xl bg-green-50 px-4 py-3 text-sm text-green-800">
          {flash}
        </p>
      )}

      <ul className="mt-6 flex flex-wrap gap-2" aria-label="Filter by status">
        {STATUS_TABS.map((t) => (
          <li key={t.label}>
            <button type="button" onClick={() => update({ status: t.value })} aria-pressed={status === t.value} className={pill(status === t.value)}>
              {t.label}
              {counts && <span className="ml-1.5 text-xs opacity-80">{counts[t.count]}</span>}
            </button>
          </li>
        ))}
      </ul>
      <ul className="mt-3 flex flex-wrap gap-2" aria-label="Filter by type">
        {TYPE_TABS.map((t) => (
          <li key={t.label}>
            <button type="button" onClick={() => update({ type: t.value })} aria-pressed={mediaType === t.value} className={pill(mediaType === t.value)}>
              {t.label}
            </button>
          </li>
        ))}
      </ul>

      <div className="mt-6">
        {loading && <div className="h-40 animate-pulse rounded-card bg-surface" aria-busy="true" />}
        {!loading && error && <ErrorState error={error} onRetry={reload} />}
        {!loading && !error && items.length === 0 && (
          <EmptyState
            title={status || mediaType ? 'No uploads match these filters' : "You haven't uploaded anything yet"}
            text={status || mediaType ? 'Try a different filter.' : 'Share a photo or video of Adi food to get started.'}
          />
        )}
        {!loading && !error && items.length > 0 && (
          <>
            <ul className="space-y-3">
              {items.map((item) => (
                <UploadRow key={item._id} item={item} onDelete={(it) => (setDeleteError(''), setTarget(it))} />
              ))}
            </ul>
            <Pagination page={meta?.page ?? page} totalPages={meta?.totalPages ?? 1} onChange={(p) => update({ page: p > 1 ? p : '' }, { keepPage: true })} />
          </>
        )}
      </div>

      {target && (
        <ConfirmDialog
          title="Delete this upload?"
          message={`“${target.title}” will be permanently removed${target.status === 'approved' ? ' from the community gallery' : ''}. This can't be undone.`}
          busy={deleting}
          error={deleteError}
          onConfirm={confirmDelete}
          onCancel={() => setTarget(null)}
        />
      )}
    </div>
  );
}
