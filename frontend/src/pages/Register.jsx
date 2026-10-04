import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import FormField from '../components/FormField.jsx';
import useAuth from '../hooks/useAuth.js';
import { getApiError } from '../utils/apiError.js';

// Mirrors the backend rules so most mistakes are caught before submitting.
function validate({ name, email, phoneNumber, password, confirmPassword }) {
  const errors = {};
  if (name.trim().length < 2) errors.name = 'Name must be at least 2 characters';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) errors.email = 'Enter a valid email address';
  if (phoneNumber.trim() && !/^\+[1-9]\d{7,14}$/.test(phoneNumber.trim().replace(/[\s()-]/g, ''))) {
    errors.phoneNumber = 'Use international format, for example +919876543210';
  }
  if (password.length < 8) errors.password = 'Password must be at least 8 characters';
  else if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
    errors.password = 'Password must contain at least one letter and one number';
  }
  if (confirmPassword !== password) errors.confirmPassword = 'Passwords do not match';
  return errors;
}

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', phoneNumber: '', password: '', confirmPassword: '' });
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (event) => setForm({ ...form, [event.target.name]: event.target.value });

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    const errors = validate(form);
    setFieldErrors(errors);
    if (Object.keys(errors).length) return;

    setSubmitting(true);
    try {
      await register({ name: form.name.trim(), email: form.email.trim(), phoneNumber: form.phoneNumber.trim(), password: form.password });
      navigate('/dashboard', { replace: true, state: { verificationPending: true, registrationEmail: form.email.trim() } });
    } catch (err) {
      const { message, fields } = getApiError(err);
      setError(message);
      setFieldErrors(fields);
      setSubmitting(false);
    }
  };

  return (
    <section className="m-auto w-full max-w-md px-6 py-16">
      <h1 className="text-3xl font-bold">Create your account</h1>
      <p className="mt-2 text-slate-600">Start finding and closing your learning gaps.</p>
      <form onSubmit={handleSubmit} noValidate className="mt-8 space-y-5">
        {error && (
          <p role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        )}
        <FormField id="name" name="name" label="Full name" autoComplete="name"
          value={form.name} onChange={handleChange} error={fieldErrors.name} required />
        <FormField id="email" name="email" type="email" label="Email" autoComplete="email"
          value={form.email} onChange={handleChange} error={fieldErrors.email} required />
        <FormField id="phoneNumber" name="phoneNumber" type="tel" label="Phone number (optional)" autoComplete="tel"
          placeholder="+919876543210" value={form.phoneNumber} onChange={handleChange} error={fieldErrors.phoneNumber} />
        <p className="-mt-4 text-xs text-slate-500">Add an international-format number if you want phone OTP password recovery.</p>
        <FormField id="password" name="password" type="password" label="Password"
          autoComplete="new-password" value={form.password} onChange={handleChange}
          error={fieldErrors.password} required />
        <FormField id="confirmPassword" name="confirmPassword" type="password" label="Confirm password"
          autoComplete="new-password" value={form.confirmPassword} onChange={handleChange}
          error={fieldErrors.confirmPassword} required />
        <button type="submit" disabled={submitting}
          className="w-full rounded-lg bg-indigo-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-indigo-700 disabled:opacity-60">
          {submitting ? 'Creating account…' : 'Create account'}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-slate-600">
        Already have an account?{' '}
        <Link to="/login" className="font-semibold text-indigo-600 hover:underline">
          Log in
        </Link>
      </p>
    </section>
  );
}
