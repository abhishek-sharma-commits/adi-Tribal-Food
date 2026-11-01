import { Star } from 'lucide-react';
import { useState } from 'react';
import ConfirmDialog from '../../components/ConfirmDialog.jsx';
import Pagination from '../../components/Pagination.jsx';
import SearchPill from '../../components/SearchPill.jsx';
import { EmptyState, ErrorState } from '../../components/States.jsx';
import EditMediaDialog from '../../features/admin/EditMediaDialog.jsx';
import MediaUploader from '../../features/admin/MediaUploader.jsx';
import MediaThumb from '../../features/community/MediaThumb.jsx';
import MediaPreview from '../../features/community/MediaPreview.jsx';
import { useApi } from '../../hooks/useApi.js';
import { useDocumentTitle } from '../../hooks/useDocumentTitle.js';
import { useQueryParams } from '../../hooks/useQueryParams.js';
import { createMedia, deleteMedia, listAdminMedia, setMediaFeatured, setMediaStatus } from '../../services/adminMedia.js';
import { getCategories } from '../../services/content.js';

const PAGE_SIZE = 20;
const STATUSES = [{ value: '', label: 'All' }, { value: 'draft', label: 'Drafts' }, { value: 'published', label: 'Published' }];
const TYPES = [{ value: '', label: 'All types' }, { value: 'image', label: 'Photos' }, { value: 'video', label: 'Videos' }];

