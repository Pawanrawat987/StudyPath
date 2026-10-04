import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import api from '../services/api.js';

function leftTime(startedAt, limit) {
  if (!limit) return null;
  return Math.max(0, Math.ceil((new Date(startedAt).getTime() + limit * 60000 - Date.now()) / 1000));
}
function clock(seconds) { return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`; }

export default function QuizAttempt() {
  const { quizId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [answers, setAnswers] = useState({});
  const [index, setIndex] = useState(0);
  const [seconds, setSeconds] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const submitted = useRef(false);

  useEffect(() => {
    if (location.state?.attemptData) { setData(location.state.attemptData); return; }
    if (!location.state?.start) return;
    let active = true;
    api.post(`/quizzes/${quizId}/start`).then(({ data: response }) => {
      if (active) { setData(response); navigate(location.pathname, { replace: true, state: { attemptData: response } }); }
    }).catch(err => { if (active) setError(err.response?.data?.message || 'Could not start quiz.'); });
    return () => { active = false; };
  }, [quizId, location.state, location.pathname, navigate]);

  useEffect(() => {
    if (!data?.attempt) return;
    const tick = () => setSeconds(leftTime(data.attempt.startedAt, data.attempt.timeLimit));
    tick();
    if (!data.attempt.timeLimit) return undefined;
    const timer = setInterval(tick, 500);
    return () => clearInterval(timer);
  }, [data]);

  const submit = async () => {
    if (!data || submitted.current || busy) return;
    submitted.current = true; setBusy(true); setError('');
    try {
      const payload = Object.entries(answers).map(([questionId, selectedAnswer]) => ({ questionId: Number(questionId), selectedAnswer }));
      const { data: result } = await api.post(`/quiz-attempts/${data.attempt.id}/submit`, { answers: payload });
      navigate(`/quiz-attempts/${data.attempt.id}`, { replace: true, state: { result: result.result, expired: result.expired } });
    } catch (err) { submitted.current = false; setError(err.response?.data?.message || 'Could not submit quiz.'); setBusy(false); }
  };

  useEffect(() => { if (data && seconds === 0) submit(); }, [seconds, data]);
  if (error && !data) return <section className="mx-auto w-full max-w-3xl px-6 py-12"><p role="alert" className="rounded-lg bg-red-50 p-4 text-red-700">{error}</p><Link className="mt-4 inline-block text-indigo-700 underline" to="/quizzes">Back to quizzes</Link></section>;
  if (!data) return <section className="mx-auto w-full max-w-3xl px-6 py-12"><p className="text-slate-600">{location.state?.start ? 'Starting quiz…' : 'This attempt cannot be restored. Return to quizzes to start a new attempt.'}</p>{!location.state?.start && <Link className="mt-4 inline-block text-indigo-700 underline" to="/quizzes">Back to quizzes</Link>}</section>;
  const question = data.questions[index];
  return <section className="mx-auto w-full max-w-3xl px-6 py-12">
    <div className="flex items-center justify-between gap-4"><div><p className="text-sm text-slate-500">Question {index + 1} of {data.questions.length}</p><h1 className="mt-1 text-2xl font-bold">{data.quiz.title}</h1></div>{seconds !== null && <span className={`rounded-lg px-3 py-2 font-mono font-semibold ${seconds < 60 ? 'bg-red-100 text-red-800' : 'bg-indigo-50 text-indigo-800'}`}>{clock(seconds)}</span>}</div>
    {error && <p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
    <article className="mt-6 rounded-xl border border-slate-200 bg-white p-6"><h2 className="text-lg font-semibold">{question.questionText}</h2><div className="mt-5 space-y-3">{['A', 'B', 'C', 'D'].map(letter => <label key={letter} className="flex cursor-pointer items-start gap-3 rounded-lg border border-slate-200 p-3 hover:bg-slate-50"><input type="radio" name={`q-${question.id}`} value={letter} checked={answers[question.id] === letter} onChange={() => setAnswers(current => ({ ...current, [question.id]: letter }))} /><span><strong>{letter}.</strong> {question.options[letter]}</span></label>)}</div></article>
    <div className="mt-5 flex flex-wrap justify-between gap-3"><button disabled={index === 0 || busy} onClick={() => setIndex(i => i - 1)} className="rounded-lg border border-slate-300 px-4 py-2 disabled:opacity-40">Previous</button><div className="flex gap-3">{index < data.questions.length - 1 ? <button onClick={() => setIndex(i => i + 1)} className="rounded-lg bg-indigo-600 px-4 py-2 font-semibold text-white">Next</button> : <button disabled={busy} onClick={submit} className="rounded-lg bg-indigo-600 px-4 py-2 font-semibold text-white disabled:opacity-50">{busy ? 'Submitting…' : 'Submit quiz'}</button>}</div></div>
  </section>;
}
