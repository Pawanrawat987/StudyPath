import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import useAuth from '../hooks/useAuth.js';
import api from '../services/api.js';

const emptyForm = { name: '', description: '' };

export default function Subjects() {
  const { user } = useAuth();
  const canManage = ['teacher', 'admin'].includes(user?.role);
  const [subjects, setSubjects] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const loadSubjects = useCallback(async () => {
    try {
      const { data } = await api.get('/subjects');
      setSubjects(data.subjects);
      setError('');
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not load subjects.');
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { loadSubjects(); }, [loadSubjects]);

  const save = async (event) => {
    event.preventDefault(); setError(''); setMessage('');
    try {
      if (editingId) await api.put(`/subjects/${editingId}`, form);
      else await api.post('/subjects', form);
      setForm(emptyForm); setEditingId(null); setMessage('Subject saved.'); await loadSubjects();
    } catch (requestError) { setError(requestError.response?.data?.message || 'Could not save subject.'); }
  };

  const edit = (subject) => { setEditingId(subject.id); setForm({ name: subject.name, description: subject.description || '' }); setMessage(''); };
  const remove = async (id) => {
    setError(''); setMessage('');
    try { await api.delete(`/subjects/${id}`); setMessage('Subject, topics, and questions deleted.'); await loadSubjects(); }
    catch (requestError) { setError(requestError.response?.data?.message || 'Could not delete subject.'); }
  };

  return (
    <section className="mx-auto w-full max-w-5xl px-6 py-12">
      <h1 className="text-3xl font-bold">Subjects</h1>
      <p className="mt-2 text-slate-600">Browse subjects and explore their topics.</p>
      {canManage && <p className="mt-3 text-sm text-amber-800">Deleting a subject also deletes its topics and questions.</p>}
      {message && <p role="status" className="mt-4 rounded-lg bg-green-50 p-3 text-sm text-green-800">{message}</p>}
      {error && <p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      {canManage && (
        <form onSubmit={save} className="mt-8 grid gap-3 rounded-xl border border-slate-200 bg-white p-5 sm:grid-cols-[1fr_2fr_auto]">
          <input aria-label="Subject name" className="rounded-lg border border-slate-300 px-3 py-2" placeholder="Subject name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required />
          <input aria-label="Description" className="rounded-lg border border-slate-300 px-3 py-2" placeholder="Description (optional)" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
          <div className="flex gap-2">
            <button className="rounded-lg bg-indigo-600 px-4 py-2 font-semibold text-white">{editingId ? 'Update' : 'Add subject'}</button>
            {editingId && <button type="button" onClick={() => { setEditingId(null); setForm(emptyForm); }} className="rounded-lg border px-3">Cancel</button>}
          </div>
        </form>
      )}

      {loading ? <p className="mt-8 text-slate-500">Loading subjects…</p> : subjects.length ? (
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {subjects.map((subject) => (
            <article key={subject.id} className="rounded-xl border border-slate-200 bg-white p-5">
              <h2 className="text-xl font-semibold"><Link className="text-indigo-700 hover:underline" to={`/subjects/${subject.id}`}>{subject.name}</Link></h2>
              <p className="mt-2 text-sm text-slate-600">{subject.description || 'No description yet.'}</p>
              <div className="mt-4 flex gap-4 text-sm">
                <Link className="font-semibold text-indigo-700 hover:underline" to={`/subjects/${subject.id}`}>View topics</Link>
                {canManage && <button onClick={() => edit(subject)} className="font-semibold text-slate-700 hover:underline">Edit</button>}
                {canManage && <button onClick={() => remove(subject.id)} className="font-semibold text-red-700 hover:underline">Delete</button>}
              </div>
            </article>
          ))}
        </div>
      ) : <p className="mt-8 rounded-lg bg-white p-6 text-slate-600">No subjects have been added yet.</p>}
    </section>
  );
}
