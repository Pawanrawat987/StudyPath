import { Routes, Route } from 'react-router-dom';
import MainLayout from './layouts/MainLayout.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import GuestRoute from './components/GuestRoute.jsx';
import Landing from './pages/Landing.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Dashboard from './pages/Dashboard.jsx';
import ComingSoon from './pages/ComingSoon.jsx';
import VerifyEmail from './pages/VerifyEmail.jsx';
import ForgotPassword from './pages/ForgotPassword.jsx';
import ResetPassword from './pages/ResetPassword.jsx';
import Subjects from './pages/Subjects.jsx';
import Topics from './pages/Topics.jsx';
import Questions from './pages/Questions.jsx';
import Quizzes from './pages/Quizzes.jsx';
import QuizAttempt from './pages/QuizAttempt.jsx';
import { QuizHistory, QuizResult } from './pages/QuizHistory.jsx';
import Performance from './pages/Performance.jsx';
import Revision from './pages/Revision.jsx';
import ExamPlanner from './pages/ExamPlanner.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';
import AdminQuizzes from './pages/AdminQuizzes.jsx';
import AdminStudents from './pages/AdminStudents.jsx';

export default function App() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route path="/" element={<Landing />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route element={<GuestRoute />}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Route>
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/subjects" element={<Subjects />} />
          <Route path="/subjects/:subjectId" element={<Topics />} />
          <Route path="/topics/:topicId" element={<Questions />} />
          <Route path="/quizzes" element={<Quizzes />} />
          <Route path="/quizzes/:quizId/attempt" element={<QuizAttempt />} />
          <Route path="/quiz-attempts" element={<QuizHistory />} />
          <Route path="/quiz-attempts/:id" element={<QuizResult />} />
          <Route element={<ProtectedRoute roles={['teacher', 'admin']} />}>
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/quizzes" element={<AdminQuizzes />} />
            <Route path="/admin/students" element={<AdminStudents />} />
            <Route path="/admin/students/:studentId" element={<AdminStudents />} />
          </Route>
          <Route element={<ProtectedRoute roles={['student']} />}>
            <Route path="/performance" element={<Performance />} />
            <Route path="/revision" element={<Revision />} />
            <Route path="/exams" element={<ExamPlanner />} />
          </Route>
        </Route>
        <Route path="*" element={<ComingSoon title="Page not found" />} />
      </Route>
    </Routes>
  );
}
