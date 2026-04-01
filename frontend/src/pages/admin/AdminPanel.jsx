import { NavLink, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import AdminStats from './AdminStats';
import AdminQueue from './AdminQueue';
import AdminStudents from './AdminStudents';
import AdminClassrooms from './AdminClassrooms';
import AdminUsers from './AdminUsers';
import AdminVoiceRecording from './AdminVoiceRecording';

const NAV_ITEMS = [
  { to: '', label: '📊 ສະຖິຕິ', end: true },
  { to: 'queue', label: '🔴 Live Queue' },
  { to: 'students', label: '👨‍🎓 ນັກຮຽນ' },
  { to: 'classrooms', label: '🏫 ຫ້ອງຮຽນ' },
  { to: 'users', label: '👤 Users' },
  { to: 'voice', label: '🎙️ ບັນທຶກສຽງ' },
];

export default function AdminPanel() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top Header */}
      <div className="bg-gradient-to-r from-gray-800 to-gray-700 text-white shadow-lg">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold lao">⚙️ Admin Panel</h1>
            <p className="text-gray-300 text-sm lao">{user?.name}</p>
          </div>
          <div className="flex gap-3">
            <a href="/monitor" target="_blank" className="text-gray-300 hover:text-white text-sm lao">📺 Monitor</a>
            <button onClick={logout} className="text-gray-300 hover:text-white text-sm lao">ອອກ</button>
          </div>
        </div>
      </div>

      {/* Navigation tabs */}
      <div className="bg-white border-b shadow-sm sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 flex gap-1 overflow-x-auto">
          {NAV_ITEMS.map(item => (
            <NavLink
              key={item.to}
              to={`/admin/${item.to}`}
              end={item.end}
              className={({ isActive }) =>
                `px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition lao ${
                  isActive
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </div>
      </div>

      {/* Page content */}
      <div className="flex-1 max-w-4xl mx-auto w-full px-4 py-6">
        <Routes>
          <Route index element={<AdminStats />} />
          <Route path="queue" element={<AdminQueue />} />
          <Route path="students" element={<AdminStudents />} />
          <Route path="classrooms" element={<AdminClassrooms />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="voice" element={<AdminVoiceRecording />} />
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Routes>
      </div>
    </div>
  );
}
