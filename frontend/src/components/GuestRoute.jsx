import { Navigate, Outlet } from 'react-router-dom';
import useAuth from '../hooks/useAuth.js';

// Login/Register are only for logged-out visitors; signed-in users go to the dashboard.
export default function GuestRoute() {
  const { user, loading } = useAuth();
  if (loading) return <p className="m-auto text-slate-500">Loading…</p>;
  return user ? <Navigate to="/dashboard" replace /> : <Outlet />;
}