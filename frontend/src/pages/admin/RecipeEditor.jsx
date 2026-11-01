import { ChevronLeft } from 'lucide-react';
import { useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { ErrorState } from '../../components/States.jsx';
import RecipeForm from '../../features/admin/RecipeForm.jsx';
import { emptyRecipe, toFormValues } from '../../features/admin/recipeForm.js';
import { useApi } from '../../hooks/useApi.js';
import { useDocumentTitle } from '../../hooks/useDocumentTitle.js';
import { createRecipe, getAdminRecipe, setRecipeFeatured, setRecipeStatus, updateRecipe } from '../../services/adminRecipes.js';
import { getCategories } from '../../services/content.js';

export function RecipeNotFound() {
  return (
    <div className="rounded-card bg-surface px-6 py-12 text-center">
      <h2 className="text-xl font-bold tracking-tight">Recipe not found</h2>
      <p className="mt-1 text-ink-muted">It may have been deleted.</p>
      <Link to="/admin/recipes" className="btn-primary mt-5">
        Back to recipes
      </Link>
    </div>
  );
}
export const recipeMissing = (e) => e?.status === 404 || e?.code === 'INVALID_ID';

function Editor({ id }) {
  const mode = id ? 'edit' : 'create';
  const navigate = useNavigate();
  const location = useLocation();
  const cats = useApi((s) => getCategories(s), []);
  const loaded = useApi((s) => (id ? getAdminRecipe(id, s) : Promise.resolve({ data: null })), [id]);
  const [saved, setSaved] = useState(null); // latest server copy after an edit
  const [flash, setFlash] = useState(location.state?.flash ?? '');
  useDocumentTitle(mode === 'create' ? 'New recipe' : 'Edit recipe');

  if (loaded.loading || cats.loading) return <div className="h-64 animate-pulse rounded-card bg-surface" aria-busy="true" />;
  if (recipeMissing(loaded.error)) return <RecipeNotFound />;
  if (loaded.error) return <ErrorState error={loaded.error} onRetry={loaded.reload} />;
  if (cats.error) return <ErrorState error={cats.error} onRetry={cats.reload} />;

  const recipe = saved ?? loaded.data;
  if (mode === 'edit' && !recipe) return <div className="h-64 animate-pulse rounded-card bg-surface" aria-busy="true" />;

  const onSave = async (payload, values) => {
    setFlash('');
    if (mode === 'create') {
      const res = await createRecipe({ ...payload, status: values.status, isFeatured: values.isFeatured });
      navigate(`/admin/recipes/${res.data._id}/edit`, { replace: true, state: { flash: 'Recipe created.' } });
      return;
    }
    let result = (await updateRecipe(id, payload)).data;
    try {
      if (values.status !== result.status) result = (await setRecipeStatus(id, values.status)).data;
      if (values.isFeatured !== result.isFeatured) result = (await setRecipeFeatured(id, values.isFeatured)).data;
    } catch (err) {
      setSaved(result);
      throw new Error(`Your changes were saved, but updating the status or featured flag failed: ${err.message}`);
    }
    setSaved(result);
    setFlash(result.status === 'published' ? 'Changes saved. This recipe is published.' : 'Changes saved.');
    window.scrollTo?.({ top: 0 });
  };

  return (
    <div>
      <Link to="/admin/recipes" className="inline-flex items-center gap-1 text-sm text-ink-muted hover:text-ink">
        <ChevronLeft className="h-4 w-4" aria-hidden="true" /> Recipes
      </Link>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-2xl font-bold tracking-tight">{mode === 'create' ? 'New recipe' : 'Edit recipe'}</h2>
        {mode === 'edit' && (
          <div className="flex flex-wrap gap-2">
            <Link to={`/admin/recipes/${id}/preview`} className="btn-secondary">
              Preview
            </Link>
            {recipe.status === 'published' && (
              <Link to={`/recipes/${recipe.slug}`} className="btn-secondary">
                View public page
              </Link>
            )}
          </div>
        )}
      </div>

      {flash && (
        <p role="status" className="mt-4 rounded-xl bg-green-50 px-4 py-3 text-sm text-green-800">
          {flash}
        </p>
      )}

      <div className="mt-6">
        <RecipeForm key={recipe?.updatedAt ?? 'new'} mode={mode} defaults={recipe ? toFormValues(recipe) : emptyRecipe} categories={cats.data ?? []} onSave={onSave} cancelTo="/admin/recipes" />
      </div>
    </div>
  );
}

/** Keyed by id so moving from /new to /:id/edit (after creating) always starts from a clean state. */
export default function RecipeEditor() {
  const { id } = useParams();
  return <Editor key={id ?? 'new'} id={id} />;
}
