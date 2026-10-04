import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import FormField from '../components/FormField.jsx';
import api from '../services/api.js';

const PHONE_OTP_MESSAGE = 'If an account exists with this phone number, an OTP has been sent.';

export default function ForgotPassword() {
  const [method, setMethod] = useState('email');
  const [stage, setStage] = useState('request');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [resendAvailableAt, setResendAvailableAt] = useState(0);
  const [resendSeconds, setResendSeconds] = useState(0);

  useEffect(() => {
    if (!resendAvailableAt) return undefined;
    const update = () => setResendSeconds(Math.max(0, Math.ceil((resendAvailableAt - Date.now()) / 1000)));
    update();
    const timer = window.setInterval(update, 1000);
    return () => window.clearInterval(timer);
  }, [resendAvailableAt]);

  const clearFeedback = () => { setMessage(''); setError(''); };

  const requestEmailLink = async (event) => {
    event.preventDefault();
    clearFeedback();
    setLoading(true);
    try {
      const { data } = await api.post('/auth/forgot-password', { email: email.trim() });
      setMessage(data.message);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to process the request right now.');
    } finally {
      setLoading(false);
    }
  };

  const requestPhoneOtp = async (event) => {
    event?.preventDefault();
    clearFeedback();
    setLoading(true);
    try {
      const { data } = await api.post('/auth/forgot-password/send-otp', { phoneNumber: phoneNumber.trim() });
      setMessage(data.message || PHONE_OTP_MESSAGE);
      setStage('otp');
      setResendAvailableAt(Date.now() + 60_000);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to send an OTP right now.');
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async (event) => {
    event.preventDefault();
    clearFeedback();
    setLoading(true);
    try {
      const { data } = await api.post('/auth/forgot-password/verify-otp', { phoneNumber: phoneNumber.trim(), otp: otp.trim() });
      setResetToken(data.resetToken);
      setStage('reset');
      setMessage('Phone verified. Choose a new password.');
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to verify this OTP.');
    } finally {
      setLoading(false);
    }
  };

  const resetPhonePassword = async (event) => {
    event.preventDefault();
    clearFeedback();
    if (password !== confirmPassword) return setError('Passwords do not match.');
    if (password.length < 8 || !/[A-Za-z]/.test(password) || !/\d/.test(password)) {
      return setError('Password must be at least 8 characters and include a letter and a number.');
    }
    setLoading(true);
    try {
      const { data } = await api.post('/auth/reset-password/phone', {
        resetToken, newPassword: password, confirmPassword,
      });
      setStage('done');
      setMessage(data.message);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to reset the password.');
    } finally {
      setLoading(false);
    }
  };

  const switchMethod = (nextMethod) => {
    setMethod(nextMethod);
    setStage('request');
    setOtp('');
    setResetToken('');
    setPassword('');
    setConfirmPassword('');
    clearFeedback();
  };

  return (
    <section className="m-auto w-full max-w-md px-6 py-16">
      <h1 className="text-3xl font-bold">Reset your StudyPath password</h1>
      <p className="mt-2 text-slate-600">Choose how you want to recover your account.</p>

      {stage === 'request' && (
        <div className="mt-6 grid grid-cols-2 rounded-lg bg-slate-100 p-1" role="group" aria-label="Recovery method">
          <button type="button" onClick={() => switchMethod('email')} aria-pressed={method === 'email'}
            className={`rounded-md px-3 py-2 text-sm font-semibold ${method === 'email' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600'}`}>
            Email
          </button>
          <button type="button" onClick={() => switchMethod('phone')} aria-pressed={method === 'phone'}
            className={`rounded-md px-3 py-2 text-sm font-semibold ${method === 'phone' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600'}`}>
            Phone
          </button>
        </div>
      )}

      {message && <p role="status" className="mt-5 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-800">{message}</p>}
      {error && <p role="alert" className="mt-5 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

      {method === 'email' && stage === 'request' && (
        <form onSubmit={requestEmailLink} className="mt-6 space-y-5">
          <FormField id="email" name="email" type="email" label="Email address" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
          <button disabled={loading} className="w-full rounded-lg bg-indigo-600 px-6 py-3 font-semibold text-white disabled:opacity-60">
            {loading ? 'Sending…' : 'Send Reset Link'}
          </button>
        </form>
      )}

      {method === 'phone' && stage === 'request' && (
        <form onSubmit={requestPhoneOtp} className="mt-6 space-y-5">
          <FormField id="phoneNumber" name="phoneNumber" type="tel" label="Phone number" autoComplete="tel" placeholder="+919876543210" value={phoneNumber} onChange={(event) => setPhoneNumber(event.target.value)} required />
          <p className="-mt-4 text-xs text-slate-500">Use the international-format number saved in your account.</p>
          <button disabled={loading} className="w-full rounded-lg bg-indigo-600 px-6 py-3 font-semibold text-white disabled:opacity-60">
            {loading ? 'Sending…' : 'Send OTP'}
          </button>
        </form>
      )}

      {method === 'phone' && stage === 'otp' && (
        <form onSubmit={verifyOtp} className="mt-6 space-y-5">
          <FormField id="otp" name="otp" inputMode="numeric" autoComplete="one-time-code" label="6-digit OTP" value={otp} onChange={(event) => setOtp(event.target.value.replace(/\D/g, '').slice(0, 6))} required />
          <button disabled={loading || otp.length !== 6} className="w-full rounded-lg bg-indigo-600 px-6 py-3 font-semibold text-white disabled:opacity-60">
            {loading ? 'Verifying…' : 'Verify OTP'}
          </button>
          <button type="button" onClick={requestPhoneOtp} disabled={loading || resendSeconds > 0}
            className="w-full py-2 text-sm font-semibold text-indigo-700 disabled:text-slate-400">
            {resendSeconds > 0 ? `Resend OTP in ${resendSeconds}s` : 'Resend OTP'}
          </button>
        </form>
      )}

      {method === 'phone' && stage === 'reset' && (
        <form onSubmit={resetPhonePassword} className="mt-6 space-y-5">
          <FormField id="newPassword" name="newPassword" type="password" label="New password" autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} required />
          <FormField id="confirmPassword" name="confirmPassword" type="password" label="Confirm new password" autoComplete="new-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} required />
          <button disabled={loading} className="w-full rounded-lg bg-indigo-600 px-6 py-3 font-semibold text-white disabled:opacity-60">
            {loading ? 'Updating…' : 'Reset Password'}
          </button>
        </form>
      )}

      {method === 'phone' && stage !== 'request' && stage !== 'done' && (
        <button type="button" onClick={() => switchMethod('email')} className="mt-4 text-sm font-semibold text-indigo-700 hover:underline">
          Choose another recovery method
        </button>
      )}

      {stage === 'done' && <Link to="/login" className="mt-6 inline-block font-semibold text-indigo-600 hover:underline">Go to login</Link>}
      <p className="mt-6 text-sm text-slate-600"><Link to="/login" className="font-semibold text-indigo-600 hover:underline">Back to log in</Link></p>
    </section>
  );
}
