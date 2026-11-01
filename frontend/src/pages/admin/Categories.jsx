import { Plus } from 'lucide-react';
import { useState } from 'react';
import ConfirmDialog from '../../components/ConfirmDialog.jsx';
import { EmptyState, ErrorState } from '../../components/States.jsx';
import CategoryDialog from '../../features/admin/CategoryDialog.jsx';
import { useApi } from '../../hooks/useApi.js';
import { useDocumentTitle } from '../../hooks/useDocumentTitle.js';
import { deleteCategory, listAdminCategories } from '../../services/adminCategories.js';

const LABELS = [['recipes', 'Recipes'], ['blogs', 'Stories'], ['submissions', 'Submissions'], ['media', 'Media']];
const inUse = (u) => LABELS.filter(([k]) => u[k] > 0).map(([k, l]) => `${u[k]} ${l.toLowerCase()}`);

export default function AdminCategories() {
  useDocumentTitle('Categories');
  const { data, loading, error, reload } = useApi((s) => listAdminCategories(s), []);
  const items = data ?? [];
  const [dialog, setDialog] = useState(null); // { category? } for create/edit
  const [target, setTarget] = useState(null);
  const [busy, setBusy] = useState(false);
  const [dialogError, setDialogError] = useState('');
  const [flash, setFlash] = useState('');

  const remove = async () => {
    setBusy(true);
    setDialogError('');
    try {
      await deleteCategory(target._id);
      setFlash(`“${target.name}” deleted.`);
      setTarget(null);
      reload();
    } catch (err) {
      setDialogError(err.code === 'CATEGORY_IN_USE' ? `${err.message}` : err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Categories</h2>
          <p className="mt-1 text-ink-muted">These appear on the homepage and as filters across recipes, stories and the gallery.</p>
        </div>
        <button type="button" onClick={() => (setFlash(''), setDialog({}))} className="btn-primary"><Plus className="h-4 w-4" aria-hidden="true" /> New category</button>
      </div>

      {flash && <p role="status" className="mt-4 rounded-xl bg-green-50 px-4 py-3 text-sm text-green-800">{flash}</p>}

      <div className="mt-6">
        {loading && <div className="h-40 animate-pulse rounded-card bg-surface" aria-busy="true" />}
        {!loading && error && <ErrorState error={error} onRetry={reload} />}
        {!loading && !error && items.length === 0 && <EmptyState title="No categories yet" text="Create the first category." />}
        {!loading && !error && items.length > 0 && (
          <ul className="divide-y divide-line rounded-card border border-line">
            {items.map((c) => {
              const used = inUse(c.usage);
              return (
                <li key={c._id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="font-semibold">{c.name}</p>
                    <p className="text-sm text-ink-muted">/{c.slug}{c.description ? ` · ${c.description}` : ''}</p>
                    <p className="mt-1 text-xs text-ink-muted">{used.length ? `Used by ${used.join(', ')}` : 'Not used yet'}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={() => (setFlash(''), setDialog({ category: c }))} className="btn-secondary !px-3 !py-1.5" aria-label={`Edit ${c.name}`}>Edit</button>
                    <button type="button" onClick={() => (setFlash(''), setDialogError(''), setTarget(c))} disabled={used.length > 0} title={used.length ? 'Move or delete its content first' : undefined} className="btn-ghost !px-3 !py-1.5 text-red-700 disabled:opacity-40" aria-label={`Delete ${c.name}`}>Delete</button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {dialog && <CategoryDialog category={dialog.category} onClose={() => setDialog(null)} onSaved={(msg) => (setDialog(null), setFlash(msg), reload())} />}
      {target && <ConfirmDialog title="Delete this category?" message={`“${target.name}” will be removed from the site's filters. This can't be undone.`} busy={busy} error={dialogError} onConfirm={remove} onCancel={() => setTarget(null)} />}
    </div>
  );
}
