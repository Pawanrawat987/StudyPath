import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api.js';

function dateLabel(value) {
  return value ? new Date(value).toLocaleDateString() : '—';
}

function PendingCard({ revision, percentage, onComplete, onRemove, busy }) {
  return <article className="rounded-xl border border-slate-200 bg-white p-5">
    <div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="text-lg font-semibold">{revision.topicName}</h3><p className="mt-1 text-sm text-slate-500">{revision.subjectName}</p></div><span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">Pending</span></div>
    <p className="mt-4 text-sm text-slate-600">Current performance: <strong>{percentage === undefined ? 'No score yet' : `${percentage}%`}</strong></p>
    <div className="mt-4 flex flex-wrap gap-3"><Link to={`/topics/${revision.topicId}`} className="rounded-lg border border-indigo-600 px-4 py-2 text-sm font-semibold text-indigo-700 hover:bg-indigo-50">Start Revision</Link><button type="button" disabled={busy} onClick={() => onComplete(revision)} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">Mark Completed</button><button type="button" disabled={busy} onClick={() => onRemove(revision)} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 disabled:opacity-50">Remove</button></div>
  </article>;
}

function CompletedCard({ revision, improvement }) {
  const result = improvement?.improvement;
  return <article className="rounded-xl border border-slate-200 bg-white p-5">
    <div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="text-lg font-semibold">{revision.topicName}</h3><p className="mt-1 text-sm text-slate-500">{revision.subjectName}</p></div><span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-800">Completed</span></div>
    <p className="mt-3 text-sm text-slate-500">Completed {dateLabel(revision.completedAt)}</p>
    <div className="mt-4 rounded-lg bg-slate-50 p-4 text-sm">
      {improvement?.status === 'compared' ? <>
        <p>Before Revision: <strong>{improvement.beforePercentage}%</strong></p>
        <p className="mt-1">After Retest: <strong>{improvement.afterPercentage}%</strong></p>
        <p className="mt-1">Improvement: <strong className={result >= 0 ? 'text-green-700' : 'text-red-700'}>{result > 0 ? '+' : ''}{result} percentage points</strong></p>
      </> : improvement?.status === 'no_previous_attempt' ? <>
        <p>After Retest: <strong>{improvement.afterPercentage}%</strong></p>
        <p className="mt-1 text-slate-600">There is no earlier attempt to compare with.</p>
      </> : improvement?.beforePercentage !== null && improvement?.beforePercentage !== undefined
        ? <p>Before Revision: <strong>{improvement.beforePercentage}%</strong>. Complete a retest to compare your result.</p>
        : <p className="text-slate-600">No earlier attempt or retest is available yet.</p>}
    </div>
    <Link to={`/quizzes?topicId=${revision.topicId}`} className="mt-4 inline-flex rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700">Retest this topic</Link>
  </article>;
}

export default function Revision() {
  const [pending, setPending] = useState([]);
  const [completed, setCompleted] = useState([]);
  const [performanceByTopic, setPerformanceByTopic] = useState({});
  const [improvements, setImprovements] = useState({});
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const [pendingResponse, completedResponse, performanceResponse] = await Promise.all([
        api.get('/revision/pending'),
        api.get('/revision/completed'),
        api.get('/performance/topics'),
      ]);
      const pendingItems = pendingResponse.data.revisions;
      const completedItems = completedResponse.data.revisions;
      setPending(pendingItems);
      setCompleted(completedItems);
      setPerformanceByTopic(Object.fromEntries(performanceResponse.data.topicPerformance.map(topic => [topic.topicId, topic.percentage])));
      const improvementEntries = await Promise.all(completedItems.map(async revision => {
        try {
          const { data } = await api.get(`/revision/${revision.id}/improvement`);
          return [revision.id, data.improvement];
        } catch { return [revision.id, null]; }
      }));
      setImprovements(Object.fromEntries(improvementEntries));
      setError('');
    } catch (requestError) { setError(requestError.response?.data?.message || 'Could not load revision items.'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const complete = async revision => {
    setBusyId(revision.id); setError(''); setNotice('');
    try { await api.patch(`/revision/${revision.id}/complete`); setNotice(`${revision.topicName} marked completed.`); await load(); }
    catch (requestError) { setError(requestError.response?.data?.message || 'Could not complete this revision.'); }
    finally { setBusyId(null); }
  };

  const remove = async revision => {
    setBusyId(revision.id); setError(''); setNotice('');
    try { await api.delete(`/revision/${revision.id}`); setNotice(`${revision.topicName} removed from revision.`); await load(); }
    catch (requestError) { setError(requestError.response?.data?.message || 'Could not remove this revision.'); }
    finally { setBusyId(null); }
  };

  if (loading) return <section className="mx-auto w-full max-w-5xl px-6 py-12 text-slate-500">Loading revision list…</section>;
  return <section className="mx-auto w-full max-w-5xl px-6 py-12">
    <h1 className="text-3xl font-bold">Revision</h1>
    <p className="mt-2 text-slate-600">Review topics you have added from your weak areas, then retest to track improvement.</p>
    {notice && <p role="status" className="mt-4 rounded-lg bg-green-50 p-3 text-sm text-green-800">{notice}</p>}
    {error && <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700"><p role="alert">{error}</p><button type="button" onClick={load} className="mt-2 font-semibold underline">Retry</button></div>}
    {!error && !pending.length && !completed.length ? <div className="mt-8 rounded-xl border border-slate-200 bg-white p-8 text-center">
      <h2 className="text-xl font-semibold">No Revision Topics Yet</h2>
      <p className="mt-2 text-slate-600">Complete some quizzes first. Once the system identifies weak topics, they will appear here for revision.</p>
      <Link to="/quizzes" className="mt-5 inline-flex rounded-lg bg-indigo-600 px-5 py-2.5 font-semibold text-white hover:bg-indigo-700">Take a Quiz</Link>
    </div> : !error && <>
      <section className="mt-8"><h2 className="text-xl font-bold">Pending Revision</h2>{pending.length ? <div className="mt-4 grid gap-4 sm:grid-cols-2">{pending.map(revision => <PendingCard key={revision.id} revision={revision} percentage={performanceByTopic[revision.topicId]} onComplete={complete} onRemove={remove} busy={busyId === revision.id} />)}</div> : <p className="mt-3 rounded-lg bg-white p-5 text-slate-600">No pending topics. Add a weak topic from <Link to="/performance" className="font-semibold text-indigo-700 hover:underline">Performance</Link>.</p>}</section>
      <section className="mt-10"><h2 className="text-xl font-bold">Completed Revision</h2>{completed.length ? <div className="mt-4 grid gap-4 sm:grid-cols-2">{completed.map(revision => <CompletedCard key={revision.id} revision={revision} improvement={improvements[revision.id]} />)}</div> : <p className="mt-3 rounded-lg bg-white p-5 text-slate-600">Completed revision topics will appear here.</p>}</section>
    </>}
  </section>;
}
