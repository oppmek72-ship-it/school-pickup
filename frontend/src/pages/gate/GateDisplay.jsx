import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { io } from 'socket.io-client';

// ===== TEXT-TO-SPEECH SYSTEM =====
const speechQueue = [];
let isSpeaking = false;

function speakText(text, lang = 'th-TH') {
  if (!('speechSynthesis' in window)) return;

  return new Promise((resolve) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = 0.85;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    // Try to find a Thai/Lao voice (Lao uses Thai voice on most devices)
    const voices = speechSynthesis.getVoices();
    const thaiVoice = voices.find(v => v.lang.startsWith('th')) ||
                      voices.find(v => v.lang.startsWith('lo')) ||
                      voices.find(v => v.lang.includes('TH'));
    if (thaiVoice) utterance.voice = thaiVoice;

    utterance.onend = resolve;
    utterance.onerror = resolve;
    speechSynthesis.speak(utterance);
  });
}

async function processSpeechQueue() {
  if (isSpeaking || speechQueue.length === 0) return;
  isSpeaking = true;
  while (speechQueue.length > 0) {
    const text = speechQueue.shift();
    await speakText(text);
    // Small pause between announcements
    await new Promise(r => setTimeout(r, 500));
  }
  isSpeaking = false;
}

function queueAnnouncement(text) {
  speechQueue.push(text);
  processSpeechQueue();
}

function announceStudent(student, callType) {
  const name = student?.nickname || student?.firstName || '';
  const lastName = student?.lastName || '';
  const classroom = student?.classroom?.className || '';

  let announcement = '';
  if (callType === 'arrived') {
    announcement = `${name} ${lastName}, ${classroom}, ກັບບ້ານ, ຜູ້ປົກຄອງມາຮັບແລ້ວ`;
  } else if (callType === 'five_minutes') {
    announcement = `${name} ${lastName}, ${classroom}, ຜູ້ປົກຄອງຈະມາຮັບໃນ 5 ນາທີ, ກະລຸນາກຽມຕົວ`;
  } else if (callType === 'ten_minutes') {
    announcement = `${name} ${lastName}, ${classroom}, ຜູ້ປົກຄອງຈະມາຮັບໃນ 10 ນາທີ`;
  }

  if (announcement) queueAnnouncement(announcement);
}

// ===== COMPONENTS =====
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

