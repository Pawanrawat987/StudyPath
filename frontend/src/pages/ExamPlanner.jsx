import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api.js';

const emptyForm = { subjectId: '', legacySubjectName: '', examDate: '', notes: '' };

function localDateToday() {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

function ExamActions({ exam, onComplete, onEdit, onDelete, busy }) {
  return <>
    <div className="mt-4 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
      <Link to="/performance" className="rounded-lg border border-slate-300 px-3 py-2 text-center text-sm font-semibold text-slate-700 hover:bg-slate-50">View Performance</Link>
      <Link to="/revision" className="rounded-lg border border-slate-300 px-3 py-2 text-center text-sm font-semibold text-slate-700 hover:bg-slate-50">View Revision</Link>
      {exam.subjectId && <Link to={`/quizzes?subjectId=${exam.subjectId}`} className="rounded-lg border border-slate-300 px-3 py-2 text-center text-sm font-semibold text-slate-700 hover:bg-slate-50">View Subject Quizzes</Link>}
      {exam.status === 'upcoming' && <>
        <button type="button" disabled={busy} onClick={() => onComplete(exam)} className="rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50">Mark Exam Completed</button>
        <button type="button" disabled={busy} onClick={() => onEdit(exam)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 disabled:opacity-50">Edit</button>
        <button type="button" disabled={busy} onClick={() => onDelete(exam)} className="rounded-lg border border-red-200 px-3 py-2 text-sm font-semibold text-red-700 disabled:opacity-50">Delete</button>
      </>}
    </div>
  </>;
}

function ExamCard({ exam, onComplete, onEdit, onDelete, busy }) {
  const todayLabel = exam.daysRemaining === 0 && exam.status === 'upcoming' && !exam.isPastDue;
  return <article className="rounded-xl border border-slate-200 bg-white p-5">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div><h3 className="text-lg font-semibold">{exam.subjectName}</h3><p className="mt-1 text-sm text-slate-500">Exam date: {exam.examDate}</p></div>
      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${exam.status === 'completed' ? 'bg-green-100 text-green-800' : todayLabel ? 'bg-amber-100 text-amber-900' : 'bg-indigo-50 text-indigo-800'}`}>{exam.status === 'completed' ? 'Completed' : todayLabel ? 'Happening today' : exam.isPastDue ? 'Past due' : `${exam.daysRemaining} days remaining`}</span>
    </div>
    <dl className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
      <div className="rounded-lg bg-slate-50 p-3"><dt className="text-xs text-slate-500">Preparation</dt><dd className="mt-1 font-semibold">{exam.preparationPercentage}%</dd></div>
      <div className="rounded-lg bg-slate-50 p-3"><dt className="text-xs text-slate-500">Topics</dt><dd className="mt-1 font-semibold">{exam.topicsWithQuizAttempts}/{exam.totalTopics} attempted</dd></div>
      <div className="rounded-lg bg-slate-50 p-3"><dt className="text-xs text-slate-500">Weak topics</dt><dd className="mt-1 font-semibold">{exam.weakTopicCount}</dd></div>
      <div className="rounded-lg bg-slate-50 p-3"><dt className="text-xs text-slate-500">Pending revisions</dt><dd className="mt-1 font-semibold">{exam.pendingRevisionCount}</dd></div>
    </dl>
    {exam.notes && <p className="mt-4 whitespace-pre-wrap text-sm text-slate-600">{exam.notes}</p>}
    {!exam.subjectId && <p className="mt-4 text-sm text-slate-500">This is a custom exam subject and has no linked quizzes.</p>}
    <ExamActions exam={exam} onComplete={onComplete} onEdit={onEdit} onDelete={onDelete} busy={busy} />
  </article>;
}

export default function ExamPlanner() {
  const [subjects, setSubjects] = useState([]);
  const [subjectQuizzes, setSubjectQuizzes] = useState([]);
  const [subjectQuizzesLoading, setSubjectQuizzesLoading] = useState(false);
  const [subjectQuizzesError, setSubjectQuizzesError] = useState('');
  const [dashboard, setDashboard] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(true);
  const minDate = useMemo(localDateToday, []);

  const load = useCallback(async () => {
    const [examResult, subjectResult] = await Promise.allSettled([
      api.get('/exams/dashboard'),
      api.get('/subjects'),
    ]);

    const errors = [];
    if (examResult.status === 'fulfilled') setDashboard(examResult.value.data);
    else errors.push(examResult.reason.response?.data?.message || 'Could not load exam schedules.');

    if (subjectResult.status === 'fulfilled') {
      const subjectRows = Array.isArray(subjectResult.value.data.subjects) ? subjectResult.value.data.subjects : [];
      const subjectMap = new Map(subjectRows.map(subject => [String(subject.id), subject]));
      // Keep already scheduled subjects available for editing even if their quiz
      // was unpublished after the exam was added.
      const schedules = examResult.status === 'fulfilled'
        ? [...(examResult.value.data.upcomingExams || []), ...(examResult.value.data.completedExams || [])]
        : [];
      for (const exam of schedules) {
        if (exam.subjectId && exam.subjectName && !subjectMap.has(String(exam.subjectId))) subjectMap.set(String(exam.subjectId), { id: exam.subjectId, name: exam.subjectName });
      }
      setSubjects([...subjectMap.values()].sort((a, b) => a.name.localeCompare(b.name)));
    } else {
      errors.push(subjectResult.reason.response?.data?.message || 'Could not load subjects.');
    }

    setError(errors.join(' '));
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!/^\d+$/.test(form.subjectId)) {
      setSubjectQuizzes([]);
      setSubjectQuizzesError('');
      return undefined;
    }

    let active = true;
    setSubjectQuizzesLoading(true);
    setSubjectQuizzesError('');
    api.get(`/quizzes/subject/${form.subjectId}`)
      .then(({ data }) => { if (active) setSubjectQuizzes(data.quizzes || []); })
      .catch(requestError => {
        if (active) setSubjectQuizzesError(requestError.response?.data?.message || 'Could not load quizzes for this subject.');
      })
      .finally(() => { if (active) setSubjectQuizzesLoading(false); });

    return () => { active = false; };
  }, [form.subjectId]);

  const save = async event => {
    event.preventDefault(); setError(''); setNotice('');
    try {
      const payload = {
        examDate: form.examDate,
        notes: form.notes,
        ...(form.subjectId.startsWith('legacy:')
          ? { subjectName: form.legacySubjectName }
          : { subjectId: Number(form.subjectId) }),
      };
      if (editingId) await api.patch(`/exams/${editingId}`, payload);
      else await api.post('/exams', payload);
      setForm(emptyForm); setEditingId(null); setNotice(editingId ? 'Exam schedule updated.' : 'Exam added.'); await load();
    } catch (requestError) { setError(requestError.response?.data?.message || 'Could not save the exam.'); }
  };

  const edit = exam => {
    setEditingId(exam.id);
    setForm({
      subjectId: exam.subjectId ? String(exam.subjectId) : `legacy:${exam.id}`,
      legacySubjectName: exam.subjectId ? '' : exam.subjectName,
      examDate: exam.examDate,
      notes: exam.notes || '',
    });
    setNotice(''); setError('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const complete = async exam => {
    setBusyId(exam.id); setError(''); setNotice('');
    try { await api.patch(`/exams/${exam.id}/complete`); setNotice(`${exam.subjectName} exam marked completed.`); await load(); }
    catch (requestError) { setError(requestError.response?.data?.message || 'Could not complete the exam.'); }
    finally { setBusyId(null); }
  };

  const remove = async exam => {
    setBusyId(exam.id); setError(''); setNotice('');
    try { await api.delete(`/exams/${exam.id}`); setNotice(`${exam.subjectName} exam deleted.`); await load(); }
    catch (requestError) { setError(requestError.response?.data?.message || 'Could not delete the exam.'); }
    finally { setBusyId(null); }
  };

  if (loading) return <section className="mx-auto w-full max-w-5xl px-6 py-12 text-slate-500">Loading exam planner…</section>;
  const upcoming = dashboard?.upcomingExams || [];
  const completed = dashboard?.completedExams || [];
  return <section className="mx-auto w-full max-w-5xl px-6 py-12">
    <h1 className="text-3xl font-bold">Exam Planner</h1>
    <p className="mt-2 text-slate-600">Plan subject exams and keep track of your preparation.</p>
    <p className="mt-1 text-sm text-slate-500">Each topic is one learning area. A topic counts as prepared after a non-weak quiz result or a completed revision.</p>
    {notice && <p role="status" className="mt-4 rounded-lg bg-green-50 p-3 text-sm text-green-800">{notice}</p>}
    {error && <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700"><p role="alert">{error}</p><button type="button" onClick={load} className="mt-2 font-semibold underline">Retry</button></div>}

    <form onSubmit={save} className="mt-8 grid gap-4 rounded-xl border border-slate-200 bg-white p-5 sm:grid-cols-3">
      <h2 className="text-xl font-semibold sm:col-span-3">{editingId ? 'Edit exam' : 'Add Exam'}</h2>
      <label className="text-sm font-medium text-slate-700">Subject
        <select required value={form.subjectId} onChange={event => setForm({ ...form, subjectId: event.target.value })} className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2">
          <option value="">{subjects.length ? 'Choose a subject' : 'No subjects available'}</option>
          {subjects.map(subject => <option key={subject.id} value={subject.id}>{subject.name}</option>)}
          {editingId && form.subjectId.startsWith('legacy:') && <option value={form.subjectId}>{form.legacySubjectName}</option>}
        </select>
        {!subjects.length && <span className="mt-1 block text-xs font-normal text-slate-500">No subjects available yet. Please contact your teacher/admin.</span>}
        {editingId && form.subjectId.startsWith('legacy:') && <span className="mt-1 block text-xs font-normal text-slate-500">This older schedule uses a custom subject name. Choose a saved subject to link it to course content.</span>}
        {/^[0-9]+$/.test(form.subjectId) && <div className="mt-2 rounded-lg bg-indigo-50 p-3 font-normal">
          <p className="text-sm font-semibold text-slate-800">Quizzes for this subject</p>
          {subjectQuizzesLoading ? <p className="mt-1 text-sm text-slate-600">Loading quizzes…</p>
            : subjectQuizzesError ? <p role="alert" className="mt-1 text-sm text-red-700">{subjectQuizzesError}</p>
              : subjectQuizzes.length ? <ul className="mt-2 space-y-2">{subjectQuizzes.map(quiz => <li key={quiz.id} className="flex flex-wrap items-center justify-between gap-2 text-sm">
                <span className="text-slate-700">{quiz.title}{quiz.topic?.name ? ` · ${quiz.topic.name}` : ''}</span>
                <Link to={`/quizzes/${quiz.id}/attempt`} state={{ start: true }} className="font-semibold text-indigo-700 underline">Open quiz</Link>
              </li>)}</ul>
                : <p className="mt-1 text-sm text-slate-600">No published quizzes for this subject yet.</p>}
        </div>}
      </label>
      <label className="text-sm font-medium text-slate-700">Exam date
        <input required type="date" min={editingId ? undefined : minDate} value={form.examDate} onChange={event => setForm({ ...form, examDate: event.target.value })} className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2" />
      </label>
      <label className="text-sm font-medium text-slate-700">Notes (optional)
        <input value={form.notes} onChange={event => setForm({ ...form, notes: event.target.value })} className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2" placeholder="Semester, room, or reminders" />
      </label>
      <div className="flex gap-2 sm:col-span-3"><button disabled={!subjects.length && !(editingId && form.subjectId.startsWith('legacy:'))} className="rounded-lg bg-indigo-600 px-5 py-2.5 font-semibold text-white disabled:opacity-50">{editingId ? 'Save Changes' : 'Add Exam'}</button>{editingId && <button type="button" onClick={() => { setEditingId(null); setForm(emptyForm); }} className="rounded-lg border border-slate-300 px-4 py-2">Cancel</button>}</div>
    </form>

    {dashboard?.summary.totalExams === 0 && <p className="mt-8 rounded-lg border border-slate-200 bg-white p-6 text-slate-600">No exams planned yet. Add your upcoming exam to track your preparation.</p>}
    <section className="mt-8"><h2 className="text-xl font-bold">Upcoming Exams</h2>{upcoming.length ? <div className="mt-4 grid gap-4">{upcoming.map(exam => <ExamCard key={exam.id} exam={exam} onComplete={complete} onEdit={edit} onDelete={remove} busy={busyId === exam.id} />)}</div> : <p className="mt-3 rounded-lg bg-white p-5 text-slate-600">No upcoming exams.</p>}</section>
    <section className="mt-10"><h2 className="text-xl font-bold">Completed Exams</h2>{completed.length ? <div className="mt-4 grid gap-4">{completed.map(exam => <ExamCard key={exam.id} exam={exam} onComplete={complete} onEdit={edit} onDelete={remove} busy={busyId === exam.id} />)}</div> : <p className="mt-3 rounded-lg bg-white p-5 text-slate-600">Completed exams will appear here.</p>}</section>
  </section>;
}
