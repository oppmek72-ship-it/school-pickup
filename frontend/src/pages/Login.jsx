import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoginOverlay from '../components/LoginOverlay';
import { API_BASE } from '../api/config';
import toast from 'react-hot-toast';

const MODES = [
  { id: 'parent', label: 'ຜູ້ປົກຄອງ', icon: '👨‍👩‍👧', color: 'from-orange-500 to-amber-400' },
  { id: 'teacher', label: 'ຄູ / ແອດມິນ', icon: '👩‍🏫', color: 'from-blue-600 to-blue-400' },
];

function InstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed as PWA
    if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone) {
      setIsInstalled(true);
      return;
    }

    // Detect iOS
    const ua = navigator.userAgent;
    const ios = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    setIsIOS(ios);

    // For Android/Chrome — capture beforeinstallprompt
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowBanner(true);
    };
    window.addEventListener('beforeinstallprompt', handler);

    // If no prompt after 2s (iOS or already dismissed), show manual banner
    const timer = setTimeout(() => {
      if (!window.matchMedia('(display-mode: standalone)').matches) {
        setShowBanner(true);
      }
    }, 2000);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      clearTimeout(timer);
    };
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const result = await deferredPrompt.userChoice;
      if (result.outcome === 'accepted') {
        setShowBanner(false);
        toast.success('ກຳລັງຕິດຕັ້ງ...');
      }
      setDeferredPrompt(null);
    }
  };

  if (isInstalled || !showBanner) return null;

  // iOS — show manual instructions
  if (isIOS && !deferredPrompt) {
    return (
      <div className="mb-6 bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-blue-400/30 rounded-2xl p-4 backdrop-blur">
        <div className="flex items-center gap-3 mb-2">
          <img src="/favicon.ico" className="w-10 h-10 rounded-xl" alt="" />
          <div>
            <p className="text-white font-bold text-sm lao">📲 ຕິດຕັ້ງແອັບ</p>
            <p className="text-blue-200 text-xs lao">ເຂົ້າໄວຂຶ້ນ ບໍ່ຕ້ອງເປີດ browser</p>
          </div>
        </div>
        <div className="bg-white/10 rounded-xl p-3 space-y-2">
          <p className="text-blue-100 text-xs lao">
            <span className="font-bold">iPhone/iPad:</span>
          </p>
          <p className="text-blue-100 text-xs lao">
            1. ກົດ <span className="inline-block bg-white/20 px-1.5 py-0.5 rounded text-white font-bold">⬆️ Share</span> (ປຸ່ມລຸ່ມ)
          </p>
          <p className="text-blue-100 text-xs lao">
            2. ເລື່ອນລົງ ກົດ <span className="inline-block bg-white/20 px-1.5 py-0.5 rounded text-white font-bold">Add to Home Screen</span>
          </p>
          <p className="text-blue-100 text-xs lao">
            3. ກົດ <span className="inline-block bg-white/20 px-1.5 py-0.5 rounded text-white font-bold">Add</span>
          </p>
        </div>
      </div>
    );
  }

  // Android/Chrome — direct install button
  if (deferredPrompt) {
    return (
      <div className="mb-6">
        <button onClick={handleInstall}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-green-500 to-emerald-400 hover:from-green-600 hover:to-emerald-500 text-white font-bold text-lg shadow-lg shadow-green-500/30 transition-all flex items-center justify-center gap-3 lao">
          <span className="text-2xl">📲</span>
          <div className="text-left">
            <p className="font-bold">ດາວໂຫຼດແອັບ</p>
            <p className="text-xs text-green-100 font-normal">ຕິດຕັ້ງໃສ່ໜ້າຈໍ ເຂົ້າໄວ</p>
          </div>
        </button>
      </div>
    );
  }

  // Fallback — show manual instructions for other browsers
  return (
    <div className="mb-6 bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-blue-400/30 rounded-2xl p-4 backdrop-blur">
      <div className="flex items-center gap-3 mb-2">
        <img src="/favicon.ico" className="w-10 h-10 rounded-xl" alt="" />
        <div>
          <p className="text-white font-bold text-sm lao">📲 ຕິດຕັ້ງແອັບ</p>
          <p className="text-blue-200 text-xs lao">ເຂົ້າໄວຂຶ້ນ ບໍ່ຕ້ອງເປີດ browser</p>
        </div>
      </div>
      <div className="bg-white/10 rounded-xl p-3 space-y-2">
        <p className="text-blue-100 text-xs lao">
          <span className="font-bold">Android:</span>
        </p>
        <p className="text-blue-100 text-xs lao">
          1. ກົດ <span className="inline-block bg-white/20 px-1.5 py-0.5 rounded text-white font-bold">⋮</span> (3 ຈຸດ ມຸມຂວາເທິງ)
        </p>
        <p className="text-blue-100 text-xs lao">
          2. ກົດ <span className="inline-block bg-white/20 px-1.5 py-0.5 rounded text-white font-bold">Add to Home screen</span>
        </p>
        <p className="text-blue-100 text-xs lao">
          3. ກົດ <span className="inline-block bg-white/20 px-1.5 py-0.5 rounded text-white font-bold">Install</span>
        </p>
      </div>
    </div>
  );
}

export default function Login() {
  const [mode, setMode] = useState('parent');
  const [studentCode, setStudentCode] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [success, setSuccess] = useState(false);
  const [overlayMode, setOverlayMode] = useState('parent');
  const { parentLogin, staffLogin, loading } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccess(false);
    setOverlayMode(mode); // tentative — may change for admin below
    try {
      if (mode === 'parent') {
        await parentLogin(studentCode.trim().toUpperCase());
        setSuccess(true);
        // Wait for overlay to flash 100% then navigate
        setTimeout(() => navigate('/parent'), 700);
      } else {
        const data = await staffLogin(username.trim(), password);
        const role = data.user.role;
        setOverlayMode(role === 'admin' ? 'admin' : 'teacher');
        setSuccess(true);
        setTimeout(() => navigate(role === 'admin' ? '/admin' : '/teacher'), 700);
      }
    } catch (error) {
      setSuccess(false);
      let msg = error.response?.data?.error;
      if (!msg) {
        if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
          msg = 'ເຄືອຂ່າຍຊ້າເກີນໄປ — ລອງໃໝ່';
        } else if (error.message === 'Network Error' || !error.response) {
          msg = `ເຊື່ອມຕໍ່ບໍ່ໄດ້: ${API_BASE} — ກວດເບິ່ງເນັດ`;
        } else {
          msg = 'ເຂົ້າສູ່ລະບົບບໍ່ສຳເລັດ';
        }
      }
      toast.error(msg);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8"
      style={{ background: 'linear-gradient(135deg, #0F172A 0%, #1E3A5F 50%, #0F172A 100%)' }}>
      <LoginOverlay show={loading || success} success={success} mode={overlayMode} />
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <img src="/favicon.ico" alt="Logo" className="w-20 h-20 rounded-2xl mx-auto mb-4 shadow-2xl shadow-blue-500/30 object-contain" />
          <h1 className="text-2xl font-bold text-white lao">ໂຮງຮຽນ ເພັດດາຣາ</h1>
          <p className="text-blue-300 text-sm mt-1 lao">ລະບົບເອີ້ນນັກຮຽນກັບບ້ານ</p>
        </div>

        {/* Install App Banner */}
        <InstallBanner />

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