export default function AdminMedia() {
  useDocumentTitle('Official media');
  const { params, update, clearAll } = useQueryParams();
  const q = params.get('q') ?? '';
  const status = ['draft', 'published'].includes(params.get('status')) ? params.get('status') : '';
  const mediaType = ['image', 'video'].includes(params.get('type')) ? params.get('type') : '';
  const category = params.get('category') ?? '';
  const featured = params.get('featured') === 'true' ? 'true' : '';
  const page = Math.max(1, parseInt(params.get('page'), 10) || 1);

  const cats = useApi((s) => getCategories(s), []);
  const { data, meta, loading, error, reload } = useApi((s) => listAdminMedia({ q, status, mediaType, category, featured, page, limit: PAGE_SIZE }, s), [q, status, mediaType, category, featured, page]);
  const items = data ?? [];

  const [flash, setFlash] = useState('');
  const [actionError, setActionError] = useState('');
  const [busyId, setBusyId] = useState(null);
  const [editing, setEditing] = useState(null); // { item, notice? }
  const [target, setTarget] = useState(null);
  const [dialogError, setDialogError] = useState('');
  const [previewIndex, setPreviewIndex] = useState(null);

  const run = async (item, action, message, { inDialog = false } = {}) => {
    setBusyId(item._id);
    setActionError('');
    setDialogError('');
    try {
      await action();
      setFlash(message);
      setTarget(null);
      if (items.length === 1 && page > 1 && message.endsWith('deleted.')) update({ page: page - 1 > 1 ? page - 1 : '' }, { keepPage: true });
      else reload();
    } catch (err) {
      if (inDialog) setDialogError(err.message);
      else setActionError(err.message);
    } finally {
      setBusyId(null);
    }
  };

  // Uploading creates a draft record straight away (so no file is ever left without a record), then opens its details.
  const onUploaded = async (r) => {
    setFlash('');
    setActionError('');
    try {
      const title = (r.fileName ?? 'Untitled').replace(/\.[^.]+$/, '').slice(0, 120) || 'Untitled';
      const res = await createMedia({ title, mediaType: r.type, mediaUrl: r.url, mediaFileId: r.fileId, thumbnailUrl: r.thumbnailUrl, status: 'draft', isFeatured: false });
      reload();
      setEditing({ item: res.data, notice: 'Uploaded as a draft. Add a title and details, then publish it from the list.' });
    } catch (err) {
      setActionError(`The file was uploaded but could not be added to the library: ${err.message}`);
    }
  };

  const pill = (active) => `chip ${active ? '!border-ink !bg-ink !text-white' : ''}`;
  const filtered = Boolean(q || status || mediaType || category || featured);
  const change = (patch) => (setFlash(''), setActionError(''), update(patch));

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Official media</h2>
          <p className="mt-1 text-ink-muted">Photos and videos published by the team. Feature items to show them on the homepage.</p>
        </div>
        <MediaUploader kind="any" label="Upload photo or video" onUploaded={onUploaded} />
      </div>

      {flash && <p role="status" className="mt-4 rounded-xl bg-green-50 px-4 py-3 text-sm text-green-800">{flash}</p>}
      {actionError && <p role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{actionError}</p>}

      <SearchPill key={q} initialValue={q} onSearch={(v) => change({ q: v })} placeholder="Search title or description" className="mt-6 max-w-xl" />
      <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-3">
        <ul className="flex flex-wrap gap-2" aria-label="Filter by status">
          {STATUSES.map((s) => <li key={s.label}><button type="button" onClick={() => change({ status: s.value })} aria-pressed={status === s.value} className={pill(status === s.value)}>{s.label}</button></li>)}
          <li><button type="button" onClick={() => change({ featured: featured ? '' : 'true' })} aria-pressed={Boolean(featured)} className={pill(Boolean(featured))}>Featured only</button></li>
        </ul>
        <ul className="flex flex-wrap gap-2" aria-label="Filter by type">
          {TYPES.map((t) => <li key={t.label}><button type="button" onClick={() => change({ type: t.value })} aria-pressed={mediaType === t.value} className={pill(mediaType === t.value)}>{t.label}</button></li>)}
        </ul>
        <div className="flex items-center gap-2">
          <label htmlFor="md-category" className="text-sm text-ink-muted">Category</label>
          <select id="md-category" value={category} onChange={(e) => change({ category: e.target.value })} className="rounded-full border border-line bg-white px-4 py-2 text-sm focus:border-ink focus:outline-none">
            <option value="">All categories</option>
            {(cats.data ?? []).map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
          </select>
        </div>
      </div>

      <div className="mt-4 flex min-h-8 items-center gap-3 text-sm text-ink-muted" aria-live="polite">
        {!loading && !error && meta && <span>{meta.total} {meta.total === 1 ? 'item' : 'items'}</span>}
        {filtered && <button type="button" onClick={clearAll} className="rounded-full border border-line px-3 py-1 hover:border-ink">Clear filters</button>}
      </div>

      <div className="mt-2">
        {loading && <div className="h-40 animate-pulse rounded-card bg-surface" aria-busy="true" />}
        {!loading && error && <ErrorState error={error} onRetry={reload} />}
        {!loading && !error && items.length === 0 && (
          <EmptyState title={page > 1 && meta?.total > 0 ? 'That page is out of range' : filtered ? 'No media match' : 'No official media yet'} text={page > 1 && meta?.total > 0 ? 'Go back to the first page.' : filtered ? 'Try a different search or filter.' : 'Upload a photo or video to get started.'} />
        )}
        {!loading && !error && items.length > 0 && (
          <>
            <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {items.map((m, i) => (
                <li key={m._id} className="overflow-hidden rounded-card border border-line">
                  <button type="button" onClick={() => setPreviewIndex(i)} className="block aspect-video w-full" aria-label={`Preview ${m.title}`}>
                    <MediaThumb item={m} className="h-full w-full" />
                  </button>
                  <div className="p-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold">{m.title}</h3>
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${m.status === 'published' ? 'bg-green-50 text-green-800' : 'bg-surface text-ink-muted'}`}>{m.status === 'published' ? 'Published' : 'Draft'}</span>
                      {m.isFeatured && <span className="inline-flex items-center gap-1 rounded-full bg-brand-soft px-2.5 py-0.5 text-xs font-semibold text-brand"><Star className="h-3 w-3" aria-hidden="true" /> Featured</span>}
                    </div>
                    <p className="mt-1 text-sm text-ink-muted">{m.mediaType === 'video' ? 'Video' : 'Photo'} · {m.category?.name ?? 'No category'}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button type="button" onClick={() => setEditing({ item: m })} className="btn-secondary !px-3 !py-1.5" aria-label={`Edit ${m.title}`}>Edit</button>
                      <button type="button" disabled={busyId === m._id} onClick={() => run(m, () => setMediaStatus(m._id, m.status === 'published' ? 'draft' : 'published'), m.status === 'published' ? `“${m.title}” unpublished.` : `“${m.title}” published.`)} className="btn-secondary !px-3 !py-1.5" aria-label={`${m.status === 'published' ? 'Unpublish' : 'Publish'} ${m.title}`}>{m.status === 'published' ? 'Unpublish' : 'Publish'}</button>
                      <button type="button" disabled={busyId === m._id} onClick={() => run(m, () => setMediaFeatured(m._id, !m.isFeatured), m.isFeatured ? `“${m.title}” removed from featured.` : `“${m.title}” featured on the homepage.`)} className="btn-secondary !px-3 !py-1.5" aria-label={`${m.isFeatured ? 'Unfeature' : 'Feature'} ${m.title}`}>{m.isFeatured ? 'Unfeature' : 'Feature'}</button>
                      <button type="button" disabled={busyId === m._id} onClick={() => (setDialogError(''), setTarget(m))} className="btn-ghost !px-3 !py-1.5 text-red-700" aria-label={`Delete ${m.title}`}>Delete</button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            <Pagination page={meta?.page ?? page} totalPages={meta?.totalPages ?? 1} onChange={(p) => update({ page: p > 1 ? p : '' }, { keepPage: true })} />
          </>
        )}
      </div>

      {editing && <EditMediaDialog key={editing.item._id} item={editing.item} notice={editing.notice} categories={cats.data ?? []} onClose={() => setEditing(null)} onSaved={(msg) => (setEditing(null), setFlash(msg), reload())} />}
      {target && <ConfirmDialog title="Delete this media?" message={`“${target.title}” and its file will be permanently removed. This can't be undone.`} busy={busyId === target._id} error={dialogError} onConfirm={() => run(target, () => deleteMedia(target._id), `“${target.title}” deleted.`, { inDialog: true })} onCancel={() => setTarget(null)} />}
      {previewIndex !== null && items[previewIndex] && <MediaPreview items={items} index={previewIndex} onClose={() => setPreviewIndex(null)} onIndex={setPreviewIndex} />}
    </div>
  );
}
