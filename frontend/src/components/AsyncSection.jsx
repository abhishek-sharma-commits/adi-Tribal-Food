import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { CardSkeleton, EmptyState, ErrorState } from './States.jsx';

/** A titled homepage section that renders loading, error, empty and loaded states from a useApi result. */
export default function AsyncSection({ title, subtitle, linkTo, linkLabel, query, skeletons = 4, ratio, grid, empty, children }) {
  const { data, loading, error, reload } = query;
  return (
    <section className="container-page py-10 sm:py-14">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">{title}</h2>
          {subtitle && <p className="mt-1 text-ink-muted">{subtitle}</p>}
        </div>
        {linkTo && (
          <Link to={linkTo} className="hidden shrink-0 items-center gap-1 text-sm font-semibold underline-offset-4 hover:underline sm:inline-flex">
            {linkLabel} <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        )}
      </div>

      {loading && (
        <div className={grid}>
          {Array.from({ length: skeletons }, (_, i) => (
            <CardSkeleton key={i} ratio={ratio} />
          ))}
        </div>
      )}
      {!loading && error && <ErrorState error={error} onRetry={reload} />}
      {!loading && !error && data?.length === 0 && <EmptyState title={empty.title} text={empty.text} />}
      {!loading && !error && data?.length > 0 && <div className={grid}>{children(data)}</div>}

      {linkTo && (
        <Link to={linkTo} className="mt-6 inline-flex items-center gap-1 text-sm font-semibold underline-offset-4 hover:underline sm:hidden">
          {linkLabel} <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      )}
    </section>
  );
}
