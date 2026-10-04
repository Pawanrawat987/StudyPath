import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../services/api.js';

export function QuizHistory() {
  const [attempts, setAttempts] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const load = useCallback(() => {
    setLoading(true);
    setError('');
    api.get('/quiz-attempts/my')
      .then(({ data }) => setAttempts(data.attempts || []))
      .catch(err => setError(err.response?.data?.message || 'Could not load attempt history.'))
      .finally(() => setLoading(false));
  }, []);
  useEffect(() => { load(); }, [load]);

  if (loading) return <section className="mx-auto w-full max-w-5xl px-6 py-12 text-slate-500">Loading attempt history...</section>;
  return <section className="mx-auto w-full max-w-5xl px-6 py-12">
    <h1 className="text-3xl font-bold">Attempt history</h1>
    <p className="mt-2 text-slate-600">Your quiz results and previous attempts.</p>
    {error && <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700"><p role="alert">{error}</p><button type="button" onClick={load} className="mt-2 font-semibold underline">Retry</button></div>}
    {!error && attempts.length ? <div className="mt-8 space-y-3">{attempts.map(attempt => <article key={attempt.id} className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-5"><div><h2 className="font-semibold">{attempt.quiz?.title || 'Quiz'}</h2><p className="mt-1 text-sm text-slate-600">{new Date(attempt.startedAt).toLocaleString()} · {attempt.status === 'completed' ? `${attempt.score}/${attempt.totalQuestions} (${attempt.percentage}%)` : 'In progress'}</p></div>{attempt.status === 'completed' && <Link to={`/quiz-attempts/${attempt.id}`} className="font-semibold text-indigo-700 hover:underline">View result</Link>}</article>)}</div>
      : !error && <div className="mt-8 rounded-lg bg-white p-6 text-slate-600"><p>No quiz attempts yet.</p><Link to="/quizzes" className="mt-4 inline-flex rounded-lg bg-indigo-600 px-4 py-2 font-semibold text-white">Take a Quiz</Link></div>}
  </section>;
}

export function QuizResult() {
  const { id } = useParams();
  const [attempt, setAttempt] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    api.get(`/quiz-attempts/${id}`)
      .then(({ data }) => { if (active) setAttempt(data.attempt); })
      .catch(err => { if (active) setError(err.response?.data?.message || 'Could not load result.'); });
    return () => { active = false; };
  }, [id]);

  if (error) return <section className="mx-auto w-full max-w-4xl px-6 py-12"><p role="alert" className="rounded-lg bg-red-50 p-4 text-red-700">{error}</p><Link to="/quizzes" className="mt-4 inline-flex font-semibold text-indigo-700 underline">Back to Quizzes</Link></section>;
  if (!attempt) return <section className="mx-auto w-full max-w-4xl px-6 py-12 text-slate-500">Loading result...</section>;

  const topic = attempt.quiz?.topic;
  const percentage = Number(attempt.percentage || 0);
  const level = percentage >= 75 ? 'Strong' : percentage >= 50 ? 'Average' : 'Weak';
  return <section className="mx-auto w-full max-w-4xl px-6 py-12">
    <Link to="/quiz-attempts" className="text-sm font-semibold text-indigo-700 hover:underline">← Attempt history</Link>
    <div className="mt-5 rounded-xl border border-slate-200 bg-white p-6">
      <h1 className="text-3xl font-bold">{attempt.status === 'completed' ? 'Quiz Completed' : 'Quiz Result'}</h1>
      <h2 className="mt-3 text-xl font-semibold">{attempt.quiz?.title || 'Quiz result'}</h2>
      {topic && <p className="mt-1 text-slate-600">{topic.subject?.name}{topic.subject?.name && topic.name ? ' · ' : ''}{topic.name}</p>}
      <p className="mt-5 text-lg">Score: <strong>{attempt.score}/{attempt.totalQuestions}</strong></p>
      <p className="mt-1 text-slate-600">{percentage}% · {attempt.correctAnswers} correct · {attempt.wrongAnswers} incorrect</p>
      {attempt.status === 'completed' && <p className="mt-2 text-sm text-slate-600">Performance level: <strong>{level}</strong></p>}
      {attempt.status === 'in_progress' && <p className="mt-4 text-amber-800">This attempt is still in progress.</p>}
      <div className="mt-6 flex flex-wrap gap-3">
        <Link to="/performance" className="rounded-lg border border-slate-300 px-4 py-2 font-semibold text-slate-700 hover:bg-slate-50">View Performance</Link>
        {attempt.status === 'completed' && attempt.quiz?.id && <Link to={`/quizzes/${attempt.quiz.id}/attempt`} state={{ start: true }} className="rounded-lg border border-indigo-200 px-4 py-2 font-semibold text-indigo-700 hover:bg-indigo-50">Try Again</Link>}
        <Link to="/quizzes" className="rounded-lg bg-indigo-600 px-4 py-2 font-semibold text-white hover:bg-indigo-700">Back to Quizzes</Link>
      </div>
    </div>
    <div className="mt-6 space-y-4">{attempt.answers?.map((answer, index) => <article key={answer.questionId} className="rounded-xl border border-slate-200 bg-white p-5"><h2 className="font-semibold">{index + 1}. {answer.question?.questionText}</h2><p className={`mt-2 text-sm ${answer.isCorrect ? 'text-green-800' : 'text-red-800'}`}>{answer.isCorrect ? 'Correct' : 'Incorrect'} · Your answer: {answer.selectedAnswer || 'No answer'}</p></article>)}</div>
  </section>;
}
