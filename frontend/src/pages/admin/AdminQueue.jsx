import { useState, useEffect, useCallback } from 'react';
import api from '../../api/axios';
import toast from 'react-hot-toast';

export default function AdminQueue() {
  const [queue, setQueue] = useState({ all: [] });

  const fetchQueue = useCallback(async () => {
    const { data } = await api.get('/pickup/queue');
    setQueue(data);
  }, []);

  useEffect(() => { fetchQueue(); const t = setInterval(fetchQueue, 5000); return () => clearInterval(t); }, [fetchQueue]);

  const cancel = async (id) => {
    await api.put(`/admin/pickup/${id}/cancel`);
    toast.success('ຍົກເລີກແລ້ວ'); fetchQueue();
  };

  const confirm = async (id) => {
    await api.put(`/pickup/${id}/confirm`);
    toast.success('ສົ່ງນ້ອງແລ້ວ'); fetchQueue();
  };

  const typeLabel = { five_minutes: '5ນ', ten_minutes: '10ນ', arrived: '✅' };
  const typeBg = { five_minutes: 'bg-orange-100 text-orange-700', ten_minutes: 'bg-blue-100 text-blue-700', arrived: 'bg-green-100 text-green-700' };

  return (
    <div>
      <h2 className="text-lg font-bold mb-4 lao">🔴 Live Queue</h2>
      <div className="space-y-2">
        {(queue.all || []).length === 0 ? (
          <p className="text-center text-gray-400 py-8 lao">ບໍ່ມີໃນຄິວ</p>
        ) : (
          (queue.all || []).map(c => (
            <div key={c.id} className="bg-white rounded-xl shadow-sm p-3 flex items-center gap-3">
              <span className={`text-xs font-bold px-2 py-1 rounded-full ${typeBg[c.callType] || 'bg-gray-100'} shrink-0`}>
                {typeLabel[c.callType] || c.callType}
              </span>
              <div className="flex-1">
                <p className="font-semibold lao">{c.student?.nickname || c.student?.firstName} {c.student?.lastName}</p>
                <p className="text-xs text-gray-400 lao">{c.student?.classroom?.className} · ຄິວ #{c.queuePosition}</p>
              </div>
              <button onClick={() => confirm(c.id)} className="text-emerald-600 text-xs px-2 py-1.5 hover:bg-emerald-50 rounded-lg lao">ສົ່ງ</button>
              <button onClick={() => cancel(c.id)} className="text-red-500 text-xs px-2 py-1.5 hover:bg-red-50 rounded-lg lao">ຍົກເລີກ</button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
