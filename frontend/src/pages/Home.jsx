import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AsyncSection from '../components/AsyncSection.jsx';
import SearchPill from '../components/SearchPill.jsx';
import BlogCard from '../features/blogs/BlogCard.jsx';
import GalleryTile from '../features/community/GalleryTile.jsx';
import MediaPreview from '../features/community/MediaPreview.jsx';
import RecipeCard from '../features/recipes/RecipeCard.jsx';
import { useApi } from '../hooks/useApi.js';
import { getCategories, listBlogs, listGallery, listOfficialMedia, listRecipes } from '../services/content.js';

const HERO_IMAGE = import.meta.env.VITE_HERO_IMAGE_URL;
const GRID_4 = 'grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-4';

function Hero() {
  const navigate = useNavigate();
  const search = (q) => navigate(q ? `/recipes?q=${encodeURIComponent(q)}` : '/recipes');
  const withImage = Boolean(HERO_IMAGE);

  return (
    <section className="container-page pt-6 sm:pt-8">
      <div
        className={`relative overflow-hidden rounded-3xl ${withImage ? 'text-white' : 'bg-surface text-ink'}`}
        style={withImage ? { backgroundImage: `url(${HERO_IMAGE})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}
      >
        {withImage && <div className="absolute inset-0 bg-black/45" aria-hidden="true" />}
        <div className="relative px-6 py-14 sm:px-12 sm:py-20 lg:py-28">
          <h1 className="max-w-3xl text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl lg:text-6xl">Discover the Flavours of the Adi Tribe</h1>
          <p className={`mt-4 max-w-2xl text-base sm:text-lg ${withImage ? 'text-white/90' : 'text-ink-muted'}`}>
            Traditional recipes, ingredients, food culture and stories from the Adi community of Arunachal Pradesh, documented with care and shared by the people who keep them alive.
          </p>
          <SearchPill onSearch={search} className="mt-8 max-w-2xl text-ink" />
          <div className="mt-6 flex flex-wrap gap-3">
            <Link to="/recipes" className="btn-primary">
              Explore Recipes
            </Link>
            <Link to="/register" className={withImage ? 'btn border border-white bg-transparent text-white hover:bg-white/10' : 'btn-secondary'}>
              Join the Community
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function Categories() {
  const { data, loading, error } = useApi((s) => getCategories(s), []);
  if (error || (!loading && !data?.length)) return null; // categories are a convenience; the sections below still work
  return (
    <section className="container-page pt-8" aria-label="Food categories">
      <ul className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0">
        {loading
          ? Array.from({ length: 6 }, (_, i) => <li key={i} className="h-10 w-32 shrink-0 animate-pulse rounded-full bg-surface" aria-hidden="true" />)
          : data.map((c) => (
              <li key={c._id}>
                <Link to={`/recipes?category=${c.slug}`} className="chip">
                  {c.name}
                </Link>
              </li>
            ))}
      </ul>
    </section>
  );
}

/** Official photos and videos the team has featured. Shown only when there are some, so no empty box on a new site. */
function FeaturedMedia() {
  const { data, loading, error } = useApi((s) => listOfficialMedia({ featured: true, limit: 8 }, s), []);
  const [open, setOpen] = useState(null);
  if (loading || error || !data?.length) return null;
  return (
    <section className="container-page py-10 sm:py-14" aria-labelledby="featured-media-heading">
      <h2 id="featured-media-heading" className="text-2xl font-bold tracking-tight sm:text-3xl">
        From our archive
      </h2>
      <p className="mt-1 text-ink-muted">Photographs and films curated by the Adi Food team</p>
      <ul className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {data.map((m, i) => (
          <li key={m._id}>
            <GalleryTile item={m} onOpen={() => setOpen(i)} />
          </li>
        ))}
      </ul>
      {open !== null && data[open] && <MediaPreview items={data} index={open} onClose={() => setOpen(null)} onIndex={setOpen} />}
    </section>
  );
}

export default function Home() {
  const featured = useApi((s) => listRecipes({ featured: true, limit: 8 }, s), []);
  const gallery = useApi((s) => listGallery({ limit: 8 }, s), []);
  const blogs = useApi((s) => listBlogs({ limit: 3 }, s), []);

  return (
    <>
      <Hero />
      <Categories />

      <AsyncSection
        title="Featured recipes"
        subtitle="Handpicked by our editors"
        linkTo="/recipes"
        linkLabel="Explore all recipes"
        query={featured}
        skeletons={4}
        grid={GRID_4}
        empty={{ title: 'No featured recipes yet', text: 'Recipes chosen by our editors will appear here.' }}
      >
        {(items) => items.map((r) => <RecipeCard key={r._id} recipe={r} />)}
      </AsyncSection>

      <FeaturedMedia />

      <AsyncSection
        title="From the community"
        subtitle="Photos and videos shared by our members"
        linkTo="/community"
        linkLabel="Visit the gallery"
        query={gallery}
        skeletons={4}
        ratio="aspect-square"
        grid="grid grid-cols-2 gap-4 lg:grid-cols-4"
        empty={{ title: 'No community uploads yet', text: 'Approved photos and videos will appear here.' }}
      >
        {(items) => items.map((g) => <GalleryTile key={g._id} item={g} />)}
      </AsyncSection>

      <AsyncSection
        title="Cultural stories"
        subtitle="Food, tradition and the people behind them"
        linkTo="/blogs"
        linkLabel="Read more stories"
        query={blogs}
        skeletons={3}
        ratio="aspect-[16/10]"
        grid="grid grid-cols-1 gap-x-6 gap-y-8 md:grid-cols-3"
        empty={{ title: 'No stories published yet', text: 'New stories will appear here.' }}
      >
        {(items) => items.map((b) => <BlogCard key={b._id} blog={b} />)}
      </AsyncSection>
    </>
  );
}
