import useAuth from '../hooks/useAuth.js';
import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import api from '../services/api.js';

// Placeholder landing page for signed-in users; later milestones add assessments and progress.
export default function Dashboard() {
  const { user } = useAuth();
  const location = useLocation();
  const [examDashboard, setExamDashboard] = useState(null);

  useEffect(() => {
    if (user?.role !== 'student') return;
    api.get('/exams/dashboard').then(({ data }) => setExamDashboard(data)).catch(() => setExamDashboard({ error: true }));
  }, [user?.role]);

  return (
    <section className="mx-auto w-full max-w-5xl px-6 py-16">
      <h1 className="text-3xl font-bold">Welcome, {user.name}</h1>
      <p className="mt-2 text-slate-600">
        Signed in as {user.email} · <span className="capitalize">{user.role}</span>
      </p>
      {location.state?.verificationPending && (
        <div role="status" className="mt-6 rounded-lg border border-indigo-200 bg-indigo-50 p-5 text-indigo-950">
          <p>Check your email at <strong>{location.state.registrationEmail}</strong> for a verification link.</p>
          <p className="mt-2 text-sm">Didn’t receive it? <Link to="/verify-email" className="font-semibold underline">Resend verification email</Link></p>
        </div>
      )}
      <Link to="/subjects" className="mt-8 inline-flex rounded-lg bg-indigo-600 px-5 py-3 font-semibold text-white hover:bg-indigo-700">Browse subjects</Link>
      {user.role === 'student' && <section className="mt-8 rounded-xl border border-slate-200 bg-white p-6">
        <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-xl font-bold">Upcoming Exams</h2><Link to="/exams" className="text-sm font-semibold text-indigo-700 hover:underline">View All Exams</Link></div>
        {examDashboard?.error ? <p className="mt-4 text-sm text-slate-600">Could not load upcoming exams.</p> : !examDashboard ? <p className="mt-4 text-sm text-slate-500">Loading exams…</p> : examDashboard.summary.totalExams === 0 ? <p className="mt-4 text-sm text-slate-600">No exams planned yet. Add your upcoming exam to track your preparation.</p> : examDashboard.upcomingExams.length ? <ul className="mt-4 divide-y divide-slate-100">{examDashboard.upcomingExams.slice(0, 3).map(exam => <li key={exam.id} className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"><div><p className="font-semibold">{exam.subjectName}</p><p className="text-sm text-slate-500">{exam.examDate}</p></div><div className="text-right text-sm"><p className="font-semibold">{exam.daysRemaining === 0 ? exam.isPastDue ? 'Past due' : 'Today' : `${exam.daysRemaining} days left`}</p><p className="text-slate-500">{exam.preparationPercentage}% prepared</p></div></li>)}</ul> : <p className="mt-4 text-sm text-slate-600">No upcoming exams. View completed schedules in Exam Planner.</p>}
      </section>}
      {user.role === 'student' ? <section aria-label="Student learning actions" className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Link to="/quizzes" className="rounded-xl border border-indigo-200 bg-indigo-600 p-5 text-white shadow-sm transition hover:bg-indigo-700"><span className="text-lg font-bold">Take a Quiz</span><span className="mt-2 block text-sm text-indigo-100">Choose a subject and topic to start practice.</span></Link>
        <Link to="/performance" className="rounded-xl border border-slate-200 bg-white p-5 transition hover:border-indigo-300"><span className="text-lg font-bold">Performance</span><span className="mt-2 block text-sm text-slate-600">Review quiz scores and learning gaps.</span></Link>
        <Link to="/revision" className="rounded-xl border border-slate-200 bg-white p-5 transition hover:border-indigo-300"><span className="text-lg font-bold">Revision</span><span className="mt-2 block text-sm text-slate-600">Review weak topics and retest.</span></Link>
        <Link to="/exams" className="rounded-xl border border-slate-200 bg-white p-5 transition hover:border-indigo-300"><span className="text-lg font-bold">Exam Planner</span><span className="mt-2 block text-sm text-slate-600">Track upcoming exams and preparation.</span></Link>
      </section> : <p className="mt-8 rounded-lg border border-slate-200 bg-white p-6 text-slate-600">Your assessments, learning gaps and revision plans will appear here.</p>}
    </section>
  );
}
