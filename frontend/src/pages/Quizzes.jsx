import { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import useAuth from '../hooks/useAuth.js';
import api from '../services/api.js';

const blank = { title: '', description: '', topicId: '', timeLimit: '' };

function StudentQuizBrowser() {
  const [searchParams] = useSearchParams();
  const subjectParam = searchParams.get('subjectId') || '';
  const topicParam = searchParams.get('topicId') || '';
  const [subjects, setSubjects] = useState([]);
  const [topics, setTopics] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [subjectId, setSubjectId] = useState(subjectParam);
  const [topicId, setTopicId] = useState(topicParam);
  const [subjectsLoading, setSubjectsLoading] = useState(true);
  const [topicsLoading, setTopicsLoading] = useState(false);
  const [quizzesLoading, setQuizzesLoading] = useState(false);
  const [subjectsError, setSubjectsError] = useState('');
  const [topicsError, setTopicsError] = useState('');
  const [quizzesError, setQuizzesError] = useState('');
  const [retrySubjects, setRetrySubjects] = useState(0);
  const [retryTopics, setRetryTopics] = useState(0);
  const [retryQuizzes, setRetryQuizzes] = useState(0);
  const selectedSubject = subjects.find(subject => String(subject.id) === String(subjectId));
  const selectedTopic = topics.find(topic => String(topic.id) === String(topicId));

  useEffect(() => {
    let active = true;
    setSubjectsLoading(true);
    api.get('/subjects')
      .then(({ data }) => {
        if (!active) return;
        const items = Array.isArray(data.subjects) ? data.subjects : [];
        setSubjects(items);
        setSubjectsError('');
        if (subjectParam && items.some(subject => String(subject.id) === subjectParam)) setSubjectId(subjectParam);
      })
      .catch(requestError => { if (active) setSubjectsError(requestError.response?.data?.message || 'Could not load subjects.'); })
      .finally(() => { if (active) setSubjectsLoading(false); });
    return () => { active = false; };
  }, [subjectParam, retrySubjects]);

  useEffect(() => {
    if (!topicParam) return undefined;
    let active = true;
    api.get(`/topics/${topicParam}`)
      .then(({ data }) => {
        if (!active) return;
        const topic = data.topic;
        if (topic?.subjectId) setSubjectId(String(topic.subjectId));
        if (topic?.id) setTopicId(String(topic.id));
      })
      .catch(requestError => { if (active) setTopicsError(requestError.response?.data?.message || 'Could not load the selected topic.'); });
    return () => { active = false; };
  }, [topicParam]);

  useEffect(() => {
    if (!subjectId) {
      setTopics([]);
      setTopicsLoading(false);
      return undefined;
    }
    let active = true;
    setTopicsLoading(true);
    setTopics([]);
    setTopicsError('');
    api.get(`/subjects/${subjectId}/topics`)
      .then(({ data }) => { if (active) setTopics(Array.isArray(data.topics) ? data.topics : []); })
      .catch(requestError => { if (active) setTopicsError(requestError.response?.data?.message || 'Could not load topics.'); })
      .finally(() => { if (active) setTopicsLoading(false); });
    return () => { active = false; };
  }, [subjectId, retryTopics]);

  useEffect(() => {
    if (!topicId) {
      setQuizzes([]);
      setQuizzesLoading(false);
      return undefined;
    }
    let active = true;
    setQuizzesLoading(true);
    setQuizzes([]);
    setQuizzesError('');
    api.get(`/quizzes/topic/${topicId}`)
      .then(({ data }) => { if (active) setQuizzes(Array.isArray(data.quizzes) ? data.quizzes : []); })
      .catch(requestError => { if (active) setQuizzesError(requestError.response?.data?.message || 'Could not load quizzes.'); })
      .finally(() => { if (active) setQuizzesLoading(false); });
    return () => { active = false; };
  }, [topicId, retryQuizzes]);

  const chooseSubject = id => {
    setSubjectId(String(id));
    setTopicId('');
    setTopicsError('');
    setQuizzesError('');
  };

  return <section className="mx-auto w-full max-w-5xl px-6 py-10 sm:py-12">
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div><p className="text-sm font-semibold uppercase tracking-wide text-indigo-700">Student learning</p><h1 className="mt-1 text-3xl font-bold">Take a Quiz</h1><p className="mt-2 text-slate-600">Choose a subject, then a topic, and start any published quiz.</p></div>
      <Link to="/quiz-attempts" className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-white">My results</Link>
    </div>

    <section className="mt-8">
      <h2 className="text-xl font-bold">Choose a Subject</h2>
      {subjectsLoading ? <p className="mt-3 text-slate-500">Loading subjects...</p>
        : subjectsError ? <div className="mt-3 rounded-lg bg-red-50 p-4 text-sm text-red-700"><p role="alert">{subjectsError}</p><button type="button" onClick={() => setRetrySubjects(value => value + 1)} className="mt-2 font-semibold underline">Retry</button></div>
          : subjects.length ? <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{subjects.map(subject => <button type="button" key={subject.id} onClick={() => chooseSubject(subject.id)} aria-pressed={String(subject.id) === String(subjectId)} className={`rounded-xl border p-4 text-left transition ${String(subject.id) === String(subjectId) ? 'border-indigo-600 bg-indigo-50 ring-2 ring-indigo-100' : 'border-slate-200 bg-white hover:border-indigo-300'}`}><span className="block font-semibold">{subject.name}</span>{subject.description && <span className="mt-1 block text-sm text-slate-600">{subject.description}</span>}</button>)}</div>
            : <p className="mt-3 rounded-lg bg-white p-5 text-slate-600">No subjects available yet. Please contact your teacher/admin.</p>}
    </section>

    {subjectId && <section className="mt-9">
      <div className="flex flex-wrap items-baseline justify-between gap-2"><h2 className="text-xl font-bold">Topics in {selectedSubject?.name || 'Selected Subject'}</h2><button type="button" onClick={() => { setSubjectId(''); setTopicId(''); }} className="text-sm font-semibold text-indigo-700 hover:underline">Choose another subject</button></div>
      {topicsLoading ? <p className="mt-3 text-slate-500">Loading topics...</p>
        : topicsError ? <div className="mt-3 rounded-lg bg-red-50 p-4 text-sm text-red-700"><p role="alert">{topicsError}</p><button type="button" onClick={() => setRetryTopics(value => value + 1)} className="mt-2 font-semibold underline">Retry</button></div>
          : topics.length ? <div className="mt-4 flex flex-wrap gap-2">{topics.map(topic => <button type="button" key={topic.id} onClick={() => setTopicId(String(topic.id))} aria-pressed={String(topic.id) === String(topicId)} className={`rounded-full border px-4 py-2 text-sm font-semibold ${String(topic.id) === String(topicId) ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-slate-300 bg-white text-slate-700 hover:border-indigo-400'}`}>{topic.name}</button>)}</div>
            : <p className="mt-3 rounded-lg bg-white p-5 text-slate-600">No topics available for this subject yet.</p>}
    </section>}

    {topicId && <section className="mt-9">
      <div className="flex flex-wrap items-baseline justify-between gap-2"><h2 className="text-xl font-bold">Available Quizzes{selectedTopic ? ` — ${selectedTopic.name}` : ''}</h2><button type="button" onClick={() => setTopicId('')} className="text-sm font-semibold text-indigo-700 hover:underline">Choose another topic</button></div>
      {quizzesLoading ? <p className="mt-3 text-slate-500">Loading quizzes...</p>
        : quizzesError ? <div className="mt-3 rounded-lg bg-red-50 p-4 text-sm text-red-700"><p role="alert">{quizzesError}</p><button type="button" onClick={() => setRetryQuizzes(value => value + 1)} className="mt-2 font-semibold underline">Retry</button></div>
          : quizzes.length ? <div className="mt-4 grid gap-4 sm:grid-cols-2">{quizzes.map(quiz => <article key={quiz.id} className="rounded-xl border border-slate-200 bg-white p-5"><h3 className="text-lg font-bold">{quiz.title}</h3><p className="mt-2 text-sm text-slate-600">{quiz.topic?.subject?.name} {quiz.topic?.subject?.name && quiz.topic?.name ? '·' : ''} {quiz.topic?.name}</p><p className="mt-2 text-sm text-slate-500">{quiz.questionCount} {quiz.questionCount === 1 ? 'question' : 'questions'} · {quiz.timeLimit ? `${quiz.timeLimit} minutes` : 'No time limit'}</p>{quiz.questionCount > 0 ? <Link to={`/quizzes/${quiz.id}/attempt`} state={{ start: true }} className="mt-4 inline-flex rounded-lg bg-indigo-600 px-4 py-2 font-semibold text-white hover:bg-indigo-700">Start Quiz</Link> : <p className="mt-4 text-sm font-medium text-amber-800">Questions are not available for this quiz yet.</p>}</article>)}</div>
            : <p className="mt-3 rounded-lg bg-white p-5 text-slate-600">No published quizzes are available for this topic yet.</p>}
    </section>}
  </section>;
}

export default function Quizzes() {
  const [searchParams] = useSearchParams();
  const topicId = searchParams.get('topicId');
  const subjectId = searchParams.get('subjectId');
  const { user } = useAuth();
  const canManage = ['teacher', 'admin'].includes(user?.role);
  const [quizzes, setQuizzes] = useState([]);
  const [topics, setTopics] = useState([]);
  const [form, setForm] = useState(blank);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [questionManager, setQuestionManager] = useState(null);
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [topicQuestions, setTopicQuestions] = useState([]);

  const load = useCallback(async () => {
    try {
      const filter = topicId ? `/quizzes/topic/${topicId}` : subjectId ? `/quizzes/subject/${subjectId}` : '/quizzes';
      const { data } = await api.get(filter);
      setQuizzes(data.quizzes);
      setError('');
    } catch (err) { setError(err.response?.data?.message || 'Could not load quizzes.'); }
    finally { setLoading(false); }
  }, [topicId, subjectId]);

  useEffect(() => {
    if (!canManage) return;
    load();
    api.get('/subjects').then(async ({ data }) => {
      const lists = await Promise.all(data.subjects.map(subject => api.get(`/subjects/${subject.id}/topics`)));
      setTopics(lists.flatMap((response, index) => response.data.topics.map(topic => ({ ...topic, subjectName: data.subjects[index].name }))));
    }).catch(err => setError(err.response?.data?.message || 'Could not load topics.'));
  }, [canManage, load]);

  const save = async event => {
    event.preventDefault(); setError(''); setMessage('');
    const payload = { ...form, topicId: Number(form.topicId), timeLimit: form.timeLimit ? Number(form.timeLimit) : null };
    try {
      if (editingId) await api.put(`/quizzes/${editingId}`, payload);
      else await api.post('/quizzes', payload);
      setForm(blank); setEditingId(null); setMessage('Quiz saved.'); await load();
    } catch (err) { setError(err.response?.data?.message || 'Could not save quiz.'); }
  };
  const edit = quiz => { setEditingId(quiz.id); setForm({ title: quiz.title, description: quiz.description || '', topicId: String(quiz.topicId), timeLimit: quiz.timeLimit || '' }); };
  const publish = async quiz => {
    setError(''); setMessage('');
    try { await api.post(`/quizzes/${quiz.id}/${quiz.isPublished ? 'unpublish' : 'publish'}`); setMessage(quiz.isPublished ? 'Quiz unpublished.' : 'Quiz published.'); await load(); }
    catch (err) { setError(err.response?.data?.message || 'Could not update publication status.'); }
  };
  const remove = async quiz => {
    setError(''); setMessage('');
    try { await api.delete(`/quizzes/${quiz.id}`); setMessage('Quiz deleted.'); await load(); }
    catch (err) { setError(err.response?.data?.message || 'Could not delete quiz.'); }
  };

  const manageQuestions = async quiz => {
    setError(''); setMessage('');
    if (questionManager === quiz.id) { setQuestionManager(null); return; }
    try {
      const [assigned, available] = await Promise.all([
        api.get(`/quizzes/${quiz.id}/questions`), api.get(`/topics/${quiz.topicId}/questions`),
      ]);
      setQuizQuestions(assigned.data.questions);
      setTopicQuestions(available.data.questions);
      setQuestionManager(quiz.id);
    } catch (err) { setError(err.response?.data?.message || 'Could not load quiz questions.'); }
  };
  const changeQuestion = async (quiz, question, assigned) => {
    setError(''); setMessage('');
    try {
      if (assigned) await api.delete(`/quizzes/${quiz.id}/questions/${question.id}`);
      else await api.post(`/quizzes/${quiz.id}/questions`, { questionId: question.id });
      const { data } = await api.get(`/quizzes/${quiz.id}/questions`);
      setQuizQuestions(data.questions);
      setMessage(assigned ? 'Question removed.' : 'Question added.');
    } catch (err) { setError(err.response?.data?.message || 'Could not update quiz questions.'); }
  };

  if (!canManage) return <StudentQuizBrowser />;

  return <section className="mx-auto w-full max-w-5xl px-6 py-12">
    <h1 className="text-3xl font-bold">Quizzes</h1>
    <p className="mt-2 text-slate-600">{topicId ? 'Published quizzes for this topic.' : subjectId ? 'Published quizzes for this subject.' : canManage ? 'Create and publish quizzes for a topic.' : 'Choose a published quiz to begin.'}</p>
    {message && <p role="status" className="mt-4 rounded-lg bg-green-50 p-3 text-sm text-green-800">{message}</p>}
    {error && <p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
    {canManage && <form onSubmit={save} className="mt-8 grid gap-3 rounded-xl border border-slate-200 bg-white p-5 sm:grid-cols-2">
      <h2 className="text-xl font-semibold sm:col-span-2">{editingId ? 'Edit quiz' : 'Create quiz'}</h2>
      <input aria-label="Quiz title" className="rounded-lg border border-slate-300 px-3 py-2" placeholder="Quiz title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required />
      <select aria-label="Topic" className="rounded-lg border border-slate-300 bg-white px-3 py-2" value={form.topicId} onChange={e => setForm({ ...form, topicId: e.target.value })} required><option value="">Choose a topic</option>{topics.map(topic => <option key={topic.id} value={topic.id}>{topic.subjectName} — {topic.name}</option>)}</select>
      <input aria-label="Description" className="rounded-lg border border-slate-300 px-3 py-2" placeholder="Description (optional)" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
      <input aria-label="Time limit in minutes" type="number" min="1" max="600" className="rounded-lg border border-slate-300 px-3 py-2" placeholder="Time limit in minutes (optional)" value={form.timeLimit} onChange={e => setForm({ ...form, timeLimit: e.target.value })} />
      <div className="flex gap-2 sm:col-span-2"><button className="rounded-lg bg-indigo-600 px-5 py-2.5 font-semibold text-white">{editingId ? 'Save changes' : 'Create quiz'}</button>{editingId && <button type="button" onClick={() => { setEditingId(null); setForm(blank); }} className="rounded-lg border px-4">Cancel</button>}</div>
    </form>}
    {loading ? <p className="mt-8 text-slate-500">Loading quizzes…</p> : quizzes.length ? <div className="mt-8 grid gap-4 sm:grid-cols-2">
      {quizzes.map(quiz => <article key={quiz.id} className="rounded-xl border border-slate-200 bg-white p-5">
        <div className="flex items-start justify-between gap-3"><h2 className="text-xl font-semibold">{quiz.title}</h2>{canManage && <span className={`rounded-full px-3 py-1 text-xs ${quiz.isPublished ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-600'}`}>{quiz.isPublished ? 'Published' : 'Draft'}</span>}</div>
        <p className="mt-2 text-sm text-slate-600">{quiz.topic?.subject?.name} · {quiz.topic?.name}</p>
        <p className="mt-2 text-sm text-slate-600">{quiz.description || 'No description.'}{quiz.timeLimit ? ` · ${quiz.timeLimit} minutes` : ''}</p>
        {canManage ? <><div className="mt-4 flex flex-wrap gap-4 text-sm"><button onClick={() => edit(quiz)} className="font-semibold text-indigo-700">Edit</button><button onClick={() => publish(quiz)} className="font-semibold text-slate-700">{quiz.isPublished ? 'Unpublish' : 'Publish'}</button><button onClick={() => remove(quiz)} className="font-semibold text-red-700">Delete</button><button onClick={() => manageQuestions(quiz)} className="font-semibold text-indigo-700">{questionManager === quiz.id ? 'Close questions' : 'Manage questions'}</button></div>
          {questionManager === quiz.id && <div className="mt-5 border-t pt-4"><h3 className="font-semibold">Assigned questions ({quizQuestions.length})</h3><ul className="mt-2 space-y-2">{quizQuestions.map(question => <li key={question.id} className="flex items-start justify-between gap-3 rounded-lg bg-slate-50 p-3 text-sm"><span>{question.questionText}</span><button onClick={() => changeQuestion(quiz, question, true)} className="shrink-0 font-semibold text-red-700">Remove</button></li>)}</ul><h3 className="mt-5 font-semibold">Available topic questions</h3><ul className="mt-2 space-y-2">{topicQuestions.filter(question => !quizQuestions.some(assigned => assigned.id === question.id)).map(question => <li key={question.id} className="flex items-start justify-between gap-3 rounded-lg bg-slate-50 p-3 text-sm"><span>{question.questionText}</span><button onClick={() => changeQuestion(quiz, question, false)} className="shrink-0 font-semibold text-indigo-700">Add</button></li>)}</ul>{!topicQuestions.length && <p className="mt-2 text-sm text-slate-500">No questions exist for this topic yet.</p>}</div>}
        </> : <Link to={`/quizzes/${quiz.id}/attempt`} state={{ start: true }} className="mt-4 inline-flex rounded-lg bg-indigo-600 px-4 py-2 font-semibold text-white">Start quiz</Link>}
      </article>)}
    </div> : <p className="mt-8 rounded-lg bg-white p-6 text-slate-600">{topicId ? 'No published quizzes are available for this topic yet.' : subjectId ? 'No published quizzes are available for this subject yet.' : canManage ? 'No quizzes have been created yet.' : 'No published quizzes are available yet.'}</p>}
  </section>;
}
