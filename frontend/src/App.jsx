import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, NavLink } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import InstallPrompt from './components/InstallPrompt';
import SystemReadyGate from './components/SystemReadyGate';
import Login from './pages/Login';

const ParentHome = lazy(() => import('./pages/parent/ParentHome'));
const ParentHistory = lazy(() => import('./pages/parent/ParentHistory'));
const ParentProfile = lazy(() => import('./pages/parent/ParentProfile'));
const TeacherDashboard = lazy(() => import('./pages/teacher/TeacherDashboard'));
const TeacherHistory = lazy(() => import('./pages/teacher/TeacherHistory'));
const GateDisplay = lazy(() => import('./pages/gate/GateDisplay'));
const AdminPanel = lazy(() => import('./pages/admin/AdminPanel'));

function PageLoader() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-blue-50 to-white px-6">
      <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
      <p className="text-gray-600 lao text-sm">ກຳລັງໂຫຼດໜ້າ...</p>
      <p className="text-gray-400 lao text-xs mt-1">ກະລຸນາລໍຖ້າຈັກໜ້ອຍ</p>
    </div>
  );
}

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
      <nav className="bg-white border-t border-gray-200 sticky bottom-0 z-50 safe-bottom">
        <div className="max-w-md mx-auto flex justify-around py-2">
          <NavLink to="/parent/history" className={({ isActive }) => `flex flex-col items-center py-1 px-4 ${isActive ? 'text-blue-600' : 'text-gray-400'}`}>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-xs mt-0.5 lao">ປະຫວັດ</span>
          </NavLink>
          <NavLink to="/parent" end className={({ isActive }) => `flex flex-col items-center py-1 px-4 ${isActive ? 'text-blue-600' : 'text-gray-400'}`}>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <span className="text-xs mt-0.5 lao">ໜ້າຫຼັກ</span>
          </NavLink>
          <NavLink to="/parent/profile" className={({ isActive }) => `flex flex-col items-center py-1 px-4 ${isActive ? 'text-blue-600' : 'text-gray-400'}`}>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span className="text-xs mt-0.5 lao">ໂປຣໄຟລ໌</span>
          </NavLink>
        </div>
      </nav>
    </div>
  );
}

function TeacherLayout() {
  return (
    <div className="min-h-screen bg-gray-50">
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
      <Route path="/login" element={
        token
          ? <Navigate to={user?.role === 'admin' ? '/admin' : user?.role === 'teacher' ? '/teacher' : '/parent'} replace />
          : <Login />
      } />
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
      <Route path="/admin/*" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <AdminPanel />
        </ProtectedRoute>
      } />
      <Route path="/monitor" element={<GateDisplay />} />
      <Route path="/gate" element={<GateDisplay />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <SystemReadyGate>
        <AuthProvider>
          <SocketProvider>
            <Suspense fallback={<PageLoader />}>
              <AppRoutes />
            </Suspense>
            <InstallPrompt />
            <Toaster position="top-center" toastOptions={{ duration: 3000 }} />
          </SocketProvider>
        </AuthProvider>
      </SystemReadyGate>
    </BrowserRouter>
  );
}
