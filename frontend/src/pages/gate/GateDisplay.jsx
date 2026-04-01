import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { io } from 'socket.io-client';

function Countdown({ expiresAt }) {
  const [left, setLeft] = useState('');
  const [urgent, setUrgent] = useState(false);

  useEffect(() => {
    if (!expiresAt) return;
    const tick = () => {
      const diff = new Date(expiresAt) - Date.now();
      if (diff <= 0) { setLeft('00:00'); setUrgent(true); return; }
      const m = Math.floor(diff / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setLeft(`${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`);
      setUrgent(diff < 60000);
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [expiresAt]);

  if (!expiresAt) return null;
  return (
    <span className={`font-mono text-lg font-bold px-3 py-1 rounded-lg ${urgent ? 'bg-red-500 text-white animate-pulse' : 'bg-white/10 text-white'}`}>
      {left}
    </span>
  );
}

function QueueRow({ item, index }) {
  const name = item.student?.nickname || item.student?.firstName || '?';
  const lastName = item.student?.lastName || '';
  const classroom = item.student?.classroom?.className || '';
  const initials = name.charAt(0);

  const config = {
    arrived: { label: 'ຮອດແລ້ວ!', bg: 'bg-red-600', border: 'border-l-red-500', rowBg: 'bg-red-500/10', icon: '🔴' },
    five_minutes: { label: '5 ນາທີ', bg: 'bg-orange-500', border: 'border-l-orange-500', rowBg: 'bg-orange-500/5', icon: '🟠' },
    ten_minutes: { label: '10 ນາທີ', bg: 'bg-blue-500', border: 'border-l-blue-500', rowBg: 'bg-blue-500/5', icon: '🔵' },
  };
  const c = config[item.callType] || config.arrived;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -40, scale: 0.95 }}
      transition={{ duration: 0.3 }}
      className={`flex items-center gap-4 px-5 py-3.5 border-l-4 ${c.border} ${c.rowBg} border-b border-white/5`}
    >
      <div className="text-white/40 font-mono text-lg font-bold w-8 text-center shrink-0">
        #{item.queuePosition || index + 1}
      </div>
      <div className={`${c.bg} text-white text-xs font-bold px-3 py-1.5 rounded-full shrink-0 lao flex items-center gap-1.5`}>
        <span>{c.icon}</span>
        <span>{c.label}</span>
      </div>
      {item.student?.photo ? (
        <img src={item.student.photo} className="w-12 h-12 rounded-full object-cover shrink-0 border-2 border-white/20" />
      ) : (
        <div className="w-12 h-12 rounded-full bg-white/15 flex items-center justify-center text-white font-bold text-xl shrink-0 border-2 border-white/20">
          {initials}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-white font-bold text-xl lao truncate">{name} {lastName}</p>
        <p className="text-white/50 text-sm lao">{classroom}</p>
      </div>
      <div className="shrink-0">
        {item.expiresAt ? (
          <Countdown expiresAt={item.expiresAt} />
        ) : (
          <span className="text-white/40 text-sm font-mono">
            {new Date(item.calledAt).toLocaleTimeString('lo-LA', { hour: '2-digit', minute: '2-digit' })}
          </span>
        )}
      </div>
    </motion.div>
  );
}

export default function GateDisplay() {
  const [queue, setQueue] = useState({ fiveMinutes: [], tenMinutes: [], arrived: [] });
  const [announcement, setAnnouncement] = useState(null);
  const [clock, setClock] = useState('');
  const audioCtx = useRef(null);
  const socketRef = useRef(null);

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setClock(now.toLocaleTimeString('lo-LA', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, []);

  const playChime = useCallback(() => {
    try {
      if (!audioCtx.current) audioCtx.current = new (window.AudioContext || window.webkitAudioContext)();
      const ctx = audioCtx.current;
      const freqs = [523, 659, 784, 1047];
      freqs.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain); gain.connect(ctx.destination);
        osc.frequency.value = freq;
        osc.type = 'sine';
        const t = ctx.currentTime + i * 0.18;
        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(0.4, t + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.6);
        osc.start(t); osc.stop(t + 0.6);
      });
    } catch {}
  }, []);

  const fetchQueue = useCallback(() => {
    fetch('/api/pickup/active')
      .then(r => r.json())
      .then(d => {
        if (d.fiveMinutes) setQueue(d);
        else setQueue({ fiveMinutes: [], tenMinutes: [], arrived: d || [] });
      })
      .catch(() => {});
  }, []);

  // Initial load
  useEffect(() => { fetchQueue(); }, [fetchQueue]);

  // Socket connection with robust reconnection
  useEffect(() => {
    const socket = io(window.location.origin, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('Monitor socket connected:', socket.id);
      socket.emit('join-monitor');
      // Refresh queue on reconnect to catch missed updates
      fetchQueue();
    });

    socket.on('reconnect', () => {
      console.log('Monitor socket reconnected');
      socket.emit('join-monitor');
      fetchQueue();
    });

    socket.on('queue-update', (data) => {
      setQueue({
        fiveMinutes: data.fiveMinutes || [],
        tenMinutes: data.tenMinutes || [],
        arrived: data.arrived || []
      });
    });

    socket.on('new-call', () => { playChime(); });

    socket.on('call-completed', () => {
      // Immediately fetch fresh data when a call is completed
      fetchQueue();
    });

    socket.on('call-cancelled', () => {
      fetchQueue();
    });

    socket.on('call-escalated', (data) => {
      playChime();
      const name = data.student?.nickname || data.student?.firstName || '';
      const cls = data.student?.classroom?.className || '';
      setAnnouncement({ text: `${name} ${cls} — ຜູ້ປົກຄອງຮອດແລ້ວ! ກະລຸນາກຽມຕົວ`, id: Date.now() });
      setTimeout(() => setAnnouncement(null), 8000);
    });

    return () => socket.close();
  }, [fetchQueue, playChime]);

  // Fallback polling every 10s in case socket misses
  useEffect(() => {
    const t = setInterval(fetchQueue, 10000);
    return () => clearInterval(t);
  }, [fetchQueue]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen();
    else document.exitFullscreen();
  };

  const allCalls = [
    ...(queue.arrived || []).map(c => ({ ...c, callType: c.callType || 'arrived' })),
    ...(queue.fiveMinutes || []).map(c => ({ ...c, callType: c.callType || 'five_minutes' })),
    ...(queue.tenMinutes || []).map(c => ({ ...c, callType: c.callType || 'ten_minutes' })),
  ];

  const totalCount = allCalls.length;
  const arrivedCount = (queue.arrived || []).length;
  const fiveCount = (queue.fiveMinutes || []).length;
  const tenCount = (queue.tenMinutes || []).length;

  return (
    <div className="min-h-screen text-white relative overflow-hidden lao" style={{ backgroundColor: '#0D1B2A' }}>
      <AnimatePresence>
        {announcement && (
          <motion.div key={announcement.id}
            initial={{ y: -80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -80, opacity: 0 }}
            className="fixed top-0 left-0 right-0 z-50 bg-yellow-400 text-gray-900 py-5 px-8 text-center shadow-2xl"
          >
            <p className="text-3xl md:text-4xl font-bold animate-bounce">
              📢 {announcement.text}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="bg-gradient-to-r from-blue-900 to-blue-800 px-6 py-4 flex items-center justify-between border-b border-white/10">
        <div className="flex items-center gap-3">
          <span className="text-3xl">🏫</span>
          <div>
            <h1 className="text-2xl font-bold">ໂຮງຮຽນ ເພັດດາຣາ</h1>
            <p className="text-blue-300 text-sm">ລະບົບເອີ້ນນັກຮຽນກັບບ້ານ</p>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="hidden md:flex items-center gap-3">
            <span className="bg-red-500/20 text-red-300 px-3 py-1 rounded-full text-sm font-bold">🔴 {arrivedCount}</span>
            <span className="bg-orange-500/20 text-orange-300 px-3 py-1 rounded-full text-sm font-bold">🟠 {fiveCount}</span>
            <span className="bg-blue-500/20 text-blue-300 px-3 py-1 rounded-full text-sm font-bold">🔵 {tenCount}</span>
          </div>
          <div className="text-right">
            <p className="text-3xl font-mono font-bold text-blue-200">{clock}</p>
            <p className="text-xs text-blue-400">ທັງໝົດ {totalCount} ຄົນ</p>
          </div>
        </div>
      </div>

      <div className="overflow-y-auto" style={{ height: 'calc(100vh - 85px)' }}>
        {totalCount === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-white/30">
            <p className="text-7xl mb-4">😴</p>
            <p className="text-2xl">ບໍ່ມີນ້ອງໃນຄິວ</p>
          </div>
        ) : (
          <AnimatePresence>
            {allCalls.map((item, i) => (
              <QueueRow key={item.id} item={item} index={i} />
            ))}
          </AnimatePresence>
        )}
      </div>

      <button onClick={toggleFullscreen}
        className="fixed bottom-4 right-4 bg-white/10 hover:bg-white/20 text-white p-3 rounded-full transition">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
        </svg>
      </button>
    </div>
  );
}
