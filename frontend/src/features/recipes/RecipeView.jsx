import { ChevronRight, Clock, Users, UtensilsCrossed } from 'lucide-react';
import { Link } from 'react-router-dom';
import ShareButton from '../../components/ShareButton.jsx';
import { formatMinutes } from '../../utils/format.js';
import MediaGallery from './MediaGallery.jsx';
import RecipeCard from './RecipeCard.jsx';

const paragraphs = (text) => (text ?? '').split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);

function Meta({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-2 rounded-full bg-surface px-4 py-2 text-sm">
      <Icon className="h-4 w-4 text-ink-muted" aria-hidden="true" />
      <span className="text-ink-muted">{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}

/** The recipe page layout. Sections the recipe doesn't document are left out entirely. */
export default function RecipeView({ recipe, related = [], showShare = true }) {
  const description = paragraphs(recipe.description);
  const notes = paragraphs(recipe.culturalNotes);
  const total = (recipe.preparationTime ?? 0) + (recipe.cookingTime ?? 0);

  return (
    <article className="container-page py-8 sm:py-10">
      <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-sm text-ink-muted">
        <Link to="/recipes" className="hover:text-ink hover:underline">
          Recipes
        </Link>
        {recipe.category && (
          <>
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
            <Link to={`/recipes?category=${recipe.category.slug}`} className="hover:text-ink hover:underline">
              {recipe.category.name}
            </Link>
          </>
        )}
      </nav>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-3xl">
          <h1 className="text-3xl font-bold tracking-tight sm:text-5xl">{recipe.title}</h1>
          {recipe.shortDescription && <p className="mt-3 text-lg text-ink-muted">{recipe.shortDescription}</p>}
        </div>
        {showShare && <ShareButton title={recipe.title} />}
      </div>

      <div className="mt-5 flex flex-wrap gap-3">
        {recipe.preparationTime > 0 && <Meta icon={Clock} label="Prep" value={formatMinutes(recipe.preparationTime)} />}
        {recipe.cookingTime > 0 && <Meta icon={Clock} label="Cook" value={formatMinutes(recipe.cookingTime)} />}
        {recipe.preparationTime > 0 && recipe.cookingTime > 0 && <Meta icon={Clock} label="Total" value={formatMinutes(total)} />}
        {recipe.servings > 0 && <Meta icon={Users} label="Serves" value={recipe.servings} />}
      </div>

      {recipe.coverImageUrl ? (
        <img src={recipe.coverImageUrl} alt={recipe.title} className="mt-8 aspect-[16/9] w-full rounded-3xl bg-surface object-cover" />
      ) : (
        <div className="mt-8 flex aspect-[16/9] w-full items-center justify-center rounded-3xl bg-surface text-ink-muted" aria-hidden="true">
          <UtensilsCrossed className="h-10 w-10" />
        </div>
      )}

      <MediaGallery media={recipe.media} title={recipe.title} />

      <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-16">
        <div className="space-y-10 lg:order-1">
          {description.length > 0 && (
            <section aria-labelledby="about-heading">
              <h2 id="about-heading" className="text-2xl font-bold tracking-tight">
                About this recipe
              </h2>
              <div className="mt-3 space-y-4 text-base leading-relaxed text-ink">
                {description.map((p, i) => (
                  <p key={i} className="whitespace-pre-line">
                    {p}
                  </p>
                ))}
              </div>
            </section>
          )}

          {recipe.instructions?.length > 0 && (
            <section aria-labelledby="method-heading">
              <h2 id="method-heading" className="text-2xl font-bold tracking-tight">
                Method
              </h2>
              <ol className="mt-4 space-y-6">
                {recipe.instructions.map((step, i) => (
                  <li key={i} className="flex gap-4">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ink text-sm font-semibold text-white" aria-hidden="true">
                      {i + 1}
                    </span>
                    <p className="whitespace-pre-line pt-0.5 text-base leading-relaxed">{step.text}</p>
                  </li>
                ))}
              </ol>
            </section>
          )}

          {notes.length > 0 && (
            <section aria-labelledby="culture-heading" className="rounded-card bg-surface p-6">
              <h2 id="culture-heading" className="text-xl font-bold tracking-tight">
                Cultural context
              </h2>
              <div className="mt-3 space-y-3 leading-relaxed">
                {notes.map((p, i) => (
                  <p key={i} className="whitespace-pre-line">
                    {p}
                  </p>
                ))}
              </div>
            </section>
          )}
        </div>

        {recipe.ingredients?.length > 0 && (
          <aside aria-labelledby="ingredients-heading" className="lg:order-2">
            <div className="rounded-card border border-line p-6 lg:sticky lg:top-24">
              <h2 id="ingredients-heading" className="text-xl font-bold tracking-tight">
                Ingredients
              </h2>
              <ul className="mt-4 divide-y divide-line">
                {recipe.ingredients.map((ing, i) => (
                  <li key={i} className="flex items-baseline justify-between gap-4 py-2.5 text-sm">
                    <span>{ing.name}</span>
                    {(ing.quantity || ing.unit) && <span className="shrink-0 font-semibold">{[ing.quantity, ing.unit].filter(Boolean).join(' ')}</span>}
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        )}
      </div>

      {related.length > 0 && (
        <section aria-labelledby="related-heading" className="mt-16 border-t border-line pt-10">
          <h2 id="related-heading" className="text-2xl font-bold tracking-tight">
            Related recipes
          </h2>
          <ul className="mt-6 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
            {related.map((r) => (
              <li key={r._id}>
                <RecipeCard recipe={r} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </article>
  );
}
