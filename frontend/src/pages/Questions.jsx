import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import useAuth from '../hooks/useAuth.js';
import api from '../services/api.js';

const emptyForm = {
  questionText: '', optionA: '', optionB: '', optionC: '', optionD: '',
  correctAnswer: 'A', explanation: '', difficulty: 'medium',
};

export default function Questions() {
  const { topicId } = useParams();
  const { user } = useAuth();
  const canManage = ['teacher', 'admin'].includes(user?.role);
  const [topic, setTopic] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const [topicResponse, questionsResponse] = await Promise.all([
        api.get(`/topics/${topicId}`), api.get(`/topics/${topicId}/questions`),
      ]);
      setTopic(topicResponse.data.topic);
      setQuestions(questionsResponse.data.questions);
      setError('');
    } catch (requestError) { setError(requestError.response?.data?.message || 'Could not load questions.'); }
    finally { setLoading(false); }
  }, [topicId]);
  useEffect(() => { load(); }, [load]);

  const save = async (event) => {
    event.preventDefault(); setError(''); setMessage('');
    try {
      if (editingId) await api.put(`/questions/${editingId}`, form);
      else await api.post(`/topics/${topicId}/questions`, form);
      setEditingId(null); setForm(emptyForm); setMessage('Question saved.'); await load();
    } catch (requestError) { setError(requestError.response?.data?.message || 'Could not save question.'); }
  };
  const remove = async (id) => {
    setError(''); setMessage('');
    try { await api.delete(`/questions/${id}`); setMessage('Question deleted.'); await load(); }
    catch (requestError) { setError(requestError.response?.data?.message || 'Could not delete question.'); }
  };

  return (
    <section className="mx-auto w-full max-w-4xl px-6 py-12">
      <Link to={topic?.subjectId ? `/subjects/${topic.subjectId}` : '/subjects'} className="text-sm font-semibold text-indigo-700 hover:underline">← Topics</Link>
      <h1 className="mt-4 text-3xl font-bold">{topic?.name || 'Questions'}</h1>
      {topic?.description && <p className="mt-2 text-slate-600">{topic.description}</p>}
      {message && <p role="status" className="mt-4 rounded-lg bg-green-50 p-3 text-sm text-green-800">{message}</p>}
      {error && <p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      {canManage && (
        <form onSubmit={save} className="mt-8 space-y-4 rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="text-xl font-semibold">{editingId ? 'Edit question' : 'Add a question'}</h2>
          <label className="block text-sm font-medium text-slate-700">Question text
            <textarea className="mt-1 block min-h-20 w-full rounded-lg border border-slate-300 px-3 py-2" value={form.questionText} onChange={(event) => setForm({ ...form, questionText: event.target.value })} required />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            {['A', 'B', 'C', 'D'].map((letter) => <label key={letter} className="block text-sm font-medium text-slate-700">Option {letter}
              <input className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2" value={form[`option${letter}`]} onChange={(event) => setForm({ ...form, [`option${letter}`]: event.target.value })} required />
            </label>)}
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-sm font-medium text-slate-700">Correct answer
              <select className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2" value={form.correctAnswer} onChange={(event) => setForm({ ...form, correctAnswer: event.target.value })}>{['A', 'B', 'C', 'D'].map((letter) => <option key={letter}>{letter}</option>)}</select>
            </label>
            <label className="block text-sm font-medium text-slate-700">Difficulty
              <select className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2" value={form.difficulty} onChange={(event) => setForm({ ...form, difficulty: event.target.value })}>{['easy', 'medium', 'hard'].map((difficulty) => <option key={difficulty}>{difficulty}</option>)}</select>
            </label>
          </div>
          <label className="block text-sm font-medium text-slate-700">Explanation (optional)
            <textarea className="mt-1 block min-h-16 w-full rounded-lg border border-slate-300 px-3 py-2" value={form.explanation} onChange={(event) => setForm({ ...form, explanation: event.target.value })} />
          </label>
          <div className="flex gap-2"><button className="rounded-lg bg-indigo-600 px-5 py-2.5 font-semibold text-white">{editingId ? 'Update question' : 'Add question'}</button>{editingId && <button type="button" onClick={() => { setEditingId(null); setForm(emptyForm); }} className="rounded-lg border px-4">Cancel</button>}</div>
        </form>
      )}

      {loading ? <p className="mt-8 text-slate-500">Loading questions…</p> : questions.length ? (
        <div className="mt-8 space-y-4">
          {questions.map((question, index) => <article key={question.id} className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="flex items-start justify-between gap-4"><h2 className="font-semibold">{index + 1}. {question.questionText}</h2><span className="shrink-0 rounded-full bg-slate-100 px-3 py-1 text-xs capitalize text-slate-600">{question.difficulty}</span></div>
            <ol className="mt-4 grid gap-2 text-sm text-slate-700 sm:grid-cols-2">
              {['A', 'B', 'C', 'D'].map((letter) => <li key={letter} className="rounded-lg bg-slate-50 px-3 py-2"><strong>{letter}.</strong> {question[`option${letter}`]}</li>)}
            </ol>
            {canManage && <p className="mt-3 text-sm text-green-800">Answer: {question.correctAnswer}{question.explanation ? ` — ${question.explanation}` : ''}</p>}
            {canManage && <div className="mt-4 flex gap-4 text-sm"><button onClick={() => { setEditingId(question.id); setForm({ questionText: question.questionText, optionA: question.optionA, optionB: question.optionB, optionC: question.optionC, optionD: question.optionD, correctAnswer: question.correctAnswer, explanation: question.explanation || '', difficulty: question.difficulty }); }} className="font-semibold text-indigo-700 hover:underline">Edit</button><button onClick={() => remove(question.id)} className="font-semibold text-red-700 hover:underline">Delete</button></div>}
          </article>)}
        </div>
      ) : <p className="mt-8 rounded-lg bg-white p-6 text-slate-600">No questions are available for this topic yet.</p>}
    </section>
  );
}
