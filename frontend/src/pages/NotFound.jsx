import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="container-page flex flex-col items-center py-24 text-center">
      <p className="text-sm font-semibold text-brand">404</p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight">We couldn't find that page</h1>
      <p className="mt-2 text-ink-muted">The page may have moved, or isn't available yet.</p>
      <Link to="/" className="btn-primary mt-6">
        Back to home
      </Link>
    </div>
  );
}
