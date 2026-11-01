import { Link } from 'react-router-dom';
import { ErrorState } from '../../components/States.jsx';
import { useApi } from '../../hooks/useApi.js';
import { useDocumentTitle } from '../../hooks/useDocumentTitle.js';
import { getDashboard } from '../../services/admin.js';

function Stat({ label, value, loading, to, highlight }) {
  const body = (
    <div className={`rounded-card border p-5 ${highlight ? 'border-brand bg-brand-soft' : 'border-line'} ${to ? 'transition-shadow hover:shadow-card' : ''}`}>
      <p className="text-sm text-ink-muted">{label}</p>
      <p className="mt-1 text-3xl font-bold tracking-tight" aria-label={`${label}: ${loading ? 'loading' : value}`}>
        {loading ? <span className="inline-block h-8 w-12 animate-pulse rounded bg-surface" /> : value}
      </p>
    </div>
  );
  return to ? <Link to={to}>{body}</Link> : body;
}

export default function AdminOverview() {
  useDocumentTitle('Admin overview');
  const { data, loading, error, reload } = useApi((s) => getDashboard(s), []);
  if (error) return <ErrorState error={error} onRetry={reload} />;
  const s = data?.submissions;

  return (
    <div className="space-y-8">
      {!loading && s?.pending > 0 && (
        <div role="note" className="flex flex-wrap items-center justify-between gap-3 rounded-card bg-brand-soft px-5 py-4">
          <p className="font-medium">
            {s.pending} {s.pending === 1 ? 'submission is' : 'submissions are'} waiting for review.
          </p>
          <Link to="/admin/moderation" className="btn-primary">
            Review now
          </Link>
        </div>
      )}

      <section aria-labelledby="content-heading">
        <h2 id="content-heading" className="mb-3 text-lg font-bold tracking-tight">
          Site
        </h2>
        <ul className="grid grid-cols-2 gap-4 lg:grid-cols-3">
          <li>
            <Stat label="Total users" value={data?.totalUsers} loading={loading} to="/admin/users" />
          </li>
          <li>
            <Stat label="Published recipes" value={data?.publishedRecipes} loading={loading} />
          </li>
          <li>
            <Stat label="Published blogs" value={data?.publishedBlogs} loading={loading} />
          </li>
        </ul>
      </section>

      <section aria-labelledby="community-heading">
        <h2 id="community-heading" className="mb-3 text-lg font-bold tracking-tight">
          Community submissions
        </h2>
        <ul className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <li>
            <Stat label="Total submissions" value={s?.total} loading={loading} to="/admin/moderation" />
          </li>
          <li>
            <Stat label="Pending moderation" value={s?.pending} loading={loading} to="/admin/moderation?status=pending" highlight={!loading && s?.pending > 0} />
          </li>
          <li>
            <Stat label="Approved" value={s?.approved} loading={loading} to="/admin/moderation?status=approved" />
          </li>
          <li>
            <Stat label="Rejected" value={s?.rejected} loading={loading} to="/admin/moderation?status=rejected" />
          </li>
        </ul>
      </section>
    </div>
  );
}
