import { Plus } from 'lucide-react';
import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import ConfirmDialog from '../../components/ConfirmDialog.jsx';
import Pagination from '../../components/Pagination.jsx';
import SearchPill from '../../components/SearchPill.jsx';
import { EmptyState, ErrorState } from '../../components/States.jsx';
import MediaThumb from '../../features/community/MediaThumb.jsx';
import { useApi } from '../../hooks/useApi.js';
import { useDocumentTitle } from '../../hooks/useDocumentTitle.js';
import { useQueryParams } from '../../hooks/useQueryParams.js';
import { deleteBlog, listAdminBlogs, updateBlog } from '../../services/adminBlogs.js';
import { getCategories } from '../../services/content.js';
import { formatDate } from '../../utils/format.js';

const PAGE_SIZE = 20;
const STATUSES = [{ value: '', label: 'All' }, { value: 'draft', label: 'Drafts' }, { value: 'published', label: 'Published' }, { value: 'archived', label: 'Archived' }];
const SORTS = [{ value: 'newest', label: 'Newest first' }, { value: 'oldest', label: 'Oldest first' }, { value: 'title', label: 'Title A–Z' }];
const BADGE = { published: ['Published', 'bg-green-50 text-green-800'], draft: ['Draft', 'bg-surface text-ink-muted'], archived: ['Archived', 'bg-amber-50 text-amber-800'] };

