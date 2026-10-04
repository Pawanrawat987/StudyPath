import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth.js';

const navItemClass = ({ isActive }) => `nav-item${isActive ? ' nav-item-active' : ''}`;

export default function MainLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center justify-between gap-3 px-6 py-4">
          <Link to="/" className="nav-brand text-xl font-bold text-indigo-600">
            StudyPath
          </Link>
          <nav className="flex w-full flex-wrap items-center justify-start gap-x-3 gap-y-2 text-sm font-medium sm:w-auto sm:justify-end sm:gap-4">
            {user ? (
              <>
                <NavLink to={['teacher', 'admin'].includes(user.role) ? '/admin' : '/dashboard'} end className={navItemClass}>Dashboard</NavLink>
                <NavLink to="/subjects" className={navItemClass}>
                  Subjects
                </NavLink>
                {['teacher', 'admin'].includes(user.role) && <Link to="/subjects" className="nav-item">Topics</Link>}
                {['teacher', 'admin'].includes(user.role) && <Link to="/subjects" className="nav-item">Questions</Link>}
                <NavLink to={['teacher', 'admin'].includes(user.role) ? '/admin/quizzes' : '/quizzes'} end className={navItemClass}>Quizzes</NavLink>
                {['teacher', 'admin'].includes(user.role) && <NavLink to="/admin/students" className={navItemClass}>Students</NavLink>}
                {user.role === 'student' && <NavLink to="/quiz-attempts" className={navItemClass}>My results</NavLink>}
                {user.role === 'student' && <NavLink to="/performance" className={navItemClass}>Performance</NavLink>}
                {user.role === 'student' && <NavLink to="/revision" className={navItemClass}>Revision</NavLink>}
                {user.role === 'student' && <NavLink to="/exams" className={navItemClass}>Exam Planner</NavLink>}
                <span className="hidden text-slate-500 sm:inline">{user.name}</span>
                <button type="button" onClick={handleLogout}
                  className="nav-item border border-slate-300">
                  Log out
                </button>
              </>
            ) : (
              <>
                <NavLink to="/login" end className={navItemClass}>
                  Log in
                </NavLink>
                <NavLink to="/register" end className={({ isActive }) => `nav-item nav-item-primary${isActive ? ' nav-item-primary-active' : ''}`}>
                  Register
                </NavLink>
              </>
            )}
          </nav>
        </div>
      </header>
      <main className="flex-1 flex">
        <Outlet />
      </main>
      <footer className="py-6 text-center text-sm text-slate-500">
        © {new Date().getFullYear()} StudyPath
      </footer>
    </div>
  );
}
