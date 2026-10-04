import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import FormField from '../components/FormField.jsx';
import api from '../services/api.js';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState(token ? '' : 'Reset token is missing. Request a new password reset link.');

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    setMessage('');
    if (password !== confirmPassword) return setError('Passwords do not match.');
    if (password.length < 8 || !/[A-Za-z]/.test(password) || !/\d/.test(password)) {
      return setError('Password must be at least 8 characters and include a letter and a number.');
    }
    setLoading(true);
    try {
      const { data } = await api.post('/auth/reset-password', { token, password });
      setMessage(data.message);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to reset the password. Request a new link.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="m-auto w-full max-w-md px-6 py-16">
      <h1 className="text-3xl font-bold">Reset your password</h1>
      <form onSubmit={submit} className="mt-8 space-y-5">
        {message && <p role="status" className="rounded-lg bg-green-50 px-4 py-3 text-sm text-green-800">{message}</p>}
        {error && <p role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
        <FormField id="password" name="password" type="password" label="New password" autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} required />
        <FormField id="confirmPassword" name="confirmPassword" type="password" label="Confirm new password" autoComplete="new-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} required />
        <button disabled={loading || !token} className="w-full rounded-lg bg-indigo-600 px-6 py-3 font-semibold text-white disabled:opacity-60">
          {loading ? 'Updating…' : 'Update password'}
        </button>
      </form>
      <p className="mt-6 text-sm text-slate-600"><Link to="/login" className="font-semibold text-indigo-600 hover:underline">Back to log in</Link></p>
    </section>
  );
}
