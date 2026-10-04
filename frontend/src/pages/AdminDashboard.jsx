import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api.js';

const cards = [
  ['totalStudents', 'Students'], ['totalSubjects', 'Subjects'], ['totalTopics', 'Topics'],
  ['totalQuestions', 'Questions'], ['totalQuizzes', 'Quizzes'], ['publishedQuizzes', 'Published quizzes'],
];

export default function AdminDashboard() {
  const [counts, setCounts] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  useEffect(() => { api.get('/admin/dashboard').then(({ data }) => setCounts(data.counts)).catch((err) => setError(err.response?.data?.message || 'Could not load dashboard.')).finally(() => setLoading(false)); }, []);

  return <section className="mx-auto w-full max-w-5xl px-6 py-12">
    <h1 className="text-3xl font-bold">Management dashboard</h1>
    <p className="mt-2 text-slate-600">Overview of StudyPath learning content and students.</p>
    {error && <p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-red-700">{error}</p>}
    {loading && <p className="mt-6 text-slate-500">Loading management data…</p>}
    <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {cards.map(([key, label]) => <article key={key} className="rounded-xl border border-slate-200 bg-white p-5">
        <p className="text-sm text-slate-600">{label}</p><p className="mt-2 text-3xl font-bold">{counts?.[key] ?? '—'}</p>
      </article>)}
    </div>
    <div className="mt-8 flex flex-wrap gap-3">
      <Link className="rounded-lg bg-indigo-600 px-4 py-2 font-semibold text-white" to="/admin/quizzes">Manage quizzes</Link>
      <Link className="rounded-lg border border-slate-300 px-4 py-2 font-semibold" to="/admin/students">View students</Link>
      <Link className="rounded-lg border border-slate-300 px-4 py-2 font-semibold" to="/subjects">Manage subjects, topics &amp; questions</Link>
    </div>
  </section>;
}
