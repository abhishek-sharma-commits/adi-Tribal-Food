import { useState } from 'react';
import ConfirmDialog from '../../components/ConfirmDialog.jsx';
import Pagination from '../../components/Pagination.jsx';
import SearchPill from '../../components/SearchPill.jsx';
import { EmptyState, ErrorState } from '../../components/States.jsx';
import ModerationCard from '../../features/admin/ModerationCard.jsx';
import ReasonDialog from '../../features/admin/ReasonDialog.jsx';
import MediaPreview from '../../features/community/MediaPreview.jsx';
import { useApi } from '../../hooks/useApi.js';
import { useDocumentTitle } from '../../hooks/useDocumentTitle.js';
import { useQueryParams } from '../../hooks/useQueryParams.js';
import { deleteAdminSubmission, listAdminSubmissions, reviewSubmission } from '../../services/admin.js';

const PAGE_SIZE = 10;
const TABS = [
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
];
const TYPES = [
  { value: '', label: 'All types' },
  { value: 'image', label: 'Photos' },
  { value: 'video', label: 'Videos' },
];

export default function Moderation() {
  useDocumentTitle('Moderation');
  const { params, update } = useQueryParams();
  const status = TABS.some((t) => t.value === params.get('status')) ? params.get('status') : 'pending';
  const mediaType = ['image', 'video'].includes(params.get('type')) ? params.get('type') : '';
  const q = params.get('q') ?? '';
  const page = Math.max(1, parseInt(params.get('page'), 10) || 1);

  const { data, meta, loading, error, reload } = useApi((s) => listAdminSubmissions({ status, mediaType, q, page, limit: PAGE_SIZE }, s), [status, mediaType, q, page]);
  const items = data ?? [];
  const counts = meta?.counts;

  const [dialog, setDialog] = useState(null); // { kind: 'reject' | 'delete', item }
  const [previewIndex, setPreviewIndex] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [flash, setFlash] = useState('');
  const [actionError, setActionError] = useState('');
  const [dialogError, setDialogError] = useState('');

  const refreshAfterChange = () => {
    if (items.length === 1 && page > 1) update({ page: page - 1 > 1 ? page - 1 : '' }, { keepPage: true });
    else reload();
  };

  const run = async (item, action, { onSuccess, inDialog = false }) => {
    setBusyId(item._id);
    setActionError('');
    setDialogError('');
    try {
      await action();
      setDialog(null);
      setFlash(onSuccess);
      refreshAfterChange();
    } catch (err) {
      const message = err.code === 'ALREADY_REVIEWED' ? 'This submission has already been reviewed. The list has been refreshed.' : err.message;
      if (inDialog) setDialogError(message);
      else setActionError(message);
      if (err.code === 'ALREADY_REVIEWED' || err.code === 'SUBMISSION_NOT_FOUND') {
        setDialog(null);
        reload();
      }
    } finally {
      setBusyId(null);
    }
  };

  const approve = (item) => run(item, () => reviewSubmission(item._id, { status: 'approved' }), { onSuccess: `“${item.title}” approved and published to the community gallery.` });
  const reject = (item, reason) => run(item, () => reviewSubmission(item._id, { status: 'rejected', reason }), { onSuccess: `“${item.title}” rejected.`, inDialog: true });
  const remove = (item) => run(item, () => deleteAdminSubmission(item._id), { onSuccess: `“${item.title}” deleted.`, inDialog: true });

  const pill = (active) => `chip ${active ? '!border-ink !bg-ink !text-white' : ''}`;
  const changeFilter = (patch) => {
    setFlash('');
    setActionError('');
    update(patch);
  };

  return (
    <div>
      <h2 className="text-2xl font-bold tracking-tight">Community moderation</h2>
      <p className="mt-1 text-ink-muted">Approved items go to the community gallery. They never become official recipes.</p>

      {flash && (
        <p role="status" className="mt-4 rounded-xl bg-green-50 px-4 py-3 text-sm text-green-800">
          {flash}
        </p>
      )}
      {actionError && (
        <p role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {actionError}
        </p>
      )}

      <ul className="mt-6 flex flex-wrap gap-2" aria-label="Filter by status">
        {TABS.map((t) => (
          <li key={t.value}>
            <button type="button" onClick={() => changeFilter({ status: t.value === 'pending' ? '' : t.value })} aria-pressed={status === t.value} className={pill(status === t.value)}>
              {t.label}
              {counts && <span className="ml-1.5 text-xs opacity-80">{counts[t.value]}</span>}
            </button>
          </li>
        ))}
      </ul>
      <ul className="mt-3 flex flex-wrap gap-2" aria-label="Filter by type">
        {TYPES.map((t) => (
          <li key={t.label}>
            <button type="button" onClick={() => changeFilter({ type: t.value })} aria-pressed={mediaType === t.value} className={pill(mediaType === t.value)}>
              {t.label}
            </button>
          </li>
        ))}
      </ul>
      <SearchPill key={q} initialValue={q} onSearch={(value) => changeFilter({ q: value })} placeholder="Search by title or description" className="mt-4 max-w-xl" />

      <div className="mt-6">
        {loading && <div className="h-40 animate-pulse rounded-card bg-surface" aria-busy="true" />}
        {!loading && error && <ErrorState error={error} onRetry={reload} />}
        {!loading && !error && items.length === 0 && (
          <EmptyState
            title={page > 1 && meta?.total > 0 ? 'That page is out of range' : status === 'pending' && !q && !mediaType ? 'Nothing is waiting for review' : 'No submissions match'}
            text={page > 1 && meta?.total > 0 ? 'Go back to the first page to see the submissions.' : q || mediaType ? 'Try a different search or filter.' : 'New submissions will appear here.'}
          />
        )}
        {!loading && !error && items.length > 0 && (
          <>
            <ul className="space-y-4">
              {items.map((item, i) => (
                <ModerationCard
                  key={item._id}
                  item={item}
                  busy={busyId === item._id}
                  onPreview={() => setPreviewIndex(i)}
                  onApprove={() => approve(item)}
                  onReject={() => (setDialogError(''), setDialog({ kind: 'reject', item }))}
                  onDelete={() => (setDialogError(''), setDialog({ kind: 'delete', item }))}
                />
              ))}
            </ul>
            <Pagination page={meta?.page ?? page} totalPages={meta?.totalPages ?? 1} onChange={(p) => update({ page: p > 1 ? p : '' }, { keepPage: true })} />
          </>
        )}
      </div>

      {dialog?.kind === 'reject' && (
        <ReasonDialog
          title={dialog.item.status === 'approved' ? 'Reject and unpublish' : 'Reject submission'}
          description={dialog.item.status === 'approved' ? `“${dialog.item.title}” will be removed from the community gallery.` : `“${dialog.item.title}”`}
          busy={busyId === dialog.item._id}
          error={dialogError}
          onSubmit={(reason) => reject(dialog.item, reason)}
          onCancel={() => setDialog(null)}
        />
      )}
      {dialog?.kind === 'delete' && (
        <ConfirmDialog
          title="Delete this submission?"
          message={`“${dialog.item.title}” and its file will be permanently removed. The moderation history is kept.`}
          busy={busyId === dialog.item._id}
          error={dialogError}
          onConfirm={() => remove(dialog.item)}
          onCancel={() => setDialog(null)}
        />
      )}
      {previewIndex !== null && items[previewIndex] && <MediaPreview items={items} index={previewIndex} onClose={() => setPreviewIndex(null)} onIndex={setPreviewIndex} />}
    </div>
  );
}
