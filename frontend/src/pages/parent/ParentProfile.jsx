import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function ParentProfile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-md mx-auto px-4 py-3">
          <h1 className="text-lg font-bold text-gray-900">ໂປຣໄຟລ໌</h1>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center text-2xl font-bold text-blue-700">
              {user?.name?.charAt(0)}
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">{user?.name}</h2>
              <p className="text-gray-500">{user?.phone}</p>
            </div>
          </div>

          <div className="space-y-3 mb-8">
            <div className="flex justify-between py-3 border-b border-gray-100">
              <span className="text-gray-500">ບົດບາດ</span>
              <span className="font-medium text-gray-900">ຜູ້ປົກຄອງ</span>
            </div>
            <div className="flex justify-between py-3 border-b border-gray-100">
              <span className="text-gray-500">ເບີໂທ</span>
              <span className="font-medium text-gray-900">{user?.phone}</span>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full py-3 bg-red-50 text-red-600 rounded-xl font-semibold hover:bg-red-100 transition"
          >
            ອອກຈາກລະບົບ
          </button>
        </div>
      </div>
    </div>
  );
}
