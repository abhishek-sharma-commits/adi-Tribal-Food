import { Link, useParams } from 'react-router-dom';
import { ErrorState } from '../../components/States.jsx';
import { useAuth } from '../../features/auth/AuthContext.jsx';
import BlogView from '../../features/blogs/BlogView.jsx';
import { useApi } from '../../hooks/useApi.js';
import { useDocumentTitle } from '../../hooks/useDocumentTitle.js';
import { getAdminBlog } from '../../services/adminBlogs.js';
import { getCategories } from '../../services/content.js';
import { storyMissing, StoryNotFound } from './BlogEditor.jsx';

/** Shows a story as readers will see it, including drafts, before it is published. */
export default function BlogPreview() {
  const { id } = useParams();
  const { user } = useAuth();
  const blog = useApi((s) => getAdminBlog(id, s), [id]);
  const cats = useApi((s) => getCategories(s), []);
  useDocumentTitle(blog.data ? `Preview: ${blog.data.title}` : 'Preview');

  if (blog.loading || cats.loading) return <div className="h-64 animate-pulse rounded-card bg-surface" aria-busy="true" />;
  if (storyMissing(blog.error)) return <StoryNotFound />;
  if (blog.error) return <ErrorState error={blog.error} onRetry={blog.reload} />;

  const b = blog.data;
  const view = { ...b, category: (cats.data ?? []).find((c) => c._id === b.category) ?? null, author: b.author === user?.id ? { fullName: user.fullName } : null, publishedAt: b.publishedAt ?? new Date().toISOString() };
  const note = { published: 'This story is published.', draft: 'This story is a draft and is not visible to the public.', archived: 'This story is archived and is not visible to the public.' }[b.status];

  return (
    <div className="-mx-4 sm:-mx-6 lg:-mx-10">
      <div role="note" className="flex flex-wrap items-center justify-between gap-3 border-y border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 sm:px-6 lg:px-10">
        <p><strong>Preview of the saved version.</strong> {note}</p>
        <div className="flex gap-2">
          <Link to={`/admin/blogs/${id}/edit`} className="btn-secondary !py-1.5">Edit</Link>
          <Link to="/admin/blogs" className="btn-secondary !py-1.5">Back to stories</Link>
        </div>
      </div>
      <BlogView blog={view} related={[]} showShare={false} />
    </div>
  );
}
