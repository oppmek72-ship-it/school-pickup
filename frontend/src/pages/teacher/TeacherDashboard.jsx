import { useState, useEffect, useCallback, useRef } from 'react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { useSocketEvent } from '../../hooks/useSocket';
import { usePickup } from '../../hooks/usePickup';
import toast from 'react-hot-toast';

function Avatar({ student, size = 'sm' }) {
  const sizes = { sm: 'w-14 h-14 text-xl', md: 'w-16 h-16 text-2xl' };
  const name = student.nickname || student.firstName || '?';
  if (student.photo) return <img src={student.photo} className={`${sizes[size]} rounded-full object-cover shrink-0 border-2 border-gray-200`} />;
  const colors = ['bg-blue-500', 'bg-purple-500', 'bg-pink-500', 'bg-orange-500', 'bg-teal-500'];
  const color = colors[(student.id || 0) % colors.length];
  return (
    <div className={`${sizes[size]} ${color} rounded-full flex items-center justify-center text-white font-bold shrink-0 border-2 border-white`}>
      {name.charAt(0)}
    </div>
  );
}

function Countdown({ expiresAt }) {
  const [left, setLeft] = useState('');
  const [urgent, setUrgent] = useState(false);
  useEffect(() => {
    if (!expiresAt) return;
    const tick = () => {
      const diff = new Date(expiresAt) - Date.now();
      if (diff <= 0) { setLeft('ໝົດເວລາ!'); setUrgent(true); return; }
      const m = Math.floor(diff / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setLeft(`${m}:${String(s).padStart(2, '0')}`);
      setUrgent(diff < 60000);
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [expiresAt]);
  if (!expiresAt) return null;
  return <span className={`text-sm font-mono font-bold px-2 py-0.5 rounded lao ${urgent ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-blue-100 text-blue-700'}`}>⏱ {left}</span>;
}

function CallCard({ call, onConfirm, loading }) {
  const student = call.student;
  const callTime = new Date(call.calledAt).toLocaleTimeString('lo-LA', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  const config = {
    arrived: { badge: '🔴 ຮີບດ່ວນ!', border: 'border-red-400', bg: 'bg-red-50', badgeBg: 'bg-red-100 text-red-700' },
    five_minutes: { badge: '🟠 5 ນາທີ', border: 'border-orange-400', bg: 'bg-orange-50', badgeBg: 'bg-orange-100 text-orange-700' },
    ten_minutes: { badge: '🔵 10 ນາທີ', border: 'border-blue-400', bg: 'bg-blue-50', badgeBg: 'bg-blue-100 text-blue-700' },
  };
  const c = config[call.callType] || config.arrived;

  return (
    <div className={`rounded-2xl border-2 ${c.border} ${c.bg} p-4 space-y-3`}>
      <div className="flex items-start gap-3">
        <Avatar student={student} />
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full lao ${c.badgeBg}`}>{c.badge}</span>
            <Countdown expiresAt={call.expiresAt} />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mt-1 lao">
            {student.nickname || student.firstName} {student.lastName}
          </h3>
          <p className="text-gray-500 text-sm lao">{student.classroom?.className}</p>
          <p className="text-xs text-gray-400 lao">ເອີ້ນ: {callTime} · ຄິວ #{call.queuePosition}</p>
        </div>
      </div>
      <button onClick={() => onConfirm(call.id)} disabled={loading}
        className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition disabled:opacity-50 lao">
        ✅ ສົ່ງນ້ອງແລ້ວ
      </button>
    </div>
  );
}

// ===== ALARM SYSTEM =====
// Play loud alarm sound using Web Audio API
function playAlarm(type = 'normal') {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();

    if (type === 'urgent') {
      // URGENT: 3 loud rapid beeps (arrived!)
      [0, 0.3, 0.6].forEach((delay) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = 1000;
        osc.type = 'square';
        gain.gain.setValueAtTime(0.8, ctx.currentTime + delay);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + delay + 0.25);
        osc.start(ctx.currentTime + delay);
        osc.stop(ctx.currentTime + delay + 0.25);
      });
      // Extra high pitch alert
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.frequency.value = 1400;
      osc2.type = 'sawtooth';
      gain2.gain.setValueAtTime(0.6, ctx.currentTime + 1.0);
      gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1.5);
      osc2.start(ctx.currentTime + 1.0);
      osc2.stop(ctx.currentTime + 1.5);
    } else {
      // NORMAL: 2 beeps
      [0, 0.35].forEach((delay) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = 880;
        osc.type = 'sine';
        gain.gain.setValueAtTime(0.7, ctx.currentTime + delay);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + delay + 0.3);
        osc.start(ctx.currentTime + delay);
        osc.stop(ctx.currentTime + delay + 0.3);
      });
    }

    // Auto close context after sounds finish
    setTimeout(() => ctx.close(), 2000);
  } catch (e) {
    console.warn('Audio failed:', e);
  }
}

// Vibrate phone
function vibratePhone(type = 'normal') {
  if (!navigator.vibrate) return;
  if (type === 'urgent') {
    // Long strong vibration pattern for urgent
    navigator.vibrate([300, 100, 300, 100, 500]);
  } else {
    // Normal vibration
    navigator.vibrate([200, 100, 200]);
  }
}

// Request notification permission
function requestNotifPermission() {
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
  }
}

// Send browser notification
function sendNotification(title, body) {
  // Try service worker notification first (works better on mobile)
  if (navigator.serviceWorker?.controller) {
    navigator.serviceWorker.ready.then(reg => {
      reg.showNotification(title, {
        body,
        icon: '/icon-192.png',
        badge: '/icon-192.png',
        vibrate: [300, 100, 300, 100, 300],
        tag: 'teacher-call-' + Date.now(),
        requireInteraction: true,
        renotify: true,
      });
    }).catch(() => {});
  }
  // Also try regular Notification as fallback
  if ('Notification' in window && Notification.permission === 'granted') {
    try {
      const notif = new Notification(title, {
        body,
        icon: '/icon-192.png',
        badge: '/icon-192.png',
        tag: 'teacher-notif-' + Date.now(),
        requireInteraction: true,
      });
      notif.onclick = () => { window.focus(); notif.close(); };
    } catch {}
  }
}

// Full alert: sound + vibrate + notification
function triggerAlert(callType, studentName) {
  const isUrgent = callType === 'arrived';
  const callLabel = callType === 'five_minutes' ? '5 ນາທີ' : callType === 'ten_minutes' ? '10 ນາທີ' : 'ຮອດແລ້ວ!';

  // 1. Play alarm sound
  playAlarm(isUrgent ? 'urgent' : 'normal');

  // 2. Vibrate phone
  vibratePhone(isUrgent ? 'urgent' : 'normal');

  // 3. Toast notification (in-app)
  if (isUrgent) {
    toast(`🔴 ${studentName} — ຜູ້ປົກຄອງຮອດແລ້ວ!`, { icon: '🚨', duration: 6000, style: { background: '#FEE2E2', color: '#991B1B', fontWeight: 'bold' } });
  } else {
    toast(`📢 ${studentName} — ຜູ້ປົກຄອງ ${callLabel}`, { icon: '🔔', duration: 4000 });
  }

  // 4. Browser/push notification (works in background)
  const title = isUrgent ? '🚨 ຜູ້ປົກຄອງຮອດແລ້ວ!' : '📢 ເອີ້ນນັກຮຽນ';
  sendNotification(title, `${studentName} — ${callLabel}`);
}

export default function TeacherDashboard() {
  const { user, logout } = useAuth();
  const [calls, setCalls] = useState([]);
  const { confirmPickup, loading } = usePickup();
  const [notifPermission, setNotifPermission] = useState(
    'Notification' in window ? Notification.permission : 'denied'
  );

  // Request notification permission on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then(p => setNotifPermission(p));
    }
  }, []);

  const handleRequestPermission = async () => {
    if ('Notification' in window) {
      const p = await Notification.requestPermission();
      setNotifPermission(p);
      if (p === 'granted') {
        toast.success('ເປີດການແຈ້ງເຕືອນສຳເລັດ!');
        // Test sound+vibrate on permission grant
        playAlarm('normal');
        vibratePhone('normal');
      }
    }
  };

  const fetchCalls = useCallback(async () => {
    try {
      const { data } = await api.get('/pickup/queue');
      let filtered = data.all || [];
      if (user?.classroomId) {
        filtered = filtered.filter(c => c.student?.classroomId === user.classroomId);
      }
      const priority = { arrived: 0, five_minutes: 1, ten_minutes: 2 };
      filtered.sort((a, b) => (priority[a.callType] ?? 9) - (priority[b.callType] ?? 9) || a.queuePosition - b.queuePosition);
      setCalls(filtered);
    } catch { toast.error('ໂຫຼດຄິວບໍ່ສຳເລັດ'); }
  }, [user?.classroomId]);

  useEffect(() => { fetchCalls(); }, [fetchCalls]);

  // Refresh when tab becomes visible again
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        fetchCalls();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('focus', fetchCalls);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('focus', fetchCalls);
    };
  }, [fetchCalls]);

  // Fallback polling every 8 seconds
  useEffect(() => {
    const t = setInterval(fetchCalls, 8000);
    return () => clearInterval(t);
  }, [fetchCalls]);

  // ===== SOCKET EVENTS =====
  useSocketEvent('queue-update', useCallback(() => fetchCalls(), [fetchCalls]));
  useSocketEvent('call-completed', useCallback(() => fetchCalls(), [fetchCalls]));
  useSocketEvent('call-cancelled', useCallback(() => fetchCalls(), [fetchCalls]));

  // NEW CALL — main alert handler
  useSocketEvent('new-call', useCallback((data) => {
    console.log('🔔 new-call received:', data);
    const myClassroom = !user?.classroomId || data.student?.classroomId === user.classroomId;
    if (myClassroom) {
      const name = data.student?.nickname || data.student?.firstName || 'ນັກຮຽນ';
      triggerAlert(data.callType, name);
    }
    fetchCalls();
  }, [fetchCalls, user?.classroomId]));

  // ESCALATED — urgent alert
  useSocketEvent('call-escalated', useCallback((data) => {
    console.log('🚨 call-escalated received:', data);
    const name = data.student?.nickname || data.student?.firstName || 'ນັກຮຽນ';
    triggerAlert('arrived', name);
    fetchCalls();
  }, [fetchCalls]));

  // CLASSROOM NOTIFICATION
  useSocketEvent('notification:new', useCallback((data) => {
    console.log('📢 notification:new received:', data);
    playAlarm('normal');
    vibratePhone('normal');
    toast(data.message, { icon: '🔔', duration: 5000 });
    sendNotification('🔔 ແຈ້ງເຕືອນ', data.message);
    fetchCalls();
  }, [fetchCalls]));

  const handleConfirm = async (id) => {
    await confirmPickup(id);
    fetchCalls();
  };

  const arrivedCount = calls.filter(c => c.callType === 'arrived').length;
  const comingCount = calls.filter(c => c.callType !== 'arrived').length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-700 to-blue-500 text-white shadow-lg">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold lao">👩‍🏫 {user?.name}</h1>
            <p className="text-blue-200 text-sm lao">{user?.classroom?.className || 'ທຸກຫ້ອງ'}</p>
          </div>
          <div className="flex items-center gap-3">
            {calls.length > 0 && (
              <span className="bg-red-500 text-white text-sm font-bold w-7 h-7 rounded-full flex items-center justify-center animate-pulse">
                {calls.length}
              </span>
            )}
            <button onClick={logout} className="text-blue-200 hover:text-white text-sm lao">ອອກ</button>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-4">
        {/* Notification permission banner */}
        {notifPermission === 'default' && (
          <button onClick={handleRequestPermission}
            className="w-full mb-4 py-3 px-4 bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-400 rounded-xl text-yellow-800 text-sm font-bold lao text-center animate-pulse">
            🔔 ກົດເພື່ອເປີດສຽງ + ການສັ່ນ — ແຈ້ງເຕືອນແມ້ພັບຈໍ!
          </button>
        )}

        {/* Test sound button (for debugging) */}
        <button onClick={() => { playAlarm('urgent'); vibratePhone('urgent'); toast('🔊 ທົດສອບສຽງ + ສັ່ນ', { icon: '✅' }); }}
          className="w-full mb-4 py-2 px-4 bg-gray-100 border border-gray-300 rounded-xl text-gray-600 text-xs lao text-center">
          🔊 ທົດສອບສຽງແຈ້ງເຕືອນ
        </button>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="bg-white rounded-xl shadow-sm p-4 text-center">
            <p className="text-3xl font-bold text-gray-800">{calls.length}</p>
            <p className="text-xs text-gray-500 lao">ທັງໝົດ</p>
          </div>
          <div className="bg-orange-50 rounded-xl shadow-sm p-4 text-center">
            <p className="text-3xl font-bold text-orange-500">{comingCount}</p>
            <p className="text-xs text-orange-600 lao">ກຳລັງມາ</p>
          </div>
          <div className="bg-red-50 rounded-xl shadow-sm p-4 text-center">
            <p className="text-3xl font-bold text-red-500">{arrivedCount}</p>
            <p className="text-xs text-red-600 lao">ຮອດແລ້ວ!</p>
          </div>
        </div>

        {/* Queue */}
        {calls.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p className="text-5xl mb-3">😴</p>
            <p className="lao">ບໍ່ມີນ້ອງຖືກເອີ້ນ</p>
          </div>
        ) : (
          <div className="space-y-3">
            {calls.map(call => (
              <CallCard key={call.id} call={call} onConfirm={handleConfirm} loading={loading} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
