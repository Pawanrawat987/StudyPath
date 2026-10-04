import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import FormField from '../components/FormField.jsx';
import api from '../services/api.js';

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState({ loading: Boolean(token), message: '', error: false });

  useEffect(() => {
    if (!token) return;
    api.get('/auth/verify-email', { params: { token } })
      .then(({ data }) => setStatus({ loading: false, message: data.message, error: false }))
      .catch((error) => setStatus({
        loading: false,
        message: error.response?.data?.message || 'Could not verify this email. Try requesting a new link.',
        error: true,
      }));
  }, [token]);

  const resend = async (event) => {
    event.preventDefault();
    setStatus({ loading: true, message: '', error: false });
    try {
      const { data } = await api.post('/auth/resend-verification', { email });
      setStatus({ loading: false, message: data.message, error: false });
    } catch (error) {
      setStatus({ loading: false, message: error.response?.data?.message || 'Unable to send a verification email right now.', error: true });
    }
  };

  return (
    <section className="m-auto w-full max-w-md px-6 py-16">
      <h1 className="text-3xl font-bold">Verify your email</h1>
      {status.loading ? <p className="mt-4 text-slate-600">Verifying your email…</p> : null}
      {status.message && <p role="status" className={`mt-4 rounded-lg px-4 py-3 text-sm ${status.error ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-800'}`}>{status.message}</p>}
      {!token || status.error ? (
        <form onSubmit={resend} className="mt-6 space-y-5">
          <p className="text-slate-600">Enter your account email and we’ll send a fresh verification link if it needs verification.</p>
          <FormField id="email" name="email" type="email" label="Email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
          <button disabled={status.loading} className="w-full rounded-lg bg-indigo-600 px-6 py-3 font-semibold text-white disabled:opacity-60">
            {status.loading ? 'Sending…' : 'Resend verification email'}
          </button>
        </form>
      ) : null}
      <p className="mt-6 text-sm text-slate-600"><Link to="/login" className="font-semibold text-indigo-600 hover:underline">Back to log in</Link></p>
    </section>
  );
}
