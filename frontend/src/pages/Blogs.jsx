import { X } from 'lucide-react';
import { useEffect } from 'react';
import Pagination from '../components/Pagination.jsx';
import SearchPill from '../components/SearchPill.jsx';
import { CardSkeleton, EmptyState, ErrorState } from '../components/States.jsx';
import BlogCard from '../features/blogs/BlogCard.jsx';
import FeaturedBlog from '../features/blogs/FeaturedBlog.jsx';
import { useApi } from '../hooks/useApi.js';
import { useDocumentTitle } from '../hooks/useDocumentTitle.js';
import { useQueryParams } from '../hooks/useQueryParams.js';
import { getCategories, listBlogs } from '../services/content.js';

const PAGE_SIZE = 9;

export default function Blogs() {
  useDocumentTitle('Stories');
  const { params, update, clearAll } = useQueryParams();
  const q = params.get('q') ?? '';
  const category = params.get('category') ?? '';
  const tag = params.get('tag') ?? '';
  const page = Math.max(1, parseInt(params.get('page'), 10) || 1);

  const cats = useApi((s) => getCategories(s), []);
  const blogs = useApi((s) => listBlogs({ q, category, tag, page, limit: PAGE_SIZE }, s), [q, category, tag, page]);

  useEffect(() => {
    window.scrollTo?.({ top: 0 });
  }, [page]);

  const filtered = Boolean(q || category || tag);
  const items = blogs.data ?? [];
  const meta = blogs.meta;
  const showFeatured = page === 1 && !filtered && items.length > 0;
  const [featured, ...rest] = showFeatured ? items : [null, ...items];
  const gridItems = showFeatured ? rest : items;
  const categoryName = cats.data?.find((c) => c.slug === category)?.name;
  const pill = (active) => `chip ${active ? '!border-ink !bg-ink !text-white' : ''}`;

  return (
    <div className="container-page py-8 sm:py-12">
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Stories</h1>
      <p className="mt-2 max-w-2xl text-ink-muted">Food, tradition and the people who keep them alive.</p>

      <SearchPill key={q} initialValue={q} onSearch={(value) => update({ q: value })} placeholder="Search stories" className="mt-6 max-w-2xl" />

      {(cats.data?.length ?? 0) > 0 && (
        <ul className="-mx-4 mt-6 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0" aria-label="Filter by category">
          <li>
            <button type="button" onClick={() => update({ category: '' })} aria-pressed={!category} className={pill(!category)}>
              All
            </button>
          </li>
          {cats.data.map((c) => (
            <li key={c._id}>
              <button type="button" onClick={() => update({ category: c.slug })} aria-pressed={category === c.slug} className={pill(category === c.slug)}>
                {c.name}
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-6 flex min-h-8 flex-wrap items-center gap-3" aria-live="polite">
        {!blogs.loading && !blogs.error && meta && (
          <p className="text-sm text-ink-muted">
            {meta.total} {meta.total === 1 ? 'story' : 'stories'}
            {q && <> for “{q}”</>}
            {category && <> in {categoryName ?? category}</>}
          </p>
        )}
        {tag && (
          <button type="button" onClick={() => update({ tag: '' })} className="inline-flex items-center gap-1 rounded-full bg-brand-soft px-3 py-1 text-sm font-medium text-brand" aria-label={`Remove tag filter: ${tag}`}>
            #{tag} <X className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        )}
        {filtered && (
          <button type="button" onClick={clearAll} className="inline-flex items-center gap-1 rounded-full border border-line px-3 py-1 text-sm hover:border-ink">
            <X className="h-3.5 w-3.5" aria-hidden="true" /> Clear filters
          </button>
        )}
      </div>

      <div className="mt-4">
        {blogs.loading && (
          <div className="grid grid-cols-1 gap-x-6 gap-y-8 md:grid-cols-3" aria-busy="true">
            {Array.from({ length: 6 }, (_, i) => (
              <CardSkeleton key={i} ratio="aspect-[16/10]" />
            ))}
          </div>
        )}
        {!blogs.loading && blogs.error && <ErrorState error={blogs.error} onRetry={blogs.reload} />}
        {!blogs.loading && !blogs.error && items.length === 0 && (
          <EmptyState
            title={page > 1 && meta?.total > 0 ? 'That page is out of range' : filtered ? 'No stories match your search' : 'No stories have been published yet'}
            text={page > 1 && meta?.total > 0 ? 'Go back to the first page to see the stories.' : filtered ? 'Try different words, or clear the filters.' : 'Check back soon.'}
          />
        )}
        {!blogs.loading && !blogs.error && items.length > 0 && (
          <>
            {featured && <FeaturedBlog blog={featured} />}
            {gridItems.length > 0 && (
              <ul className={`grid grid-cols-1 gap-x-6 gap-y-8 md:grid-cols-3 ${featured ? 'mt-12' : ''}`}>
                {gridItems.map((b) => (
                  <li key={b._id}>
                    <BlogCard blog={b} />
                  </li>
                ))}
              </ul>
            )}
            <Pagination page={meta?.page ?? page} totalPages={meta?.totalPages ?? 1} onChange={(p) => update({ page: p > 1 ? p : '' }, { keepPage: true })} />
          </>
        )}
      </div>
    </div>
  );
}
