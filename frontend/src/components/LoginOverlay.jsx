import { useEffect, useState, useRef } from 'react';

/**
 * Full-screen 1→100% loading overlay during login.
 * - Shows real progress: ramps to ~85% over ~20s, then jumps to 100% when login completes.
 * - On success → reaches 100% → fades out.
 * - On error → resets and hides (parent component shows toast).
 *
 * Props:
 *   show: boolean — true while login API is in flight
 *   success: boolean — true once login resolved (set this just before navigate)
 *   mode: 'parent' | 'teacher' | 'admin'
 */
export default function LoginOverlay({ show, success = false, mode = 'parent' }) {
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('ກຳລັງເລີ່ມຕົ້ນ...');
  const [visible, setVisible] = useState(false);
  const startTime = useRef(0);

  // Mount/unmount control with fade-out
  useEffect(() => {
    if (show) {
      setVisible(true);
      setProgress(1);
      startTime.current = Date.now();
    } else if (!success) {
      // Reset on cancel/error (no success)
      setVisible(false);
      setProgress(0);
    }
  }, [show, success]);

  // Animate progress while in flight
  useEffect(() => {
    if (!visible || success) return;
    const timer = setInterval(() => {
      const elapsed = (Date.now() - startTime.current) / 1000;
      // Asymptotic curve: reaches ~85% by 20s, ~95% by 60s
      const target = Math.min(95, 95 * (1 - Math.exp(-elapsed / 8)));
      setProgress((p) => (p < target ? target : p));

      if (elapsed < 2) setStatusText('ກຳລັງເຊື່ອມຕໍ່...');
      else if (elapsed < 5) setStatusText('ກຳລັງກວດສອບລະຫັດ...');
      else if (elapsed < 10) setStatusText('ກຳລັງດຶງຂໍ້ມູນນັກຮຽນ...');
      else if (elapsed < 18) setStatusText('ກຳລັງກຽມໜ້າຫຼັກ...');
      else if (elapsed < 30) setStatusText('ເກືອບສຳເລັດແລ້ວ...');
      else if (elapsed < 50) setStatusText('ເຄືອຂ່າຍຊ້າ — ກຳລັງຍ້ອນ...');
      else setStatusText('ກຳລັງລໍຖ້າ server ຕື່ນ...');
    }, 150);
    return () => clearInterval(timer);
  }, [visible, success]);

  // On success → jump to 100% → fade out
  useEffect(() => {
    if (!success || !visible) return;
    setProgress(100);
    setStatusText('ສຳເລັດ! ✓');
    const t = setTimeout(() => setVisible(false), 700);
    return () => clearTimeout(t);
  }, [success, visible]);

  if (!visible) return null;

  const pct = Math.round(progress);
  const colors = {
    parent: { ring: 'border-t-orange-400', bar: 'from-orange-500 to-amber-400' },
    teacher: { ring: 'border-t-blue-400', bar: 'from-blue-600 to-blue-400' },
    admin: { ring: 'border-t-purple-400', bar: 'from-purple-600 to-pink-500' },
  };
  const c = colors[mode] || colors.parent;

  return (
    <div
      className={`fixed inset-0 z-[10000] flex flex-col items-center justify-center px-6 backdrop-blur-md ios-gpu ios-solid-bg transition-opacity duration-500 ${
        success && pct >= 100 ? 'opacity-0' : 'opacity-100'
      }`}
      style={{ background: 'rgba(15, 23, 42, 0.96)' }}
    >
      <div className="w-full max-w-sm flex flex-col items-center">
        {/* Logo */}
        <img
          src="/favicon.ico"
          alt=""
          className="w-16 h-16 rounded-2xl mb-4 shadow-xl shadow-blue-500/30 object-contain"
          onError={(e) => { e.currentTarget.style.display = 'none'; }}
        />
        <h2 className="text-white text-lg font-bold lao mb-6">ໂຮງຮຽນ ເພັດດາຣາ</h2>

        {/* Spinning ring with % */}
        <div className="relative w-32 h-32 mb-6">
          <div className="absolute inset-0 rounded-full border-[6px] border-white/10"></div>
          <div className={`absolute inset-0 rounded-full border-[6px] border-transparent ${c.ring} animate-spin`}></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-white text-3xl font-bold tabular-nums">{pct}%</span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-white/10 rounded-full h-4 overflow-hidden border border-white/20 mb-3 shadow-inner">
          <div
            className={`h-full bg-gradient-to-r ${c.bar} transition-all duration-200 ease-out relative overflow-hidden`}
            style={{ width: `${pct}%` }}
          >
            <div
              className="absolute inset-0 opacity-50"
              style={{
                background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.7) 50%, transparent 100%)',
                animation: 'shimmer 1.2s infinite',
              }}
            />
          </div>
        </div>

        <p className="text-white text-base font-semibold lao text-center min-h-[24px]">{statusText}</p>
        <p className="text-blue-200 text-xs lao text-center mt-2">ກະລຸນາລໍຖ້າຈົນເຖິງ 100% — ບໍ່ຕ້ອງປິດໜ້ານີ້</p>
      </div>

      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
}
