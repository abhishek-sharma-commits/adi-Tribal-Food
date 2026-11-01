import { Link, useParams } from 'react-router-dom';
import { ErrorState } from '../components/States.jsx';
import RecipeView from '../features/recipes/RecipeView.jsx';
import { useApi } from '../hooks/useApi.js';
import { useDocumentTitle } from '../hooks/useDocumentTitle.js';
import { getRecipe } from '../services/content.js';

function Skeleton() {
  return (
    <div className="container-page animate-pulse py-8" aria-busy="true" aria-label="Loading recipe">
      <div className="h-4 w-48 rounded bg-surface" />
      <div className="mt-4 h-10 w-2/3 rounded bg-surface" />
      <div className="mt-6 aspect-[16/9] w-full rounded-3xl bg-surface" />
    </div>
  );
}

function NotFound() {
  return (
    <div className="container-page flex flex-col items-center py-24 text-center">
      <h1 className="text-3xl font-bold tracking-tight">Recipe not found</h1>
      <p className="mt-2 text-ink-muted">This recipe doesn't exist or hasn't been published.</p>
      <Link to="/recipes" className="btn-primary mt-6">
        Browse all recipes
      </Link>
    </div>
  );
}

export default function RecipeDetail() {
  const { slug } = useParams();
  const { data, loading, error, reload } = useApi((s) => getRecipe(slug, s), [slug]);
  useDocumentTitle(data?.recipe?.title);

  if (loading) return <Skeleton />;
  if (error?.status === 404) return <NotFound />;
  if (error) {
    return (
      <div className="container-page py-16">
        <ErrorState error={error} onRetry={reload} />
      </div>
    );
  }
  return <RecipeView recipe={data.recipe} related={data.related ?? []} />;
}
