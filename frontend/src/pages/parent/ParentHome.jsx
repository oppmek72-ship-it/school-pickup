import { useState, useEffect, useCallback } from 'react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { useSocketEvent } from '../../hooks/useSocket';
import { usePickup } from '../../hooks/usePickup';
import toast from 'react-hot-toast';

function Avatar({ student, size = 'md' }) {
  const sizes = { sm: 'w-12 h-12 text-xl', md: 'w-20 h-20 text-3xl', lg: 'w-28 h-28 text-5xl' };
  const initials = (student.nickname || student.firstName || '?').charAt(0);
  if (student.photo) {
    return <img src={student.photo} alt={student.firstName} className={`${sizes[size]} rounded-full object-cover border-4 border-white shadow-lg`} />;
  }
  const colors = ['bg-blue-500', 'bg-purple-500', 'bg-pink-500', 'bg-orange-500', 'bg-teal-500'];
  const color = colors[student.id % colors.length];
  return (
    <div className={`${sizes[size]} ${color} rounded-full flex items-center justify-center text-white font-bold border-4 border-white shadow-lg`}>
      {initials}
    </div>
  );
}

function CountdownTimer({ expiresAt, callType }) {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    if (!expiresAt) return;
    const update = () => {
      const diff = new Date(expiresAt) - Date.now();
      if (diff <= 0) { setTimeLeft('ໝົດເວລາ'); return; }
      const m = Math.floor(diff / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTimeLeft(`${m}:${String(s).padStart(2, '0')}`);
    };
    update();
    const t = setInterval(update, 1000);
    return () => clearInterval(t);
  }, [expiresAt]);

  if (!expiresAt) return null;
  return (
    <span className={`font-mono font-bold ${callType === 'five_minutes' ? 'text-orange-600' : 'text-blue-600'}`}>
      ⏱ {timeLeft}
    </span>
  );
}

const CALL_BUTTONS = [
  { type: 'five_minutes', label: '5 ນາທີ', sub: 'ຈະຮອດໃນ 5 ນາທີ', emoji: '⏱️', bg: 'bg-orange-500 hover:bg-orange-600', shadow: 'shadow-orange-300' },
  { type: 'ten_minutes', label: '10 ນາທີ', sub: 'ຈະຮອດໃນ 10 ນາທີ', emoji: '⏱️', bg: 'bg-blue-600 hover:bg-blue-700', shadow: 'shadow-blue-300' },
  { type: 'arrived', label: 'ຮອດແລ້ວ!', sub: 'ກຳລັງລໍຖ້າຢູ່ທ້າຍ', emoji: '✅', bg: 'bg-emerald-500 hover:bg-emerald-600', shadow: 'shadow-emerald-300' },
];

