import { Navigate, Outlet, useLocation } from 'react-router-dom';
import useAuth from '../hooks/useAuth.js';

// Wrap routes that need a logged-in user. Pass `roles` to limit access, e.g. roles={['admin']}.
export default function ProtectedRoute({ roles }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <p className="m-auto text-slate-500">Loading…</p>;
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;
  if (roles && !roles.includes(user.role)) {
    return (
      <section className="m-auto px-6 py-24 text-center">
        <h1 className="text-3xl font-bold">Access denied</h1>
        <p className="mt-4 text-slate-600">You do not have permission to view this page.</p>
      </section>
    );
  }
  return <Outlet />;
}