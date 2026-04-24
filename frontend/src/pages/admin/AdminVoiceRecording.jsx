import { useState, useEffect, useRef } from 'react';
import api from '../../api/axios';
import { API_BASE } from '../../api/config';
import toast from 'react-hot-toast';

function RecordModal({ student, onClose, onSaved }) {
  const [status, setStatus] = useState('idle'); // idle, recording, recorded
  const [audioUrl, setAudioUrl] = useState(null);
  const [audioDataUrl, setAudioDataUrl] = useState(null);
  const [timer, setTimer] = useState(0);
  const [saving, setSaving] = useState(false);
  const [hasExisting, setHasExisting] = useState(!!student.hasVoiceRecording);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);
  const streamRef = useRef(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
      if (timerRef.current) clearInterval(timerRef.current);
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, [audioUrl]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Find supported mime type
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
          ? 'audio/webm'
          : 'audio/ogg';

      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);

        // Convert to base64 data URL
        const reader = new FileReader();
        reader.onloadend = () => setAudioDataUrl(reader.result);
        reader.readAsDataURL(blob);

        // Stop mic
        stream.getTracks().forEach(t => t.stop());
        setStatus('recorded');
      };

      recorder.start();
      setStatus('recording');
      setTimer(0);

      // Timer
      timerRef.current = setInterval(() => {
        setTimer(t => {
          if (t >= 10) {
            recorder.stop();
            clearInterval(timerRef.current);
            return 10;
          }
          return t + 1;
        });
      }, 1000);
    } catch (err) {
      toast.error('ບໍ່ສາມາດເຂົ້າເຖິງໄມໂຄຣໂຟນ — ກະລຸນາອະນຸຍາດ');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop();
      clearInterval(timerRef.current);
    }
  };

  const resetRecording = () => {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioUrl(null);
    setAudioDataUrl(null);
    setStatus('idle');
    setTimer(0);
  };

  const saveRecording = async () => {
    if (!audioDataUrl) return;
    setSaving(true);
    try {
      await api.put(`/voice/${student.id}`, { voiceRecording: audioDataUrl });
      toast.success(`ບັນທຶກສຽງ ${student.firstName} ສຳເລັດ!`);
      setHasExisting(true);
      onSaved();
    } catch (err) {
      toast.error('ບັນທຶກບໍ່ສຳເລັດ: ' + (err.response?.data?.error || err.message));
    }
    setSaving(false);
  };

  const deleteRecording = async () => {
    if (!confirm('ລຶບສຽງຂອງ ' + student.firstName + '?')) return;
    try {
      await api.delete(`/voice/${student.id}`);
      toast.success('ລຶບສຽງສຳເລັດ');
      setHasExisting(false);
      onSaved();
    } catch {
      toast.error('ລຶບບໍ່ສຳເລັດ');
    }
  };

  const playExisting = () => {
    const audio = new Audio(`${API_BASE}/students/${student.id}/voice?t=${Date.now()}`);
    audio.play().catch(() => toast.error('ຫຼິ້ນສຽງບໍ່ໄດ້'));
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-md p-6 space-y-5" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-gray-900 lao">🎙️ ບັນທຶກສຽງ</h3>
            <p className="text-gray-500 text-sm lao">{student.firstName} {student.lastName} — {student.classroom?.className}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
        </div>

        {/* Hint */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
          <p className="text-blue-700 text-xs lao">
            💡 ຕົວຢ່າງ: "ນ້ອງ {student.firstName} {student.lastName} ຫ້ອງ {student.classroom?.className} ກັບບ້ານ ຜູ້ປົກຄອງມາຮັບແລ້ວ"
          </p>
        </div>

        {/* Existing recording */}
        {hasExisting && status === 'idle' && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <p className="text-green-700 text-sm font-bold lao">✅ ມີສຽງບັນທຶກແລ້ວ</p>
              <div className="flex gap-2">
                <button onClick={playExisting} className="bg-green-500 text-white px-3 py-1.5 rounded-lg text-sm font-bold">
                  ▶️ ຟັງ
                </button>
                <button onClick={deleteRecording} className="bg-red-100 text-red-600 px-3 py-1.5 rounded-lg text-sm font-bold">
                  🗑️ ລຶບ
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Recording UI */}
        <div className="text-center">
          {status === 'idle' && (
            <button onClick={startRecording}
              className="w-32 h-32 rounded-full bg-gradient-to-br from-red-500 to-red-600 text-white mx-auto flex flex-col items-center justify-center shadow-xl hover:scale-105 transition-transform">
              <span className="text-4xl">🎙️</span>
              <span className="text-xs mt-1 font-bold lao">ກົດເພື່ອບັນທຶກ</span>
            </button>
          )}

          {status === 'recording' && (
            <div className="space-y-4">
              <button onClick={stopRecording}
                className="w-32 h-32 rounded-full bg-red-600 text-white mx-auto flex flex-col items-center justify-center shadow-xl animate-pulse">
                <span className="text-4xl">⏹️</span>
                <span className="text-xs mt-1 font-bold lao">ກົດເພື່ອຢຸດ</span>
              </button>
              <div className="flex items-center justify-center gap-2">
                <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>
                <span className="text-red-600 font-mono text-2xl font-bold">{timer}s / 10s</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-red-500 h-2 rounded-full transition-all" style={{ width: `${timer * 10}%` }}></div>
              </div>
            </div>
          )}

          {status === 'recorded' && (
            <div className="space-y-4">
              <div className="bg-gray-100 rounded-xl p-4">
                <p className="text-gray-600 text-sm mb-2 lao">🔊 ຟັງສຽງທີ່ບັນທຶກ:</p>
                <audio src={audioUrl} controls className="w-full" />
              </div>
              <div className="flex gap-3">
                <button onClick={resetRecording}
                  className="flex-1 py-3 rounded-xl bg-gray-200 text-gray-700 font-bold lao">
                  🔄 ບັນທຶກໃໝ່
                </button>
                <button onClick={saveRecording} disabled={saving}
                  className="flex-1 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold disabled:opacity-50 lao">
                  {saving ? '⏳ ກຳລັງບັນທຶກ...' : '💾 ບັນທຶກ'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AdminVoiceRecording() {
  const [students, setStudents] = useState([]);
  const [classrooms, setClassrooms] = useState([]);
  const [filterClassroom, setFilterClassroom] = useState('');
  const [search, setSearch] = useState('');
  const [recording, setRecording] = useState(null); // student being recorded
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [sRes, cRes] = await Promise.all([
        api.get('/students'),
        api.get('/students/classrooms')
      ]);
      setStudents(sRes.data);
      setClassrooms(cRes.data);
    } catch {
      toast.error('ໂຫຼດຂໍ້ມູນບໍ່ສຳເລັດ');
    }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const filtered = students.filter(s => {
    if (filterClassroom && s.classroomId !== parseInt(filterClassroom)) return false;
    if (search) {
      const q = search.toLowerCase();
      return (s.firstName?.toLowerCase().includes(q) ||
              s.lastName?.toLowerCase().includes(q) ||
              s.nickname?.toLowerCase().includes(q) ||
              s.studentCode?.toLowerCase().includes(q));
    }
    return true;
  });

  const voiceCount = students.filter(s => s.hasVoiceRecording).length;

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-xl p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-purple-800 lao">🎙️ ບັນທຶກສຽງປະກາດ</h2>
            <p className="text-purple-600 text-sm lao">ອັດສຽງເອງສຳລັບນັກຮຽນແຕ່ລະຄົນ</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-purple-700">{voiceCount}/{students.length}</p>
            <p className="text-xs text-purple-500 lao">ມີສຽງແລ້ວ</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <input
          type="text"
          placeholder="ຄົ້ນຫາຊື່..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl text-sm lao focus:ring-2 focus:ring-purple-400 focus:border-transparent"
        />
        <select value={filterClassroom} onChange={e => setFilterClassroom(e.target.value)}
          className="px-4 py-2.5 border border-gray-300 rounded-xl text-sm lao">
          <option value="">ທຸກຫ້ອງ</option>
          {classrooms.map(c => (
            <option key={c.id} value={c.id}>{c.className}</option>
          ))}
        </select>
      </div>

      {/* Student list */}
      {loading ? (
        <div className="text-center py-8 text-gray-400 lao">ກຳລັງໂຫຼດ...</div>
      ) : (
        <div className="space-y-2">
          {filtered.map(student => (
            <div key={student.id}
              className={`flex items-center gap-3 p-3 rounded-xl border ${student.hasVoiceRecording ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200'}`}>
              {/* Avatar */}
              <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold shrink-0">
                {(student.nickname || student.firstName || '?').charAt(0)}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-bold text-gray-900 text-sm lao truncate">
                    {student.firstName} {student.lastName}
                  </p>
                  {student.hasVoiceRecording && (
                    <span className="text-green-500 text-xs">✅</span>
                  )}
                </div>
                <p className="text-gray-500 text-xs lao">
                  {student.classroom?.className} · {student.studentCode}
                  {student.nickname && ` · ${student.nickname}`}
                </p>
              </div>

              {/* Action buttons */}
              <div className="flex gap-2 shrink-0">
                {student.hasVoiceRecording && (
                  <button
                    onClick={() => {
                      const audio = new Audio(`${API_BASE}/students/${student.id}/voice?t=${Date.now()}`);
                      audio.play();
                    }}
                    className="bg-green-100 text-green-700 px-2 py-1.5 rounded-lg text-xs font-bold">
                    ▶️
                  </button>
                )}
                <button
                  onClick={() => setRecording(student)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold lao ${
                    student.hasVoiceRecording
                      ? 'bg-orange-100 text-orange-700'
                      : 'bg-purple-500 text-white'
                  }`}>
                  {student.hasVoiceRecording ? '🔄 ອັດໃໝ່' : '🎙️ ບັນທຶກ'}
                </button>
              </div>
            </div>
          ))}

          {filtered.length === 0 && (
            <div className="text-center py-8 text-gray-400 lao">ບໍ່ພົບນັກຮຽນ</div>
          )}
        </div>
      )}

      {/* Record Modal */}
      {recording && (
        <RecordModal
          student={recording}
          onClose={() => setRecording(null)}
          onSaved={() => { setRecording(null); fetchData(); }}
        />
      )}
    </div>
  );
}
