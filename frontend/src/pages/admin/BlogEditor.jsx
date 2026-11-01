import { ChevronLeft } from 'lucide-react';
import { useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { ErrorState } from '../../components/States.jsx';
import BlogForm from '../../features/admin/BlogForm.jsx';
import { emptyBlog, toFormValues } from '../../features/admin/blogForm.js';
import { useApi } from '../../hooks/useApi.js';
import { useDocumentTitle } from '../../hooks/useDocumentTitle.js';
import { createBlog, getAdminBlog, updateBlog } from '../../services/adminBlogs.js';
import { getCategories } from '../../services/content.js';

export function StoryNotFound() {
  return (
    <div className="rounded-card bg-surface px-6 py-12 text-center">
      <h2 className="text-xl font-bold tracking-tight">Story not found</h2>
      <p className="mt-1 text-ink-muted">It may have been deleted.</p>
      <Link to="/admin/blogs" className="btn-primary mt-5">Back to stories</Link>
    </div>
  );
}
export const storyMissing = (e) => e?.status === 404 || e?.code === 'INVALID_ID';

function Editor({ id }) {
  const mode = id ? 'edit' : 'create';
  const navigate = useNavigate();
  const location = useLocation();
  const cats = useApi((s) => getCategories(s), []);
  const loaded = useApi((s) => (id ? getAdminBlog(id, s) : Promise.resolve({ data: null })), [id]);
  const [saved, setSaved] = useState(null);
  const [flash, setFlash] = useState(location.state?.flash ?? '');
  useDocumentTitle(mode === 'create' ? 'New story' : 'Edit story');

  if (loaded.loading || cats.loading) return <div className="h-64 animate-pulse rounded-card bg-surface" aria-busy="true" />;
  if (storyMissing(loaded.error)) return <StoryNotFound />;
  if (loaded.error) return <ErrorState error={loaded.error} onRetry={loaded.reload} />;
  if (cats.error) return <ErrorState error={cats.error} onRetry={cats.reload} />;

  const blog = saved ?? loaded.data;
  if (mode === 'edit' && !blog) return <div className="h-64 animate-pulse rounded-card bg-surface" aria-busy="true" />;

  const onSave = async (payload) => {
    setFlash('');
    if (mode === 'create') {
      const res = await createBlog(payload);
      navigate(`/admin/blogs/${res.data._id}/edit`, { replace: true, state: { flash: 'Story created.' } });
      return;
    }
    const res = await updateBlog(id, payload);
    setSaved(res.data);
    setFlash(res.data.status === 'published' ? 'Changes saved. This story is published.' : 'Changes saved.');
    window.scrollTo?.({ top: 0 });
  };

  return (
    <div>
      <Link to="/admin/blogs" className="inline-flex items-center gap-1 text-sm text-ink-muted hover:text-ink">
        <ChevronLeft className="h-4 w-4" aria-hidden="true" /> Stories
      </Link>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-2xl font-bold tracking-tight">{mode === 'create' ? 'New story' : 'Edit story'}</h2>
        {mode === 'edit' && (
          <div className="flex flex-wrap gap-2">
            <Link to={`/admin/blogs/${id}/preview`} className="btn-secondary">Preview saved version</Link>
            {blog.status === 'published' && <Link to={`/blogs/${blog.slug}`} className="btn-secondary">View public page</Link>}
          </div>
        )}
      </div>
      {flash && <p role="status" className="mt-4 rounded-xl bg-green-50 px-4 py-3 text-sm text-green-800">{flash}</p>}
      <div className="mt-6">
        <BlogForm key={blog?.updatedAt ?? 'new'} mode={mode} defaults={blog ? toFormValues(blog) : emptyBlog} categories={cats.data ?? []} onSave={onSave} cancelTo="/admin/blogs" />
      </div>
    </div>
  );
}

/** Keyed by id so moving from /new to /:id/edit (after creating) always starts from a clean state. */
export default function BlogEditor() {
  const { id } = useParams();
  return <Editor key={id ?? 'new'} id={id} />;
}
