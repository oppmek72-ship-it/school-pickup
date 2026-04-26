import { useEffect, useState, useRef } from 'react';
import { API_BASE } from '../api/config';

/**
 * Shows a progress bar while pinging /api/health.
 * Render free tier cold-starts in ~30-60s — this gives parents
 * a clear "system is X% ready" signal so they don't think it's broken.
 *
 * Behavior:
 *  - Animates progress smoothly to 90% over ~30s
 *  - Pings /api/health every 1.5s
 *  - When health responds → jumps to 100% → fades out → renders children
 *  - If backend is warm (responds <2s) → flashes briefly then disappears
 */
export default function SystemReadyGate({ children }) {
  const [progress, setProgress] = useState(0);
  const [ready, setReady] = useState(false);
  const [hide, setHide] = useState(false);
  const [statusText, setStatusText] = useState('ກຳລັງເຊື່ອມຕໍ່ server...');
  const startTime = useRef(Date.now());
  const readyRef = useRef(false);

  useEffect(() => {
    let progressTimer;
    let pingTimer;
    let cancelled = false;

    // Smooth progress animation (asymptotic to 90%)
    const tick = () => {
      if (cancelled || readyRef.current) return;
      const elapsed = (Date.now() - startTime.current) / 1000;
      // Reach 90% at ~30s, slower beyond
      const target = Math.min(90, 90 * (1 - Math.exp(-elapsed / 12)));
      setProgress((p) => (p < target ? target : p));

      // Update status hints based on elapsed time
      if (elapsed < 5) setStatusText('ກຳລັງເຊື່ອມຕໍ່ server...');
      else if (elapsed < 15) setStatusText('ກຳລັງປຸກ server...');
      else if (elapsed < 30) setStatusText('ເກືອບສຳເລັດແລ້ວ...');
      else if (elapsed < 60) setStatusText('ກຳລັງກຽມຂໍ້ມູນ...');
      else setStatusText('ກະລຸນາລໍຖ້າ ກຳລັງເຊື່ອມຕໍ່...');

      progressTimer = setTimeout(tick, 200);
    };
    tick();

    // Health check loop
    const ping = async () => {
      if (cancelled || readyRef.current) return;
      try {
        const ctrl = new AbortController();
        const t = setTimeout(() => ctrl.abort(), 8000);
        const res = await fetch(`${API_BASE}/health`, {
          method: 'GET',
          signal: ctrl.signal,
          cache: 'no-store',
        });
        clearTimeout(t);
        if (res.ok) {
          readyRef.current = true;
          setProgress(100);
          setStatusText('ພ້ອມໃຊ້ງານ! ✓');
          setReady(true);
          setTimeout(() => !cancelled && setHide(true), 600);
          return;
        }
      } catch (_) {
        // ignore — keep retrying
      }
      pingTimer = setTimeout(ping, 1500);
    };
    ping();

    return () => {
      cancelled = true;
      clearTimeout(progressTimer);
      clearTimeout(pingTimer);
    };
  }, []);

  if (hide) return children;

  const pct = Math.round(progress);

  return (
    <>
      {/* Pre-render children behind the overlay so first paint is ready */}
      <div style={{ visibility: 'hidden', position: 'absolute', inset: 0 }}>{children}</div>

      <div
        className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center px-6 ios-gpu transition-opacity duration-500 ${
          ready ? 'opacity-0 pointer-events-none' : 'opacity-100'
        }`}
        style={{ background: 'linear-gradient(135deg, #0F172A 0%, #1E3A5F 50%, #0F172A 100%)' }}
      >
        <div className="w-full max-w-sm flex flex-col items-center">
          {/* Logo */}
          <div className="mb-6">
            <img
              src="/favicon.ico"
              alt=""
              className="w-20 h-20 rounded-2xl shadow-2xl shadow-blue-500/30 object-contain"
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
          </div>

          <h1 className="text-2xl font-bold text-white lao text-center">ໂຮງຮຽນ ເພັດດາຣາ</h1>
          <p className="text-blue-300 text-sm mt-1 lao text-center mb-8">ລະບົບເອີ້ນນັກຮຽນກັບບ້ານ</p>

          {/* Progress bar */}
          <div className="w-full bg-white/10 rounded-full h-5 overflow-hidden border border-white/20 shadow-inner">
            <div
              className="h-full bg-gradient-to-r from-orange-500 via-amber-400 to-yellow-300 transition-all duration-200 ease-out relative overflow-hidden"
              style={{ width: `${pct}%` }}
            >
              {/* Shimmer effect */}
              <div
                className="absolute inset-0 opacity-40"
                style={{
                  background:
                    'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.6) 50%, transparent 100%)',
                  animation: 'shimmer 1.4s infinite',
                }}
              />
            </div>
          </div>

          {/* Percentage */}
          <div className="mt-3 text-3xl font-bold text-white tabular-nums">{pct}%</div>

          {/* Status text */}
          <p className="mt-2 text-sm text-blue-200 lao text-center min-h-[20px]">{statusText}</p>

          {/* Hint */}
          <p className="mt-6 text-xs text-gray-500 lao text-center">
            ກະລຸນາລໍຖ້າ ລະບົບກຳລັງກຽມພ້ອມ...
          </p>
        </div>

        <style>{`
          @keyframes shimmer {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
          }
        `}</style>
      </div>
    </>
  );
}
