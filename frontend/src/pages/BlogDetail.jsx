import { Link, useParams } from 'react-router-dom';
import { ErrorState } from '../components/States.jsx';
import BlogView from '../features/blogs/BlogView.jsx';
import { useApi } from '../hooks/useApi.js';
import { useDocumentTitle } from '../hooks/useDocumentTitle.js';
import { getBlog } from '../services/content.js';

function Skeleton() {
  return (
    <div className="container-page max-w-3xl animate-pulse py-10" aria-busy="true" aria-label="Loading story">
      <div className="h-4 w-40 rounded bg-surface" />
      <div className="mt-4 h-10 w-3/4 rounded bg-surface" />
      <div className="mt-8 aspect-[16/9] w-full rounded-3xl bg-surface" />
    </div>
  );
}

function NotFound() {
  return (
    <div className="container-page flex flex-col items-center py-24 text-center">
      <h1 className="text-3xl font-bold tracking-tight">Story not found</h1>
      <p className="mt-2 text-ink-muted">This story doesn't exist or hasn't been published.</p>
      <Link to="/blogs" className="btn-primary mt-6">
        Browse all stories
      </Link>
    </div>
  );
}

export default function BlogDetail() {
  const { slug } = useParams();
  const { data, loading, error, reload } = useApi((s) => getBlog(slug, s), [slug]);
  useDocumentTitle(data?.blog?.title);

  if (loading) return <Skeleton />;
  if (error?.status === 404) return <NotFound />;
  if (error) {
    return (
      <div className="container-page py-16">
        <ErrorState error={error} onRetry={reload} />
      </div>
    );
  }
  return <BlogView blog={data.blog} related={data.related ?? []} />;
}
