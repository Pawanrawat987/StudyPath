import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api.js';

const statusStyle = {
  Strong: 'bg-green-100 text-green-800',
  Average: 'bg-amber-100 text-amber-800',
  Weak: 'bg-red-100 text-red-800',
};

function Status({ value }) {
  return <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusStyle[value] || 'bg-slate-100 text-slate-700'}`}>{value}</span>;
}

function LearningGroup({ title, topics, emptyText, onAddTopic, revisionTopicIds, addingTopicId, revisionNotices }) {
  return <section className="rounded-xl border border-slate-200 bg-white p-5">
    <h3 className="text-lg font-semibold">{title}</h3>
    {topics.length ? <ul className="mt-4 space-y-3">{topics.map(topic => <li key={topic.topicId} className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3 last:border-0 last:pb-0">
      <div><p className="font-medium">{topic.topicName}</p><p className="text-sm text-slate-500">{topic.subjectName} · {topic.incorrectAnswers} incorrect</p></div>
      <Status value={topic.status} />
      <span className="font-semibold tabular-nums">{topic.percentage}%</span>
      {onAddTopic && <div className="w-full text-right">
        {revisionTopicIds.has(topic.topicId)
          ? <Link to="/revision" className="text-sm font-semibold text-indigo-700 hover:underline">In Revision · View list</Link>
          : <button type="button" disabled={addingTopicId === topic.topicId} onClick={() => onAddTopic(topic)} className="text-sm font-semibold text-indigo-700 hover:underline disabled:opacity-50">{addingTopicId === topic.topicId ? 'Adding…' : 'Add to Revision'}</button>}
        {revisionNotices[topic.topicId] && <p role="status" className="mt-1 text-xs text-green-700">{revisionNotices[topic.topicId]}</p>}
      </div>}
    </li>)}</ul> : <p className="mt-3 text-sm text-slate-500">{emptyText}</p>}
  </section>;
}

export default function Performance() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [revisionTopicIds, setRevisionTopicIds] = useState(new Set());
  const [addingTopicId, setAddingTopicId] = useState(null);
  const [revisionNotices, setRevisionNotices] = useState({});

  const load = useCallback(() => {
    setLoading(true);
    setError('');
    Promise.all([api.get('/performance'), api.get('/revision')])
      .then(([performanceResponse, revisionResponse]) => {
        setData(performanceResponse.data);
        setRevisionTopicIds(new Set(revisionResponse.data.revisions.map(item => item.topicId)));
      })
      .catch(requestError => setError(requestError.response?.data?.message || 'Could not load performance data.'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const addToRevision = async topic => {
    setAddingTopicId(topic.topicId);
    setRevisionNotices(current => ({ ...current, [topic.topicId]: '' }));
    try {
      await api.post('/revision', { topicId: topic.topicId });
      setRevisionTopicIds(current => new Set(current).add(topic.topicId));
      setRevisionNotices(current => ({ ...current, [topic.topicId]: 'Added to your pending revision list.' }));
    } catch (requestError) {
      if (requestError.response?.status === 409) {
        setRevisionTopicIds(current => new Set(current).add(topic.topicId));
        setRevisionNotices(current => ({ ...current, [topic.topicId]: 'This topic is already in your revision list.' }));
      } else {
        setRevisionNotices(current => ({ ...current, [topic.topicId]: requestError.response?.data?.message || 'Could not add this topic.' }));
      }
    } finally { setAddingTopicId(null); }
  };

  if (loading) return <section className="mx-auto w-full max-w-5xl px-6 py-12 text-slate-500">Loading performance…</section>;
  if (error) return <section className="mx-auto w-full max-w-5xl px-6 py-12"><p role="alert" className="rounded-lg bg-red-50 p-4 text-red-700">{error}</p><button type="button" onClick={load} className="mt-4 rounded-lg bg-indigo-600 px-4 py-2 font-semibold text-white">Retry</button></section>;

  const overview = data.overview;
  const empty = overview.totalQuizzesAttempted === 0;
  return <section className="mx-auto w-full max-w-5xl px-6 py-12">
    <h1 className="text-3xl font-bold">Performance</h1>
    <p className="mt-2 text-slate-600">Review your quiz results and find topics to focus on.</p>
    {empty ? <div className="mt-8 rounded-xl border border-indigo-100 bg-white p-8 text-center">
      <h2 className="text-xl font-semibold">No Performance Data Yet</h2>
      <p className="mt-2 text-slate-600">You haven't completed any quizzes yet. Take a quiz to start tracking your performance.</p>
      <Link to="/quizzes" className="mt-5 inline-flex rounded-lg bg-indigo-600 px-5 py-2.5 font-semibold text-white hover:bg-indigo-700">Take a Quiz</Link>
    </div> : <>
      <section className="mt-8 rounded-xl border border-indigo-100 bg-white p-6">
        <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-sm font-medium text-slate-500">Overall percentage</p><p className="mt-1 text-4xl font-bold text-indigo-700">{overview.overallPercentage}%</p></div><p className="text-sm text-slate-500">{overview.totalMarksObtained} of {overview.totalPossibleMarks} marks</p></div>
        <dl className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            ['Quizzes', overview.totalQuizzesAttempted],
            ['Questions attempted', overview.totalQuestionsAttempted],
            ['Correct', overview.totalCorrectAnswers],
            ['Incorrect', overview.totalIncorrectAnswers],
          ].map(([label, value]) => <div key={label} className="rounded-lg bg-slate-50 p-4"><dt className="text-sm text-slate-500">{label}</dt><dd className="mt-1 text-2xl font-semibold">{value}</dd></div>)}
        </dl>
      </section>

      <section className="mt-8">
        <h2 className="text-xl font-bold">Subject performance</h2>
        {data.subjectPerformance.length ? <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200 bg-white"><table className="w-full min-w-[600px] text-left text-sm"><thead className="bg-slate-50 text-slate-600"><tr><th className="px-4 py-3 font-semibold">Subject</th><th className="px-4 py-3 font-semibold">Attempted</th><th className="px-4 py-3 font-semibold">Correct</th><th className="px-4 py-3 font-semibold">Percentage</th><th className="px-4 py-3 font-semibold">Status</th></tr></thead><tbody>{data.subjectPerformance.map(subject => <tr key={subject.subjectId} className="border-t border-slate-100"><td className="px-4 py-3 font-medium">{subject.subjectName}</td><td className="px-4 py-3">{subject.questionsAttempted}</td><td className="px-4 py-3">{subject.correctAnswers}</td><td className="px-4 py-3">{subject.percentage}%</td><td className="px-4 py-3"><Status value={subject.status} /></td></tr>)}</tbody></table></div> : <p className="mt-3 text-sm text-slate-500">No subject results yet.</p>}
      </section>

      <section className="mt-8">
        <h2 className="text-xl font-bold">Topic performance</h2>
        {data.topicPerformance.length ? <div className="mt-4 grid gap-3 sm:grid-cols-2">{data.topicPerformance.map(topic => <article key={topic.topicId} className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4"><div><h3 className="font-semibold">{topic.topicName}</h3><p className="mt-1 text-sm text-slate-500">{topic.subjectName} · {topic.questionsAttempted} attempted · {topic.incorrectAnswers} incorrect</p></div><div className="text-right"><p className="font-bold">{topic.percentage}%</p><Status value={topic.status} /></div></article>)}</div> : <p className="mt-3 text-sm text-slate-500">No topic results yet.</p>}
      </section>

      <section className="mt-8">
        <h2 className="text-xl font-bold">Learning areas</h2>
        <div className="mt-4 grid gap-4 lg:grid-cols-3">
          <LearningGroup title="Weak Topics" topics={data.weakTopics} emptyText="No weak topics." onAddTopic={addToRevision} revisionTopicIds={revisionTopicIds} addingTopicId={addingTopicId} revisionNotices={revisionNotices} />
          <LearningGroup title="Average Topics" topics={data.averageTopics} emptyText="No average topics." />
          <LearningGroup title="Strong Topics" topics={data.strongTopics} emptyText="No strong topics yet." />
        </div>
      </section>
    </>}
  </section>;
}