function QueueRow({ item, index, isSpeakingThis }) {
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
      className={`flex items-center gap-4 px-5 py-3.5 border-l-4 ${c.border} ${c.rowBg} border-b border-white/5 ${isSpeakingThis ? 'ring-2 ring-yellow-400 bg-yellow-400/10' : ''}`}
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
        <div className="flex items-center gap-2">
          <p className="text-white font-bold text-xl lao truncate">{name} {lastName}</p>
          {isSpeakingThis && (
            <span className="text-yellow-400 animate-pulse text-lg">🔊</span>
          )}
        </div>
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

// ===== MAIN COMPONENT =====
export default function GateDisplay() {
  const [queue, setQueue] = useState({ fiveMinutes: [], tenMinutes: [], arrived: [] });
  const [announcement, setAnnouncement] = useState(null);
  const [clock, setClock] = useState('');
  const [voiceEnabled, setVoiceEnabled] = useState(() => {
    const saved = localStorage.getItem('monitor-voice');
    return saved !== null ? saved === 'true' : true; // default ON
  });
  const [speakingStudentId, setSpeakingStudentId] = useState(null);
  const voiceEnabledRef = useRef(voiceEnabled);
  const announcedCallsRef = useRef(new Set());
  const socketRef = useRef(null);

  // Keep ref in sync
  useEffect(() => {
    voiceEnabledRef.current = voiceEnabled;
    localStorage.setItem('monitor-voice', String(voiceEnabled));
  }, [voiceEnabled]);

  // Load voices (needed for some browsers)
  useEffect(() => {
    if ('speechSynthesis' in window) {
      speechSynthesis.getVoices();
      speechSynthesis.onvoiceschanged = () => speechSynthesis.getVoices();
    }
  }, []);

  // Clock
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
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const freqs = [523, 659, 784, 1047];
      freqs.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain); gain.connect(ctx.destination);
        osc.frequency.value = freq;
        osc.type = 'sine';
        const t = ctx.currentTime + i * 0.18;
        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(0.5, t + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.6);
        osc.start(t); osc.stop(t + 0.6);
      });
      setTimeout(() => ctx.close(), 2000);
    } catch {}
  }, []);

  // Announce a student with chime + TTS
  const announceWithVoice = useCallback((student, callType, callId) => {
    if (!voiceEnabledRef.current) return;
    if (announcedCallsRef.current.has(callId)) return;
    announcedCallsRef.current.add(callId);

    // Play chime first
    playChime();

    // Then speak after chime
    setTimeout(() => {
      if (!voiceEnabledRef.current) return;
      setSpeakingStudentId(student?.id || null);
      announceStudent(student, callType);
      // Clear speaking indicator after estimated speech time
      setTimeout(() => setSpeakingStudentId(null), 5000);
    }, 900);
  }, [playChime]);

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

  // Socket connection
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

    socket.on('new-call', (data) => {
      console.log('📢 Monitor new-call:', data);
      // Announce the student name
      if (data.student) {
        announceWithVoice(data.student, data.callType, data.callId);
      }

      // Show banner for arrived
      if (data.callType === 'arrived' || !data.callType) {
        const name = data.student?.nickname || data.student?.firstName || '';
        const cls = data.student?.classroom?.className || '';
        setAnnouncement({ text: `${name} ${cls} — ກັບບ້ານ ຜູ້ປົກຄອງມາຮັບແລ້ວ`, id: Date.now() });
        setTimeout(() => setAnnouncement(null), 8000);
      }
    });

    socket.on('call-completed', () => fetchQueue());
    socket.on('call-cancelled', () => fetchQueue());

    socket.on('call-escalated', (data) => {
      console.log('📢 Monitor call-escalated:', data);
      if (data.student) {
        announceWithVoice(data.student, 'arrived', `escalated_${data.callId}`);
      }
      const name = data.student?.nickname || data.student?.firstName || '';
      const cls = data.student?.classroom?.className || '';
      setAnnouncement({ text: `${name} ${cls} — ຜູ້ປົກຄອງຮອດແລ້ວ! ກະລຸນາກຽມຕົວ`, id: Date.now() });
      setTimeout(() => setAnnouncement(null), 8000);
    });

    return () => socket.close();
  }, [fetchQueue, announceWithVoice]);

  // Fallback polling every 10s
  useEffect(() => {
    const t = setInterval(fetchQueue, 10000);
    return () => clearInterval(t);
  }, [fetchQueue]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen();
    else document.exitFullscreen();
  };

  const toggleVoice = () => {
    const newVal = !voiceEnabled;
    setVoiceEnabled(newVal);
    if (newVal) {
      // Test voice on enable
      speechSynthesis.cancel();
      queueAnnouncement('ເປີດສຽງປະກາດແລ້ວ');
    } else {
      speechSynthesis.cancel();
      speechQueue.length = 0;
      isSpeaking = false;
    }
  };

  // Manual announce button for a specific student
  const manualAnnounce = (item) => {
    if (!voiceEnabled) return;
    playChime();
    setTimeout(() => {
      setSpeakingStudentId(item.student?.id || null);
      announceStudent(item.student, item.callType);
      setTimeout(() => setSpeakingStudentId(null), 5000);
    }, 900);
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
      {/* Announcement Banner */}
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

      {/* Header */}
      <div className="bg-gradient-to-r from-blue-900 to-blue-800 px-6 py-4 flex items-center justify-between border-b border-white/10">
        <div className="flex items-center gap-3">
          <span className="text-3xl">🏫</span>
          <div>
            <h1 className="text-2xl font-bold">ໂຮງຮຽນ ເພັດດາຣາ</h1>
            <p className="text-blue-300 text-sm">ລະບົບເອີ້ນນັກຮຽນກັບບ້ານ</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {/* Voice Toggle Button */}
          <button
            onClick={toggleVoice}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${
              voiceEnabled
                ? 'bg-green-500 hover:bg-green-600 text-white shadow-lg shadow-green-500/30'
                : 'bg-white/10 hover:bg-white/20 text-white/60'
            }`}
          >
            {voiceEnabled ? (
              <>
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M14.016 3.234a.75.75 0 01.484.698v16.136a.75.75 0 01-1.21.593L7.688 16.5H4.5a2.25 2.25 0 01-2.25-2.25v-4.5A2.25 2.25 0 014.5 7.5h3.188l5.602-4.161a.75.75 0 01.726-.105z" />
                  <path d="M18.584 5.106a.75.75 0 011.06 0c3.808 3.807 3.808 9.98 0 13.788a.75.75 0 01-1.06-1.06 8.25 8.25 0 000-11.668.75.75 0 010-1.06z" />
                  <path d="M16.928 7.762a.75.75 0 011.06 0 5.25 5.25 0 010 7.425.75.75 0 01-1.06-1.06 3.75 3.75 0 000-5.305.75.75 0 010-1.06z" />
                </svg>
                <span>ສຽງເປີດ</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M13.5 4.06c0-1.336-1.616-2.005-2.56-1.06l-4.5 4.5H4.508c-1.141 0-2.318.664-2.66 1.905A9.76 9.76 0 001.5 12c0 .898.121 1.768.35 2.595.341 1.24 1.518 1.905 2.659 1.905h1.93l4.5 4.5c.945.945 2.561.276 2.561-1.06V4.06z" />
                  <path d="M17.78 9.22a.75.75 0 10-1.06 1.06L18.44 12l-1.72 1.72a.75.75 0 101.06 1.06l1.72-1.72 1.72 1.72a.75.75 0 101.06-1.06L20.56 12l1.72-1.72a.75.75 0 10-1.06-1.06l-1.72 1.72-1.72-1.72z" />
                </svg>
                <span>ສຽງປິດ</span>
              </>
            )}
          </button>

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

      {/* Queue List */}
      <div className="overflow-y-auto" style={{ height: 'calc(100vh - 85px)' }}>
        {totalCount === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-white/30">
            <p className="text-7xl mb-4">😴</p>
            <p className="text-2xl">ບໍ່ມີນ້ອງໃນຄິວ</p>
            {voiceEnabled && <p className="text-sm mt-2 text-white/20">🔊 ສຽງປະກາດເປີດຢູ່ — ຈະອ່ານຊື່ເມື່ອມີນັກຮຽນ</p>}
          </div>
        ) : (
          <AnimatePresence>
            {allCalls.map((item, i) => (
              <div key={item.id} className="relative group">
                <QueueRow item={item} index={i} isSpeakingThis={speakingStudentId === item.student?.id} />
                {/* Manual re-announce button */}
                {voiceEnabled && (
                  <button
                    onClick={() => manualAnnounce(item)}
                    className="absolute right-20 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1.5 rounded-lg text-sm font-bold transition-all"
                  >
                    🔊 ປະກາດ
                  </button>
                )}
              </div>
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* Bottom controls */}
      <div className="fixed bottom-4 right-4 flex items-center gap-2">
        <button onClick={toggleFullscreen}
          className="bg-white/10 hover:bg-white/20 text-white p-3 rounded-full transition">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
          </svg>
        </button>
      </div>
    </div>
  );
}
