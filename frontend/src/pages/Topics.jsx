import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import useAuth from '../hooks/useAuth.js';
import api from '../services/api.js';

const emptyForm = { name: '', description: '' };

export default function Topics() {
  const { subjectId } = useParams();
  const { user } = useAuth();
  const canManage = ['teacher', 'admin'].includes(user?.role);
  const [subject, setSubject] = useState(null);
  const [topics, setTopics] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const [subjectResponse, topicsResponse] = await Promise.all([
        api.get(`/subjects/${subjectId}`), api.get(`/subjects/${subjectId}/topics`),
      ]);
      setSubject(subjectResponse.data.subject);
      setTopics(topicsResponse.data.topics);
      setError('');
    } catch (requestError) { setError(requestError.response?.data?.message || 'Could not load topics.'); }
    finally { setLoading(false); }
  }, [subjectId]);
  useEffect(() => { load(); }, [load]);

  const save = async (event) => {
    event.preventDefault(); setError(''); setMessage('');
    try {
      if (editingId) await api.put(`/topics/${editingId}`, form);
      else await api.post(`/subjects/${subjectId}/topics`, form);
      setEditingId(null); setForm(emptyForm); setMessage('Topic saved.'); await load();
    } catch (requestError) { setError(requestError.response?.data?.message || 'Could not save topic.'); }
  };
  const remove = async (id) => {
    setError(''); setMessage('');
    try { await api.delete(`/topics/${id}`); setMessage('Topic and its questions deleted.'); await load(); }
    catch (requestError) { setError(requestError.response?.data?.message || 'Could not delete topic.'); }
  };

  return (
    <section className="mx-auto w-full max-w-5xl px-6 py-12">
      <Link to="/subjects" className="text-sm font-semibold text-indigo-700 hover:underline">← Subjects</Link>
      <h1 className="mt-4 text-3xl font-bold">{subject?.name || 'Topics'}</h1>
      {subject?.description && <p className="mt-2 text-slate-600">{subject.description}</p>}
      {canManage && <p className="mt-3 text-sm text-amber-800">Deleting a topic also deletes its questions.</p>}
      {message && <p role="status" className="mt-4 rounded-lg bg-green-50 p-3 text-sm text-green-800">{message}</p>}
      {error && <p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {canManage && (
        <form onSubmit={save} className="mt-8 grid gap-3 rounded-xl border border-slate-200 bg-white p-5 sm:grid-cols-[1fr_2fr_auto]">
          <input aria-label="Topic name" className="rounded-lg border border-slate-300 px-3 py-2" placeholder="Topic name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required />
          <input aria-label="Description" className="rounded-lg border border-slate-300 px-3 py-2" placeholder="Description (optional)" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
          <div className="flex gap-2"><button className="rounded-lg bg-indigo-600 px-4 py-2 font-semibold text-white">{editingId ? 'Update' : 'Add topic'}</button>{editingId && <button type="button" onClick={() => { setEditingId(null); setForm(emptyForm); }} className="rounded-lg border px-3">Cancel</button>}</div>
        </form>
      )}
      {loading ? <p className="mt-8 text-slate-500">Loading topics…</p> : topics.length ? (
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {topics.map((topic) => <article key={topic.id} className="rounded-xl border border-slate-200 bg-white p-5">
            <h2 className="text-xl font-semibold"><Link to={`/topics/${topic.id}`} className="text-indigo-700 hover:underline">{topic.name}</Link></h2>
            <p className="mt-2 text-sm text-slate-600">{topic.description || 'No description yet.'}</p>
            <div className="mt-4 flex gap-4 text-sm"><Link to={`/topics/${topic.id}`} className="font-semibold text-indigo-700 hover:underline">View questions</Link>{canManage && <button onClick={() => { setEditingId(topic.id); setForm({ name: topic.name, description: topic.description || '' }); }} className="font-semibold hover:underline">Edit</button>}{canManage && <button onClick={() => remove(topic.id)} className="font-semibold text-red-700 hover:underline">Delete</button>}</div>
          </article>)}
        </div>
      ) : <p className="mt-8 rounded-lg bg-white p-6 text-slate-600">No topics have been added to this subject yet.</p>}
    </section>
  );
}
