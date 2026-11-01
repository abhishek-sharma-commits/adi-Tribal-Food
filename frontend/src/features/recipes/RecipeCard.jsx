import { Clock, UtensilsCrossed } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatMinutes } from '../../utils/format.js';

export default function RecipeCard({ recipe }) {
  const time = formatMinutes((recipe.preparationTime ?? 0) + (recipe.cookingTime ?? 0));
  return (
    <Link to={`/recipes/${recipe.slug}`} className="group block">
      <div className="aspect-[4/3] overflow-hidden rounded-card bg-surface">
        {recipe.coverImageUrl ? (
          <img src={recipe.coverImageUrl} alt={recipe.title} loading="lazy" className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-ink-muted" aria-hidden="true">
            <UtensilsCrossed className="h-8 w-8" />
          </div>
        )}
      </div>
      <div className="mt-3">
        {recipe.category?.name && <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">{recipe.category.name}</p>}
        <h3 className="mt-0.5 line-clamp-1 font-semibold">{recipe.title}</h3>
        {recipe.shortDescription && <p className="mt-0.5 line-clamp-2 text-sm text-ink-muted">{recipe.shortDescription}</p>}
        {time && (
          <p className="mt-1.5 inline-flex items-center gap-1 text-sm text-ink-muted">
            <Clock className="h-3.5 w-3.5" aria-hidden="true" /> {time}
          </p>
        )}
      </div>
    </Link>
  );
}
