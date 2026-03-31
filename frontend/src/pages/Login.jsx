import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const MODES = [
  { id: 'parent', label: 'ຜູ້ປົກຄອງ', icon: '👨‍👩‍👧', color: 'from-orange-500 to-amber-400' },
  { id: 'teacher', label: 'ຄູ / ແອດມິນ', icon: '👩‍🏫', color: 'from-blue-600 to-blue-400' },
];

export default function Login() {
  const [mode, setMode] = useState('parent');
  const [studentCode, setStudentCode] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const { parentLogin, staffLogin, loading } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (mode === 'parent') {
        await parentLogin(studentCode.trim().toUpperCase());
        navigate('/parent');
      } else {
        const data = await staffLogin(username.trim(), password);
        const role = data.user.role;
        if (role === 'admin') navigate('/admin');
        else navigate('/teacher');
      }
    } catch (error) {
      const msg = error.response?.data?.error || 'ເຂົ້າສູ່ລະບົບບໍ່ສຳເລັດ';
      toast.error(msg);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8"
      style={{ background: 'linear-gradient(135deg, #0F172A 0%, #1E3A5F 50%, #0F172A 100%)' }}>
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-2xl shadow-blue-500/30">
            <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 14l9-5-9-5-9 5 9 5z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white lao">ໂຮງຮຽນ ເພັດດາຣາ</h1>
          <p className="text-blue-300 text-sm mt-1 lao">ລະບົບເອີ້ນນັກຮຽນກັບບ້ານ</p>
        </div>

        {/* Mode selector */}
        <div className="flex gap-2 mb-6 bg-white/5 p-1 rounded-xl">
          {MODES.map((m) => (
            <button
              key={m.id}
              onClick={() => setMode(m.id)}
              className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all lao ${
                mode === m.id
                  ? 'bg-white text-gray-900 shadow-md'
                  : 'text-gray-300 hover:text-white'
              }`}
            >
              {m.icon} {m.label}
            </button>
          ))}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-6 space-y-4">
          {mode === 'parent' ? (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2 lao">
                ລະຫັດນັກຮຽນ
              </label>
              <input
                type="text"
                value={studentCode}
                onChange={(e) => setStudentCode(e.target.value.toUpperCase())}
                placeholder="STD-0001"
                className="w-full px-4 py-3.5 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent text-lg font-mono tracking-widest text-center"
                required
                autoFocus
              />
              <p className="text-xs text-gray-500 mt-2 text-center lao">
                ໃສ່ລະຫັດນັກຮຽນຂອງລູກທ່ານ (ເຊັ່ນ: STD-0001)
              </p>
            </div>
          ) : (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2 lao">
                  ລະຫັດຫ້ອງ / ຊື່ຜູ້ໃຊ້
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="P3-1 ຫຼື admin"
                  className="w-full px-4 py-3.5 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                  required
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2 lao">ລະຫັດຜ່ານ</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••"
                  className="w-full px-4 py-3.5 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                  required
                />
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-4 rounded-xl font-bold text-lg text-white transition-all disabled:opacity-50 shadow-lg lao
              ${mode === 'parent'
                ? 'bg-gradient-to-r from-orange-500 to-amber-400 hover:from-orange-600 hover:to-amber-500 shadow-orange-500/30'
                : 'bg-gradient-to-r from-blue-600 to-blue-400 hover:from-blue-700 hover:to-blue-500 shadow-blue-500/30'
              }`}
          >
            {loading ? 'ກຳລັງເຂົ້າ...' : 'ເຂົ້າສູ່ລະບົບ'}
          </button>
        </form>

        {/* Monitor link */}
        <div className="text-center mt-6">
          <a href="/monitor" className="text-sm text-gray-500 hover:text-gray-300 transition lao">
            📺 ເຂົ້າໜ້າຈໍ Monitor →
          </a>
        </div>

        <p className="text-center text-xs text-gray-600 mt-4">Phetdara School Pick-up System v2.0</p>
      </div>
    </div>
  );
}