export default function AdminBlogs() {
  useDocumentTitle('Stories');
  const location = useLocation();
  const { params, update, clearAll } = useQueryParams();
  const q = params.get('q') ?? '';
  const status = ['draft', 'published', 'archived'].includes(params.get('status')) ? params.get('status') : '';
  const category = params.get('category') ?? '';
  const sort = SORTS.some((s) => s.value === params.get('sort')) ? params.get('sort') : 'newest';
  const page = Math.max(1, parseInt(params.get('page'), 10) || 1);

  const cats = useApi((s) => getCategories(s), []);
  const { data, meta, loading, error, reload } = useApi((s) => listAdminBlogs({ q, status, category, sort, page, limit: PAGE_SIZE }, s), [q, status, category, sort, page]);
  const items = data ?? [];

  const [flash, setFlash] = useState(location.state?.flash ?? '');
  const [actionError, setActionError] = useState('');
  const [busyId, setBusyId] = useState(null);
  const [target, setTarget] = useState(null);
  const [dialogError, setDialogError] = useState('');

  const run = async (blog, action, message, { inDialog = false } = {}) => {
    setBusyId(blog._id);
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

  const togglePublish = (b) => {
    const next = b.status === 'published' ? 'draft' : 'published';
    return run(b, () => updateBlog(b._id, { status: next }), next === 'published' ? `“${b.title}” published.` : `“${b.title}” unpublished. It is now a draft.`);
  };

  const pill = (active) => `chip ${active ? '!border-ink !bg-ink !text-white' : ''}`;
  const filtered = Boolean(q || status || category);
  const change = (patch) => (setFlash(''), setActionError(''), update(patch));

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Stories</h2>
          <p className="mt-1 text-ink-muted">Only administrators can write and publish stories.</p>
        </div>
        <Link to="/admin/blogs/new" className="btn-primary"><Plus className="h-4 w-4" aria-hidden="true" /> New story</Link>
      </div>

      {flash && <p role="status" className="mt-4 rounded-xl bg-green-50 px-4 py-3 text-sm text-green-800">{flash}</p>}
      {actionError && <p role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{actionError}</p>}

      <SearchPill key={q} initialValue={q} onSearch={(v) => change({ q: v })} placeholder="Search stories" className="mt-6 max-w-xl" />
      <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-3">
        <ul className="flex flex-wrap gap-2" aria-label="Filter by status">
          {STATUSES.map((s) => (
            <li key={s.label}><button type="button" onClick={() => change({ status: s.value })} aria-pressed={status === s.value} className={pill(status === s.value)}>{s.label}</button></li>
          ))}
        </ul>
        <div className="flex items-center gap-2">
          <label htmlFor="bl-category" className="text-sm text-ink-muted">Category</label>
          <select id="bl-category" value={category} onChange={(e) => change({ category: e.target.value })} className="rounded-full border border-line bg-white px-4 py-2 text-sm focus:border-ink focus:outline-none">
            <option value="">All categories</option>
            {(cats.data ?? []).map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label htmlFor="bl-sort" className="text-sm text-ink-muted">Sort by</label>
          <select id="bl-sort" value={sort} onChange={(e) => change({ sort: e.target.value === 'newest' ? '' : e.target.value })} className="rounded-full border border-line bg-white px-4 py-2 text-sm focus:border-ink focus:outline-none">
            {SORTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>
      </div>

      <div className="mt-4 flex min-h-8 items-center gap-3 text-sm text-ink-muted" aria-live="polite">
        {!loading && !error && meta && <span>{meta.total} {meta.total === 1 ? 'story' : 'stories'}</span>}
        {filtered && <button type="button" onClick={clearAll} className="rounded-full border border-line px-3 py-1 hover:border-ink">Clear filters</button>}
      </div>

      <div className="mt-2">
        {loading && <div className="h-40 animate-pulse rounded-card bg-surface" aria-busy="true" />}
        {!loading && error && <ErrorState error={error} onRetry={reload} />}
        {!loading && !error && items.length === 0 && (
          <EmptyState
            title={page > 1 && meta?.total > 0 ? 'That page is out of range' : filtered ? 'No stories match' : 'No stories yet'}
            text={page > 1 && meta?.total > 0 ? 'Go back to the first page.' : filtered ? 'Try a different search or filter.' : 'Write the first story to get started.'}
          />
        )}
        {!loading && !error && items.length > 0 && (
          <>
            <ul className="space-y-3">
              {items.map((b) => {
                const [label, cls] = BADGE[b.status] ?? BADGE.draft;
                return (
                  <li key={b._id} className="flex flex-col gap-3 rounded-card border border-line p-3 lg:flex-row lg:items-center">
                    <div className="flex min-w-0 flex-1 items-center gap-4">
                      <MediaThumb item={{ mediaType: 'image', mediaUrl: b.coverImageUrl }} className="h-16 w-20 shrink-0 rounded-xl" />
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <Link to={`/admin/blogs/${b._id}/edit`} className="truncate font-semibold hover:underline">{b.title}</Link>
                          <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${cls}`}>{label}</span>
                        </div>
                        <p className="truncate text-sm text-ink-muted">{b.category?.name ?? 'No category'} · /{b.slug} · Updated {formatDate(b.updatedAt)}</p>
                        {b.tags?.length > 0 && <p className="truncate text-xs text-ink-muted">{b.tags.map((t) => `#${t}`).join(' ')}</p>}
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Link to={`/admin/blogs/${b._id}/edit`} className="btn-secondary !px-3 !py-1.5" aria-label={`Edit ${b.title}`}>Edit</Link>
                      <Link to={`/admin/blogs/${b._id}/preview`} className="btn-secondary !px-3 !py-1.5" aria-label={`Preview ${b.title}`}>Preview</Link>
                      <button type="button" disabled={busyId === b._id} onClick={() => togglePublish(b)} className="btn-secondary !px-3 !py-1.5" aria-label={`${b.status === 'published' ? 'Unpublish' : 'Publish'} ${b.title}`}>{b.status === 'published' ? 'Unpublish' : 'Publish'}</button>
                      <button type="button" disabled={busyId === b._id} onClick={() => (setDialogError(''), setTarget(b))} className="btn-ghost !px-3 !py-1.5 text-red-700" aria-label={`Delete ${b.title}`}>Delete</button>
                    </div>
                  </li>
                );
              })}
            </ul>
            <Pagination page={meta?.page ?? page} totalPages={meta?.totalPages ?? 1} onChange={(p) => update({ page: p > 1 ? p : '' }, { keepPage: true })} />
          </>
        )}
      </div>

      {target && (
        <ConfirmDialog title="Delete this story?" message={`“${target.title}” and its cover image will be permanently removed. This can't be undone.`} busy={busyId === target._id} error={dialogError}
          onConfirm={() => run(target, () => deleteBlog(target._id), `“${target.title}” deleted.`, { inDialog: true })} onCancel={() => setTarget(null)} />
      )}
    </div>
  );
}
