import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../services/api.js';

export default function AdminStudents() {
  const { studentId } = useParams();
  const [students, setStudents] = useState([]);
  const [detail, setDetail] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    setLoading(true);
    const request = studentId ? api.get(`/admin/students/${studentId}/performance`) : api.get('/admin/students');
    request.then(({ data }) => studentId ? setDetail(data) : setStudents(data.students)).catch((err) => setError(err.response?.data?.message || 'Could not load student information.')).finally(() => setLoading(false));
  }, [studentId]);

  return <section className="mx-auto w-full max-w-5xl px-6 py-12">
    <Link to="/admin/students" className="text-sm font-semibold text-indigo-700 hover:underline">← Students</Link>
    <h1 className="mt-3 text-3xl font-bold">{studentId ? detail?.student?.name || 'Student performance' : 'Students'}</h1>
    {error && <p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-red-700">{error}</p>}
    {loading ? <p className="mt-8 text-slate-500">Loading…</p> : studentId && detail ? <>
      <p className="mt-2 text-slate-600">{detail.student.email}</p>
      <article className="mt-6 rounded-xl border bg-white p-5"><p className="text-sm text-slate-600">Overall performance</p><p className="mt-1 text-3xl font-bold">{detail.overallPercentage}%</p><p className="mt-2 text-sm text-slate-600">{detail.totalQuizzesAttempted} completed quiz attempts · {detail.totalQuestionsAttempted} questions answered</p></article>
      {[['Strong topics', detail.strongTopics], ['Average topics', detail.averageTopics], ['Topics to review', detail.weakTopics]].map(([label, topics]) => <section key={label} className="mt-6"><h2 className="text-xl font-semibold">{label}</h2>{topics.length ? <ul className="mt-3 grid gap-2 sm:grid-cols-2">{topics.map((topic) => <li key={topic.topicId} className="rounded-lg border bg-white p-4">{topic.subjectName} · {topic.topicName}<span className="float-right font-semibold">{topic.percentage}%</span></li>)}</ul> : <p className="mt-2 text-slate-500">No topic data yet.</p>}</section>)}
    </> : !studentId && <div className="mt-8 overflow-x-auto rounded-xl border bg-white"><table className="w-full text-left text-sm"><thead className="bg-slate-100"><tr>{['Name', 'Email', 'Account status', 'Quiz attempts', 'Average performance'].map((label) => <th key={label} className="px-4 py-3">{label}</th>)}</tr></thead><tbody>{students.map((student) => <tr key={student.id} className="border-t"><td className="px-4 py-3"><Link className="font-semibold text-indigo-700 hover:underline" to={`/admin/students/${student.id}`}>{student.name}</Link></td><td className="px-4 py-3">{student.email}</td><td className="px-4 py-3">{student.accountStatus.replaceAll('_', ' ')}</td><td className="px-4 py-3">{student.attemptCount}</td><td className="px-4 py-3">{student.averagePerformance === null ? 'No attempts' : `${student.averagePerformance}%`}</td></tr>)}</tbody></table>{!students.length && <p className="p-5 text-slate-600">No students found.</p>}</div>}
  </section>;
}
