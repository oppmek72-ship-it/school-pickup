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

export default function TeacherDashboard() {
  const { user, logout } = useAuth();
  const [calls, setCalls] = useState([]);
  const { confirmPickup, loading } = usePickup();
  const audioCtx = useRef(null);

  const playBeep = () => {
    try {
      if (!audioCtx.current) audioCtx.current = new (window.AudioContext || window.webkitAudioContext)();
      const ctx = audioCtx.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.frequency.value = 880; osc.type = 'sine';
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
      osc.start(); osc.stop(ctx.currentTime + 0.4);
    } catch {}
  };

  const fetchCalls = useCallback(async () => {
    try {
      const { data } = await api.get('/pickup/queue');
      // Filter: teacher sees only their classroom
      let filtered = data.all || [];
      if (user?.classroomId) {
        filtered = filtered.filter(c => c.student?.classroomId === user.classroomId);
      }
      // Sort: arrived first, then 5min, then 10min; then by queuePosition
      const priority = { arrived: 0, five_minutes: 1, ten_minutes: 2 };
      filtered.sort((a, b) => (priority[a.callType] ?? 9) - (priority[b.callType] ?? 9) || a.queuePosition - b.queuePosition);
      setCalls(filtered);
    } catch { toast.error('ໂຫຼດຄິວບໍ່ສຳເລັດ'); }
  }, [user?.classroomId]);

  useEffect(() => { fetchCalls(); }, [fetchCalls]);

  useSocketEvent('queue-update', useCallback(() => fetchCalls(), [fetchCalls]));
  useSocketEvent('new-call', useCallback((data) => {
    if (!user?.classroomId || data.student?.classroomId === user.classroomId) {
      playBeep();
      toast(`📢 ເອີ້ນ ${data.student?.nickname || data.student?.firstName}`, { icon: '🔔' });
    }
    fetchCalls();
  }, [fetchCalls, user?.classroomId]));
  useSocketEvent('call-escalated', useCallback((data) => {
    playBeep();
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
