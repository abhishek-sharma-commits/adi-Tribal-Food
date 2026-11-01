import { Navigate, Outlet, useLocation } from 'react-router-dom';
import Spinner from '../../components/Spinner.jsx';
import { useAuth } from './AuthContext.jsx';

function Pending() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <Spinner label="Loading" />
    </div>
  );
}

/** Any signed-in user. Redirects to /login and remembers where they were going. */
export function RequireAuth() {
  const { user, status } = useAuth();
  const location = useLocation();
  if (status === 'loading') return <Pending />;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  return <Outlet />;
}

/** Admin only. This is a UX guard; every admin API route is enforced on the server too. */
export function RequireAdmin() {
  const { user, status, isAdmin } = useAuth();
  const location = useLocation();
  if (status === 'loading') return <Pending />;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  if (!isAdmin) return <Navigate to="/" replace />;
  return <Outlet />;
}

/** Login / register pages: signed-in users are sent onward. */
export function GuestOnly() {
  const { user, status } = useAuth();
  const location = useLocation();
  if (status === 'loading') return <Pending />;
  if (user) return <Navigate to={location.state?.from ?? '/'} replace />;
  return <Outlet />;
}
