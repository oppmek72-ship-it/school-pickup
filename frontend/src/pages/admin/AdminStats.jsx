import { useState, useEffect } from 'react';
import api from '../../api/axios';

export default function AdminStats() {
  const [stats, setStats] = useState(null);
  useEffect(() => { api.get('/admin/stats').then(r => setStats(r.data)).catch(() => {}); }, []);

  if (!stats) return <p className="text-center text-gray-400 py-16 lao">ກຳລັງໂຫຼດ...</p>;

  return (
    <div>
      <h2 className="text-lg font-bold mb-4 lao">📊 ສະຖິຕິ</h2>
      <div className="grid grid-cols-2 gap-4">
        {[
          { label: 'ນັກຮຽນທັງໝົດ', value: stats.totalStudents, icon: '👨‍🎓', color: 'bg-blue-50 text-blue-700' },
          { label: 'Users ທັງໝົດ', value: stats.totalUsers, icon: '👤', color: 'bg-purple-50 text-purple-700' },
          { label: 'ຮັບມື້ນີ້', value: stats.todayPickups, icon: '✅', color: 'bg-green-50 text-green-700' },
          { label: 'ຄິວ active', value: stats.activeQueue, icon: '⏳', color: 'bg-orange-50 text-orange-700' },
        ].map(s => (
          <div key={s.label} className={`${s.color} rounded-2xl p-5 text-center`}>
            <p className="text-4xl mb-2">{s.icon}</p>
            <p className="text-3xl font-bold">{s.value}</p>
            <p className="text-sm mt-1 lao">{s.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
