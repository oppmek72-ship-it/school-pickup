import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { io } from 'socket.io-client';

export default function GateDisplay() {
  const [queue, setQueue] = useState([]);
  const [announcement, setAnnouncement] = useState(null);

  useEffect(() => {
    fetch('/api/pickup/active')
      .then(res => res.json())
      .then(data => setQueue(data))
      .catch(() => {});

    const socket = io('/', { transports: ['websocket', 'polling'] });
    socket.emit('join:gate');

    socket.on('queue:updated', (data) => {
      setQueue(data.queue);
    });

    socket.on('student:called', (data) => {
      setAnnouncement(data);
      setTimeout(() => setAnnouncement(null), 10000);
    });

    return () => socket.close();
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  return (
    <div className="min-h-screen text-white relative overflow-hidden" style={{ backgroundColor: '#0D1B2A' }}>
      <AnimatePresence>
        {announcement && (
          <motion.div
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            className="absolute top-0 left-0 right-0 z-50 bg-yellow-400 text-gray-900 py-4 px-6 text-center"
          >
            <p className="text-2xl md:text-3xl font-bold">
              {announcement.studentName} ຊັ້ນ {announcement.class} - ກະລຸນາມາທີ່ປະຕູ
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="text-center pt-8 pb-4">
        <h1 className="text-3xl md:text-5xl font-bold tracking-wider">STUDENT PICK-UP</h1>
        <div className="flex items-center justify-center gap-4 mt-4">
          <div className="h-px w-20 bg-blue-400/50" />
          <p className="text-blue-300 text-lg md:text-xl">Pick-up Queue</p>
          <div className="h-px w-20 bg-blue-400/50" />
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-6">
        {queue.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-6xl mb-4 opacity-50">🏫</p>
            <p className="text-xl text-blue-300/60">ບໍ່ມີຄິວລໍຖ້າ</p>
          </div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence>
              {queue.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: -50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 50 }}
                  transition={{ delay: index * 0.1 }}
                  className={`rounded-2xl p-5 md:p-6 flex items-center gap-6 transition-all ${
                    item.status === 'arrived'
                      ? 'bg-yellow-400/20 border-2 border-yellow-400'
                      : 'bg-white/5 border border-white/10'
                  }`}
                  style={item.status === 'arrived' ? { animation: 'pulse 2s infinite' } : {}}
                >
                  <div className={`w-14 h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center text-2xl md:text-3xl font-bold shrink-0 ${
                    item.status === 'arrived' ? 'bg-yellow-400 text-gray-900' : 'bg-blue-600 text-white'
                  }`}>
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <h2 className={`text-2xl md:text-4xl font-bold ${
                      item.status === 'arrived' ? 'text-yellow-300' : 'text-white'
                    }`}>
                      {item.student.name}
                    </h2>
                    <p className="text-blue-300 text-lg md:text-xl mt-1">ຊັ້ນ {item.student.class}</p>
                  </div>
                  <div className="text-right">
                    {item.status === 'arrived' ? (
                      <span className="bg-yellow-400 text-gray-900 px-4 py-2 rounded-full text-sm md:text-base font-bold">
                        ມາຮອດແລ້ວ
                      </span>
                    ) : (
                      <span className="bg-blue-600/50 text-blue-200 px-4 py-2 rounded-full text-sm md:text-base">
                        ກຳລັງມາ {item.eta && `(${item.eta} ນາທີ)`}
                      </span>
                    )}
                    {item.carPlate && (
                      <p className="text-blue-400/60 text-sm mt-2">ລົດ: {item.carPlate}</p>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      <div className="absolute bottom-0 left-0 right-0 pointer-events-none opacity-20">
        <svg viewBox="0 0 1440 200" className="w-full">
          <rect x="100" y="100" width="120" height="100" rx="4" fill="#42A5F5" />
          <rect x="110" y="120" width="30" height="30" rx="2" fill="#0D1B2A" />
          <rect x="180" y="120" width="30" height="30" rx="2" fill="#0D1B2A" />
          <rect x="145" y="150" width="30" height="50" rx="2" fill="#0D1B2A" />
          <polygon points="100,100 160,50 220,100" fill="#1565C0" />
          <rect x="300" y="80" width="180" height="120" rx="4" fill="#42A5F5" />
          <rect x="310" y="100" width="35" height="35" rx="2" fill="#0D1B2A" />
          <rect x="360" y="100" width="35" height="35" rx="2" fill="#0D1B2A" />
          <rect x="410" y="100" width="35" height="35" rx="2" fill="#0D1B2A" />
          <rect x="370" y="155" width="40" height="45" rx="2" fill="#0D1B2A" />
          <rect x="370" y="60" width="40" height="20" rx="2" fill="#1565C0" />
          <polygon points="300,80 390,30 480,80" fill="#1565C0" />
          <rect x="550" y="120" width="100" height="80" rx="4" fill="#42A5F5" />
          <rect x="560" y="140" width="25" height="25" rx="2" fill="#0D1B2A" />
          <rect x="610" y="140" width="25" height="25" rx="2" fill="#0D1B2A" />
          <polygon points="550,120 600,80 650,120" fill="#1565C0" />
          <circle cx="750" cy="160" r="20" fill="#2E7D32" />
          <rect x="747" y="160" width="6" height="40" fill="#1B5E20" />
          <circle cx="820" cy="150" r="25" fill="#2E7D32" />
          <rect x="817" y="150" width="6" height="50" fill="#1B5E20" />
          <rect x="0" y="200" width="1440" height="2" fill="#42A5F5" opacity="0.3" />
        </svg>
      </div>

      <button
        onClick={toggleFullscreen}
        className="fixed bottom-4 right-4 bg-white/10 hover:bg-white/20 text-white p-3 rounded-full transition"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
        </svg>
      </button>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.85; }
        }
      `}</style>
    </div>
  );
}
