import { Upload, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Pagination from '../components/Pagination.jsx';
import SearchPill from '../components/SearchPill.jsx';
import { CardSkeleton, EmptyState, ErrorState } from '../components/States.jsx';
import { useAuth } from '../features/auth/AuthContext.jsx';
import GalleryTile from '../features/community/GalleryTile.jsx';
import MediaPreview from '../features/community/MediaPreview.jsx';
import { useApi } from '../hooks/useApi.js';
import { useDocumentTitle } from '../hooks/useDocumentTitle.js';
import { useQueryParams } from '../hooks/useQueryParams.js';
import { getCategories, listGallery } from '../services/content.js';

const PAGE_SIZE = 24;
const TYPES = [
  { value: '', label: 'All' },
  { value: 'image', label: 'Photos' },
  { value: 'video', label: 'Videos' },
];

export default function Community() {
  useDocumentTitle('Community Gallery');
  const { user } = useAuth();
  const { params, update, clearAll } = useQueryParams();
  const q = params.get('q') ?? '';
  const category = params.get('category') ?? '';
  const mediaType = ['image', 'video'].includes(params.get('type')) ? params.get('type') : '';
  const page = Math.max(1, parseInt(params.get('page'), 10) || 1);
  const [previewIndex, setPreviewIndex] = useState(null);

  const cats = useApi((s) => getCategories(s), []);
  const gallery = useApi((s) => listGallery({ q, category, mediaType, page, limit: PAGE_SIZE }, s), [q, category, mediaType, page]);

  useEffect(() => {
    setPreviewIndex(null);
    window.scrollTo?.({ top: 0 });
  }, [q, category, mediaType, page]);

  const items = gallery.data ?? [];
  const meta = gallery.meta;
  const filtered = Boolean(q || category || mediaType);
  const categoryName = cats.data?.find((c) => c.slug === category)?.name;
  const pill = (active) => `chip ${active ? '!border-ink !bg-ink !text-white' : ''}`;

  return (
    <div className="container-page py-8 sm:py-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Community Gallery</h1>
          <p className="mt-2 max-w-2xl text-ink-muted">Photos and videos of Adi food, shared by our community and reviewed by our team. This gallery is separate from our official recipes.</p>
        </div>
        {user ? (
          <Link to="/dashboard/upload" className="btn-primary">
            <Upload className="h-4 w-4" aria-hidden="true" /> Upload photos or videos
          </Link>
        ) : (
          <Link to="/login" state={{ from: '/dashboard/upload' }} className="btn-primary">
            <Upload className="h-4 w-4" aria-hidden="true" /> Log in to upload
          </Link>
        )}
      </div>

      <SearchPill key={q} initialValue={q} onSearch={(value) => update({ q: value })} placeholder="Search the gallery" className="mt-6 max-w-2xl" />

      <div className="mt-6 flex flex-col gap-4">
        <ul className="flex gap-2" aria-label="Filter by type">
          {TYPES.map((t) => (
            <li key={t.label}>
              <button type="button" onClick={() => update({ type: t.value })} aria-pressed={mediaType === t.value} className={pill(mediaType === t.value)}>
                {t.label}
              </button>
            </li>
          ))}
        </ul>
        {(cats.data?.length ?? 0) > 0 && (
          <ul className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0" aria-label="Filter by category">
            <li>
              <button type="button" onClick={() => update({ category: '' })} aria-pressed={!category} className={pill(!category)}>
                All categories
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
      </div>

      <div className="mt-6 flex min-h-8 flex-wrap items-center gap-3" aria-live="polite">
        {!gallery.loading && !gallery.error && meta && (
          <p className="text-sm text-ink-muted">
            {meta.total} {meta.total === 1 ? 'item' : 'items'}
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
        {gallery.loading && (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4" aria-busy="true">
            {Array.from({ length: 8 }, (_, i) => (
              <CardSkeleton key={i} ratio="aspect-square" />
            ))}
          </div>
        )}
        {!gallery.loading && gallery.error && <ErrorState error={gallery.error} onRetry={gallery.reload} />}
        {!gallery.loading && !gallery.error && items.length === 0 && (
          <EmptyState
            title={page > 1 && meta?.total > 0 ? 'That page is out of range' : filtered ? 'Nothing matches your search' : 'No community uploads yet'}
            text={page > 1 && meta?.total > 0 ? 'Go back to the first page to see the gallery.' : filtered ? 'Try different words, or clear the filters.' : 'Approved photos and videos will appear here.'}
          />
        )}
        {!gallery.loading && !gallery.error && items.length > 0 && (
          <>
            <ul className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
              {items.map((item, i) => (
                <li key={item._id}>
                  <GalleryTile item={item} onOpen={() => setPreviewIndex(i)} />
                </li>
              ))}
            </ul>
            <Pagination page={meta?.page ?? page} totalPages={meta?.totalPages ?? 1} onChange={(p) => update({ page: p > 1 ? p : '' }, { keepPage: true })} />
          </>
        )}
      </div>

      {previewIndex !== null && items[previewIndex] && <MediaPreview items={items} index={previewIndex} onClose={() => setPreviewIndex(null)} onIndex={setPreviewIndex} />}
    </div>
  );
}
