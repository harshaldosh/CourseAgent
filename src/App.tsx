import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import Layout from './components/layout/Layout';
import AdminLayout from './components/layout/AdminLayout';
import HomeRedirect from './components/HomeRedirect';
import AuthRedirect from './components/AuthRedirect';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Courses from './pages/Courses';
import CourseAdd from './pages/CourseAdd';
import CourseDetail from './pages/CourseDetail';
import CourseEnrollDetail from './pages/CourseEnrollDetail';
import CourseEdit from './pages/CourseEdit';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminCourses from './pages/admin/AdminCourses';
import AdminCourseDetail from './pages/admin/AdminCourseDetail';
import AdminQuizzes from './pages/admin/AdminQuizzes';
import QuizCreate from './pages/admin/QuizCreate';
import QuizTake from './pages/QuizTake';
import QuizResult from './pages/QuizResult';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<HomeRedirect />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            {/* Quiz routes (public access via URL) */}
            <Route path="/quiz/:id" element={<QuizTake />} />
            <Route path="/quiz/:quizId/result/:attemptId" element={<QuizResult />} />
            
            {/* Protected routes with Layout */}
            <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="courses" element={<Courses />} />
              <Route path="courses/:id" element={<CourseDetail />} />
              <Route path="courses/enrolled/:id" element={<CourseEnrollDetail />} />
              <Route path="students" element={
                <div className="p-6">
                  <h1 className="text-2xl font-bold">Students</h1>
                  <p className="text-gray-600 mt-2">Students management coming soon...</p>
                </div>
              } />
              <Route path="settings" element={
                <div className="p-6">
                  <h1 className="text-2xl font-bold">Settings</h1>
                  <p className="text-gray-600 mt-2">Settings panel coming soon...</p>
                </div>
              } />
            </Route>

            {/* Admin-only routes */}
            <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
              <Route index element={<AdminDashboard />} />
              <Route path="courses" element={<AdminCourses />} />
              <Route path="courses/add" element={<CourseAdd />} />
              <Route path="courses/:id" element={<AdminCourseDetail />} />
              <Route path="courses/:id/edit" element={<CourseEdit />} />
              <Route path="quizzes" element={<AdminQuizzes />} />
              <Route path="quizzes/create" element={<QuizCreate />} />
              <Route path="students" element={
                <div className="p-6">
                  <h1 className="text-2xl font-bold">Student Management</h1>
                  <p className="text-gray-600 mt-2">Admin student management coming soon...</p>
                </div>
              } />
              <Route path="settings" element={
                <div className="p-6">
                  <h1 className="text-2xl font-bold">Admin Settings</h1>
                  <p className="text-gray-600 mt-2">Admin settings panel coming soon...</p>
                </div>
              } />
            </Route>

            {/* Legacy admin routes (redirect to new admin routes) */}
            <Route path="/courseadd" element={<AdminRoute><CourseAdd /></AdminRoute>} />
            <Route path="/courses/:id/edit" element={<AdminRoute><CourseEdit /></AdminRoute>} />

            {/* Catch-all route */}
            <Route path="*" element={<AuthRedirect />} />
          </Routes>
          <Toaster position="top-right" />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;