import { X } from 'lucide-react';
import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import Pagination from '../components/Pagination.jsx';
import SearchPill from '../components/SearchPill.jsx';
import { CardSkeleton, EmptyState, ErrorState } from '../components/States.jsx';
import RecipeCard from '../features/recipes/RecipeCard.jsx';
import RecipeFilters from '../features/recipes/RecipeFilters.jsx';
import { useApi } from '../hooks/useApi.js';
import { useDocumentTitle } from '../hooks/useDocumentTitle.js';
import { getCategories, listRecipes } from '../services/content.js';

const PAGE_SIZE = 12;

export default function Recipes() {
  useDocumentTitle('Explore Recipes');
  const [params, setParams] = useSearchParams();
  const q = params.get('q') ?? '';
  const category = params.get('category') ?? '';
  const sort = params.get('sort') === 'featured' ? 'featured' : 'newest';
  const page = Math.max(1, parseInt(params.get('page'), 10) || 1);

  const cats = useApi((s) => getCategories(s), []);
  const recipes = useApi((s) => listRecipes({ q, category, sort, page, limit: PAGE_SIZE }, s), [q, category, sort, page]);

  // Any filter change goes through the URL so results are shareable and the back button works.
  const update = (patch, { keepPage = false } = {}) => {
    const next = new URLSearchParams(params);
    for (const [key, value] of Object.entries(patch)) {
      if (!value || (key === 'sort' && value === 'newest')) next.delete(key);
      else next.set(key, String(value));
    }
    if (!keepPage) next.delete('page');
    setParams(next);
  };

  const goToPage = (p) => update({ page: p > 1 ? p : '' }, { keepPage: true });
  const clearAll = () => setParams(new URLSearchParams());

  useEffect(() => {
    window.scrollTo?.({ top: 0 });
  }, [page]);

  const categoryName = cats.data?.find((c) => c.slug === category)?.name;
  const items = recipes.data ?? [];
  const meta = recipes.meta;
  const filtered = Boolean(q || category);

  return (
    <div className="container-page py-8 sm:py-12">
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Explore Recipes</h1>
      <p className="mt-2 max-w-2xl text-ink-muted">Traditional dishes, drinks and preserved foods of the Adi community, documented by our editors.</p>

      <SearchPill key={q} initialValue={q} onSearch={(value) => update({ q: value })} className="mt-6 max-w-2xl" />

      <div className="mt-6">
        <RecipeFilters categories={cats.data ?? []} category={category} sort={sort} onCategory={(c) => update({ category: c })} onSort={(s) => update({ sort: s })} />
      </div>

      <div className="mt-6 flex min-h-8 flex-wrap items-center gap-3" aria-live="polite">
        {!recipes.loading && !recipes.error && meta && (
          <p className="text-sm text-ink-muted">
            {meta.total} {meta.total === 1 ? 'recipe' : 'recipes'}
            {q && <> for “{q}”</>}
            {category && <> in {categoryName ?? category}</>}
          </p>
        )}
        {filtered && (
          <button type="button" onClick={clearAll} className="inline-flex items-center gap-1 rounded-full border border-line px-3 py-1 text-sm hover:border-ink">
            <X className="h-3.5 w-3.5" aria-hidden="true" /> Clear filters
          </button>
        )}
      </div>

      <div className="mt-4">
        {recipes.loading && (
          <div className="grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-4" aria-busy="true">
            {Array.from({ length: 8 }, (_, i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        )}

        {!recipes.loading && recipes.error && <ErrorState error={recipes.error} onRetry={recipes.reload} />}

        {!recipes.loading && !recipes.error && items.length === 0 && (
          <EmptyState
            title={page > 1 && meta?.total > 0 ? 'That page is out of range' : filtered ? 'No recipes match your search' : 'No recipes have been published yet'}
            text={page > 1 && meta?.total > 0 ? 'Go back to the first page to see the results.' : filtered ? 'Try a different ingredient, or clear the filters.' : 'Check back soon.'}
          />
        )}

        {!recipes.loading && !recipes.error && items.length > 0 && (
          <>
            <ul className="grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
              {items.map((r) => (
                <li key={r._id}>
                  <RecipeCard recipe={r} />
                </li>
              ))}
            </ul>
            <Pagination page={meta?.page ?? page} totalPages={meta?.totalPages ?? 1} onChange={goToPage} />
          </>
        )}
      </div>
    </div>
  );
}
