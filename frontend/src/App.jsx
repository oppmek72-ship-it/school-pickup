import { BrowserRouter, Routes, Route, Navigate, NavLink } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import Login from './pages/Login';
import ParentHome from './pages/parent/ParentHome';
import ParentHistory from './pages/parent/ParentHistory';
import ParentProfile from './pages/parent/ParentProfile';
import TeacherDashboard from './pages/teacher/TeacherDashboard';
import TeacherHistory from './pages/teacher/TeacherHistory';
import GateDisplay from './pages/gate/GateDisplay';

function ProtectedRoute({ children, allowedRoles }) {
  const { user, token } = useAuth();
  if (!token) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user?.role)) return <Navigate to="/login" replace />;
  return children;
}

function ParentLayout() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="flex-1">
        <Routes>
          <Route index element={<ParentHome />} />
          <Route path="history" element={<ParentHistory />} />
          <Route path="profile" element={<ParentProfile />} />
        </Routes>
      </div>
      <nav className="bg-white border-t border-gray-200 sticky bottom-0 z-50">
        <div className="max-w-md mx-auto flex justify-around py-2">
          <NavLink to="/parent/history" className={({ isActive }) => `flex flex-col items-center py-1 px-3 ${isActive ? 'text-blue-600' : 'text-gray-500 hover:text-blue-600'}`}>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-xs mt-0.5">ປະຫວັດ</span>
          </NavLink>
          <NavLink to="/parent" end className={({ isActive }) => `flex flex-col items-center py-1 px-3 ${isActive ? 'text-blue-600' : 'text-gray-500 hover:text-blue-600'}`}>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <span className="text-xs mt-0.5">ໜ້າຫຼັກ</span>
          </NavLink>
          <NavLink to="/parent/profile" className={({ isActive }) => `flex flex-col items-center py-1 px-3 ${isActive ? 'text-blue-600' : 'text-gray-500 hover:text-blue-600'}`}>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span className="text-xs mt-0.5">ໂປຣໄຟລ໌</span>
          </NavLink>
        </div>
      </nav>
    </div>
  );
}

function TeacherLayout() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-blue-700 text-white">
        <div className="max-w-3xl mx-auto flex gap-1 px-4">
          <NavLink to="/teacher" end className={({ isActive }) => `px-4 py-2 text-sm font-medium hover:bg-blue-600 rounded-t-lg mt-1 ${isActive ? 'bg-blue-600/50' : ''}`}>ແດັດບອດ</NavLink>
          <NavLink to="/teacher/history" className={({ isActive }) => `px-4 py-2 text-sm font-medium hover:bg-blue-600 rounded-t-lg mt-1 ${isActive ? 'bg-blue-600/50' : ''}`}>ປະຫວັດ</NavLink>
        </div>
      </div>
      <Routes>
        <Route index element={<TeacherDashboard />} />
        <Route path="history" element={<TeacherHistory />} />
      </Routes>
    </div>
  );
}

function AppRoutes() {
  const { token, user } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={token ? <Navigate to={user?.role === 'teacher' || user?.role === 'admin' ? '/teacher' : '/parent'} replace /> : <Login />} />
      <Route path="/parent/*" element={
        <ProtectedRoute allowedRoles={['parent']}>
          <ParentLayout />
        </ProtectedRoute>
      } />
      <Route path="/teacher/*" element={
        <ProtectedRoute allowedRoles={['teacher', 'admin']}>
          <TeacherLayout />
        </ProtectedRoute>
      } />
      <Route path="/gate" element={<GateDisplay />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SocketProvider>
          <AppRoutes />
          <Toaster position="top-center" toastOptions={{ duration: 3000 }} />
        </SocketProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
