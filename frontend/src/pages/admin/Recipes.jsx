import { Plus, Star } from 'lucide-react';
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
import { deleteRecipe, listAdminRecipes, setRecipeFeatured, setRecipeStatus } from '../../services/adminRecipes.js';
import { getCategories } from '../../services/content.js';
import { formatDate } from '../../utils/format.js';

const PAGE_SIZE = 20;
const STATUSES = [
  { value: '', label: 'All' },
  { value: 'draft', label: 'Drafts' },
  { value: 'published', label: 'Published' },
];
const SORTS = [
  { value: 'newest', label: 'Newest first' },
  { value: 'oldest', label: 'Oldest first' },
  { value: 'title', label: 'Title A–Z' },
];

export default function AdminRecipes() {
  useDocumentTitle('Recipes');
  const location = useLocation();
  const { params, update, clearAll } = useQueryParams();
  const q = params.get('q') ?? '';
  const status = ['draft', 'published'].includes(params.get('status')) ? params.get('status') : '';
  const category = params.get('category') ?? '';
  const featured = params.get('featured') === 'true' ? 'true' : '';
  const sort = SORTS.some((s) => s.value === params.get('sort')) ? params.get('sort') : 'newest';
  const page = Math.max(1, parseInt(params.get('page'), 10) || 1);

  const cats = useApi((s) => getCategories(s), []);
  const { data, meta, loading, error, reload } = useApi((s) => listAdminRecipes({ q, status, category, featured, sort, page, limit: PAGE_SIZE }, s), [q, status, category, featured, sort, page]);
  const items = data ?? [];

  const [flash, setFlash] = useState(location.state?.flash ?? '');
  const [actionError, setActionError] = useState('');
  const [busyId, setBusyId] = useState(null);
  const [target, setTarget] = useState(null);
  const [dialogError, setDialogError] = useState('');

  const run = async (recipe, action, message, { inDialog = false } = {}) => {
    setBusyId(recipe._id);
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

  const togglePublish = (r) => {
    const next = r.status === 'published' ? 'draft' : 'published';
    return run(r, () => setRecipeStatus(r._id, next), next === 'published' ? `“${r.title}” published.` : `“${r.title}” unpublished. It is now a draft.`);
  };
  const toggleFeature = (r) => run(r, () => setRecipeFeatured(r._id, !r.isFeatured), r.isFeatured ? `“${r.title}” removed from featured.` : `“${r.title}” featured on the homepage.`);

  const pill = (active) => `chip ${active ? '!border-ink !bg-ink !text-white' : ''}`;
  const filtered = Boolean(q || status || category || featured);
  const change = (patch) => (setFlash(''), setActionError(''), update(patch));

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Recipes</h2>
          <p className="mt-1 text-ink-muted">Only administrators can create, edit and publish recipes.</p>
        </div>
        <Link to="/admin/recipes/new" className="btn-primary">
          <Plus className="h-4 w-4" aria-hidden="true" /> New recipe
        </Link>
      </div>

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

      <SearchPill key={q} initialValue={q} onSearch={(value) => change({ q: value })} placeholder="Search recipes" className="mt-6 max-w-xl" />
      <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-3">
        <ul className="flex flex-wrap gap-2" aria-label="Filter by status">
          {STATUSES.map((s) => (
            <li key={s.label}>
              <button type="button" onClick={() => change({ status: s.value })} aria-pressed={status === s.value} className={pill(status === s.value)}>
                {s.label}
              </button>
            </li>
          ))}
          <li>
            <button type="button" onClick={() => change({ featured: featured ? '' : 'true' })} aria-pressed={Boolean(featured)} className={pill(Boolean(featured))}>
              Featured only
            </button>
          </li>
        </ul>
        <div className="flex items-center gap-2">
          <label htmlFor="rl-category" className="text-sm text-ink-muted">
            Category
          </label>
          <select id="rl-category" value={category} onChange={(e) => change({ category: e.target.value })} className="rounded-full border border-line bg-white px-4 py-2 text-sm focus:border-ink focus:outline-none">
            <option value="">All categories</option>
            {(cats.data ?? []).map((c) => (
              <option key={c._id} value={c._id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label htmlFor="rl-sort" className="text-sm text-ink-muted">
            Sort by
          </label>
          <select id="rl-sort" value={sort} onChange={(e) => change({ sort: e.target.value === 'newest' ? '' : e.target.value })} className="rounded-full border border-line bg-white px-4 py-2 text-sm focus:border-ink focus:outline-none">
            {SORTS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-4 flex min-h-8 items-center gap-3 text-sm text-ink-muted" aria-live="polite">
        {!loading && !error && meta && <span>{meta.total} {meta.total === 1 ? 'recipe' : 'recipes'}</span>}
        {filtered && (
          <button type="button" onClick={clearAll} className="rounded-full border border-line px-3 py-1 hover:border-ink">
            Clear filters
          </button>
        )}
      </div>

      <div className="mt-2">
        {loading && <div className="h-40 animate-pulse rounded-card bg-surface" aria-busy="true" />}
        {!loading && error && <ErrorState error={error} onRetry={reload} />}
        {!loading && !error && items.length === 0 && (
          <EmptyState
            title={page > 1 && meta?.total > 0 ? 'That page is out of range' : filtered ? 'No recipes match' : 'No recipes yet'}
            text={page > 1 && meta?.total > 0 ? 'Go back to the first page.' : filtered ? 'Try a different search or filter.' : 'Create the first recipe to get started.'}
          />
        )}
        {!loading && !error && items.length > 0 && (
          <>
            <ul className="space-y-3">
              {items.map((r) => (
                <li key={r._id} className="flex flex-col gap-3 rounded-card border border-line p-3 lg:flex-row lg:items-center">
                  <div className="flex min-w-0 flex-1 items-center gap-4">
                    <MediaThumb item={{ mediaType: 'image', mediaUrl: r.coverImageUrl }} className="h-16 w-20 shrink-0 rounded-xl" />
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <Link to={`/admin/recipes/${r._id}/edit`} className="truncate font-semibold hover:underline">
                          {r.title}
                        </Link>
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${r.status === 'published' ? 'bg-green-50 text-green-800' : 'bg-surface text-ink-muted'}`}>{r.status === 'published' ? 'Published' : 'Draft'}</span>
                        {r.isFeatured && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-brand-soft px-2.5 py-0.5 text-xs font-semibold text-brand">
                            <Star className="h-3 w-3" aria-hidden="true" /> Featured
                          </span>
                        )}
                      </div>
                      <p className="truncate text-sm text-ink-muted">
                        {r.category?.name ?? 'No category'} · /{r.slug} · Updated {formatDate(r.updatedAt)}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Link to={`/admin/recipes/${r._id}/edit`} className="btn-secondary !px-3 !py-1.5" aria-label={`Edit ${r.title}`}>
                      Edit
                    </Link>
                    <Link to={`/admin/recipes/${r._id}/preview`} className="btn-secondary !px-3 !py-1.5" aria-label={`Preview ${r.title}`}>
                      Preview
                    </Link>
                    <button type="button" disabled={busyId === r._id} onClick={() => togglePublish(r)} className="btn-secondary !px-3 !py-1.5" aria-label={`${r.status === 'published' ? 'Unpublish' : 'Publish'} ${r.title}`}>
                      {r.status === 'published' ? 'Unpublish' : 'Publish'}
                    </button>
                    <button type="button" disabled={busyId === r._id} onClick={() => toggleFeature(r)} className="btn-secondary !px-3 !py-1.5" aria-label={`${r.isFeatured ? 'Unfeature' : 'Feature'} ${r.title}`}>
                      {r.isFeatured ? 'Unfeature' : 'Feature'}
                    </button>
                    <button type="button" disabled={busyId === r._id} onClick={() => (setDialogError(''), setTarget(r))} className="btn-ghost !px-3 !py-1.5 text-red-700" aria-label={`Delete ${r.title}`}>
                      Delete
                    </button>
                  </div>
                </li>
              ))}
            </ul>
            <Pagination page={meta?.page ?? page} totalPages={meta?.totalPages ?? 1} onChange={(p) => update({ page: p > 1 ? p : '' }, { keepPage: true })} />
          </>
        )}
      </div>

      {target && (
        <ConfirmDialog
          title="Delete this recipe?"
          message={`“${target.title}” and its uploaded images will be permanently removed. This can't be undone.`}
          busy={busyId === target._id}
          error={dialogError}
          onConfirm={() => run(target, () => deleteRecipe(target._id), `“${target.title}” deleted.`, { inDialog: true })}
          onCancel={() => setTarget(null)}
        />
      )}
    </div>
  );
}
