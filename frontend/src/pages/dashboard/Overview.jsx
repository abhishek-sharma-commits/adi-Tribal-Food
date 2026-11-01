import { Link } from 'react-router-dom';
import { EmptyState, ErrorState } from '../../components/States.jsx';
import UploadRow from '../../features/community/UploadRow.jsx';
import { useApi } from '../../hooks/useApi.js';
import { useDocumentTitle } from '../../hooks/useDocumentTitle.js';
import { listMySubmissions } from '../../services/community.js';

const CARDS = [
  { key: 'total', label: 'Total uploads', to: '/dashboard/uploads' },
  { key: 'pending', label: 'Pending', to: '/dashboard/uploads?status=pending' },
  { key: 'approved', label: 'Approved', to: '/dashboard/uploads?status=approved' },
  { key: 'rejected', label: 'Rejected', to: '/dashboard/uploads?status=rejected' },
];

export default function Overview() {
  useDocumentTitle('Dashboard');
  const { data, meta, loading, error, reload } = useApi((s) => listMySubmissions({ limit: 4 }, s), []);
  const counts = meta?.counts;

  if (error) return <ErrorState error={error} onRetry={reload} />;

  return (
    <div className="space-y-10">
      <section aria-label="Submission summary">
        <ul className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {CARDS.map((c) => (
            <li key={c.key}>
              <Link to={c.to} className="block rounded-card border border-line p-5 transition-shadow hover:shadow-card">
                <p className="text-sm text-ink-muted">{c.label}</p>
                <p className="mt-1 text-3xl font-bold tracking-tight" aria-label={`${c.label}: ${counts?.[c.key] ?? 'loading'}`}>
                  {loading ? <span className="inline-block h-8 w-10 animate-pulse rounded bg-surface" /> : counts?.[c.key] ?? 0}
                </p>
              </Link>
            </li>
          ))}
        </ul>
        {!loading && counts?.rejected > 0 && (
          <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700" role="note">
            {counts.rejected} {counts.rejected === 1 ? 'submission was' : 'submissions were'} not approved.{' '}
            <Link to="/dashboard/uploads?status=rejected" className="font-semibold underline underline-offset-4">
              See the reasons
            </Link>
          </p>
        )}
      </section>

      <section aria-labelledby="recent-heading">
        <div className="mb-4 flex items-center justify-between gap-4">
          <h2 id="recent-heading" className="text-xl font-bold tracking-tight">
            Recent uploads
          </h2>
          <Link to="/dashboard/upload" className="btn-primary">
            Upload photos or videos
          </Link>
        </div>
        {loading && <div className="h-24 animate-pulse rounded-card bg-surface" aria-busy="true" />}
        {!loading && data?.length === 0 && <EmptyState title="You haven't uploaded anything yet" text="Share a photo or video of Adi food. Our team reviews every submission before it appears in the gallery." />}
        {!loading && data?.length > 0 && (
          <>
            <ul className="space-y-3">
              {data.map((item) => (
                <UploadRow key={item._id} item={item} />
              ))}
            </ul>
            <Link to="/dashboard/uploads" className="mt-4 inline-block text-sm font-semibold underline underline-offset-4">
              View all uploads
            </Link>
          </>
        )}
      </section>
    </div>
  );
}
