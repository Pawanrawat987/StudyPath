import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import FormField from '../components/FormField.jsx';
import useAuth from '../hooks/useAuth.js';
import { getApiError } from '../utils/apiError.js';
import api from '../services/api.js';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const googleError = new URLSearchParams(location.search).get('googleError');

  const handleChange = (event) => setForm({ ...form, [event.target.name]: event.target.value });

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    if (!form.email.trim() || !form.password) {
      setError('Email and password are required');
      return;
    }
    setSubmitting(true);
    try {
      const loggedInUser = await login({ email: form.email.trim(), password: form.password });
      const home = ['teacher', 'admin'].includes(loggedInUser.role) ? '/admin' : '/dashboard';
      navigate(location.state?.from?.pathname || home, { replace: true });
    } catch (err) {
      setError(getApiError(err).message);
      setSubmitting(false);
    }
  };

  return (
    <section className="m-auto w-full max-w-md px-6 py-16">
      <h1 className="text-3xl font-bold">Log in</h1>
      <p className="mt-2 text-slate-600">Welcome back to StudyPath.</p>
      {googleError && <p role="alert" className="mt-5 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{googleError === 'not_configured' ? 'Google sign-in is not configured yet. Add your Google OAuth client ID and secret to backend/.env, then restart the backend.' : 'Google sign-in could not be completed. Try again or use email and password.'}</p>}
      <a href={`${String(api.defaults.baseURL || '/api').replace(/\/$/, '')}/auth/google`}
        className="mt-8 block w-full rounded-lg border border-slate-300 bg-white px-6 py-3 text-center font-semibold text-slate-800 transition-colors hover:bg-slate-50">
        Continue with Google
      </a>
      <div className="mt-6 flex items-center gap-4 text-xs uppercase tracking-wide text-slate-400">
        <span className="h-px flex-1 bg-slate-200" /><span>or log in with email</span><span className="h-px flex-1 bg-slate-200" />
      </div>
      <form onSubmit={handleSubmit} noValidate className="mt-8 space-y-5">
        {error && (
          <p role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        )}
        <FormField id="email" name="email" type="email" label="Email" autoComplete="email"
          value={form.email} onChange={handleChange} required />
        <FormField id="password" name="password" type="password" label="Password"
          autoComplete="current-password" value={form.password} onChange={handleChange} required />
        <button type="submit" disabled={submitting}
          className="w-full rounded-lg bg-indigo-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-indigo-700 disabled:opacity-60">
          {submitting ? 'Logging in…' : 'Log in'}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-slate-600">
        New to StudyPath?{' '}
        <Link to="/register" className="font-semibold text-indigo-600 hover:underline">
          Create an account
        </Link>
      </p>
      <p className="mt-4 flex justify-center gap-4 text-sm">
        <Link to="/forgot-password" className="font-semibold text-indigo-600 hover:underline">Forgot Password?</Link>
        <Link to="/verify-email" className="font-semibold text-indigo-600 hover:underline">Resend verification email</Link>
      </p>
    </section>
  );
}