export default function ParentHome() {
  const { user } = useAuth();
  const [students, setStudents] = useState([]);
  const [activeIdx, setActiveIdx] = useState(0);
  const [confirmCancel, setConfirmCancel] = useState(null);
  const { createRequest, cancelRequest, loading } = usePickup();

  const fetchStudents = useCallback(async () => {
    try {
      const { data } = await api.get('/students');
      setStudents(data);
    } catch { toast.error('ໂຫຼດຂໍ້ມູນນັກຮຽນບໍ່ສຳເລັດ'); }
  }, []);

  useEffect(() => { fetchStudents(); }, [fetchStudents]);

  useSocketEvent('queue-update', useCallback(() => fetchStudents(), [fetchStudents]));
  useSocketEvent('call-completed', useCallback(() => { toast.success('ຮັບນ້ອງແລ້ວ ✅'); fetchStudents(); }, [fetchStudents]));

  const student = students[activeIdx];
  const activeCall = student?.pickupRequests?.[0];

  const handleCall = async (callType) => {
    if (!student) return;
    try {
      await createRequest(student.id, callType);
      fetchStudents();
    } catch {}
  };

  const handleCancel = async () => {
    if (!confirmCancel) return;
    try {
      await cancelRequest(confirmCancel);
      setConfirmCancel(null);
      fetchStudents();
    } catch {}
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-700 to-blue-500 text-white shadow-lg">
        <div className="max-w-md mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <p className="text-blue-100 text-xs lao">ສະບາຍດີ</p>
            <h1 className="text-lg font-bold lao">{user?.name}</h1>
          </div>
          <div className="text-right">
            <p className="text-2xl">🏫</p>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-5 space-y-5">

        {/* Student tabs (if multiple) */}
        {students.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-1">
            {students.map((s, i) => (
              <button key={s.id} onClick={() => setActiveIdx(i)}
                className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition lao ${
                  i === activeIdx ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-gray-600 border shadow hover:bg-blue-50'
                }`}>
                {s.nickname || s.firstName}
              </button>
            ))}
          </div>
        )}

        {/* Student card */}
        {student ? (
          <div className="bg-white rounded-2xl shadow-md p-5">
            <div className="flex items-center gap-4">
              <Avatar student={student} size="md" />
              <div>
                <h2 className="text-xl font-bold text-gray-900 lao">{student.firstName} {student.lastName}</h2>
                {student.nickname && <p className="text-gray-500 lao">ຊື່ຫຼິ້ນ: {student.nickname}</p>}
                <p className="text-blue-600 font-medium lao">{student.classroom?.className || student.classroom?.classCode}</p>
                <p className="text-xs text-gray-400 font-mono">{student.studentCode}</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-12 text-gray-400 lao">
            <p className="text-5xl mb-3">📚</p>
            <p>ບໍ່ພົບຂໍ້ມູນນັກຮຽນ</p>
          </div>
        )}

        {/* Active call status */}
        {activeCall && (
          <div className={`rounded-2xl p-4 border-2 ${
            activeCall.callType === 'arrived' ? 'bg-emerald-50 border-emerald-300' :
            activeCall.callType === 'five_minutes' ? 'bg-orange-50 border-orange-300' :
            'bg-blue-50 border-blue-300'
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-bold text-gray-800 lao">
                  {activeCall.callType === 'arrived' ? '✅ ແຈ້ງຮອດແລ້ວ' :
                   activeCall.callType === 'five_minutes' ? '⏱️ ເອີ້ນ 5 ນາທີ' : '⏱️ ເອີ້ນ 10 ນາທີ'}
                </p>
                <p className="text-sm text-gray-500 lao">
                  ເວລາ: {new Date(activeCall.calledAt).toLocaleTimeString('lo-LA', { hour: '2-digit', minute: '2-digit' })}
                  {activeCall.queuePosition && ` · ລຳດັບ #${activeCall.queuePosition}`}
                </p>
              </div>
              <CountdownTimer expiresAt={activeCall.expiresAt} callType={activeCall.callType} />
            </div>
            <button onClick={() => setConfirmCancel(activeCall.id)}
              className="mt-3 w-full py-2 rounded-xl bg-red-50 text-red-600 text-sm font-medium hover:bg-red-100 transition lao">
              ຍົກເລີກການເອີ້ນ
            </button>
          </div>
        )}

        {/* Call buttons */}
        {student && !activeCall && (
          <div className="space-y-3">
            <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider lao">ເລືອກການເອີ້ນ</p>
            {CALL_BUTTONS.map((btn) => (
              <button key={btn.type} onClick={() => handleCall(btn.type)} disabled={loading}
                className={`w-full py-5 rounded-2xl text-white font-bold text-lg shadow-lg transition-all active:scale-95 disabled:opacity-50 lao ${btn.bg} ${btn.shadow}`}>
                <span className="text-2xl">{btn.emoji}</span>
                <span className="ml-3">{btn.label}</span>
                <p className="text-sm font-normal opacity-80 mt-0.5">{btn.sub}</p>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Cancel confirm dialog */}
      {confirmCancel && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm space-y-4">
            <h3 className="text-lg font-bold text-gray-900 lao">ຢືນຢັນຍົກເລີກ?</h3>
            <p className="text-gray-600 lao">ທ່ານຕ້ອງການຍົກເລີກການເອີ້ນນ້ອງຄືນບໍ?</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmCancel(null)}
                className="flex-1 py-3 rounded-xl bg-gray-100 text-gray-700 font-medium lao">ບໍ່</button>
              <button onClick={handleCancel} disabled={loading}
                className="flex-1 py-3 rounded-xl bg-red-600 text-white font-bold lao">ຍົກເລີກ</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
