import { Link, useParams } from 'react-router-dom';
import { ErrorState } from '../../components/States.jsx';
import RecipeView from '../../features/recipes/RecipeView.jsx';
import { useApi } from '../../hooks/useApi.js';
import { useDocumentTitle } from '../../hooks/useDocumentTitle.js';
import { getAdminRecipe } from '../../services/adminRecipes.js';
import { getCategories } from '../../services/content.js';
import { recipeMissing, RecipeNotFound } from './RecipeEditor.jsx';

/** Shows a recipe exactly as visitors will see it, including drafts (which are not public). */
export default function RecipePreview() {
  const { id } = useParams();
  const rec = useApi((s) => getAdminRecipe(id, s), [id]);
  const cats = useApi((s) => getCategories(s), []);
  useDocumentTitle(rec.data ? `Preview: ${rec.data.title}` : 'Preview');

  if (rec.loading || cats.loading) return <div className="h-64 animate-pulse rounded-card bg-surface" aria-busy="true" />;
  if (recipeMissing(rec.error)) return <RecipeNotFound />;
  if (rec.error) return <ErrorState error={rec.error} onRetry={rec.reload} />;

  const recipe = { ...rec.data, category: (cats.data ?? []).find((c) => c._id === rec.data.category) ?? null };
  const published = recipe.status === 'published';

  return (
    <div className="-mx-4 sm:-mx-6 lg:-mx-10">
      <div role="note" className="flex flex-wrap items-center justify-between gap-3 border-y border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 sm:px-6 lg:px-10">
        <p>
          <strong>Preview.</strong> {published ? 'This recipe is published.' : 'This recipe is a draft and is not visible to the public.'}
        </p>
        <div className="flex gap-2">
          <Link to={`/admin/recipes/${id}/edit`} className="btn-secondary !py-1.5">
            Edit
          </Link>
          <Link to="/admin/recipes" className="btn-secondary !py-1.5">
            Back to recipes
          </Link>
        </div>
      </div>
      <RecipeView recipe={recipe} related={[]} showShare={false} />
    </div>
  );
}
