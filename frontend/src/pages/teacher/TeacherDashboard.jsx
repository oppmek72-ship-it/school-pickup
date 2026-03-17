import { useState, useEffect, useCallback } from 'react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { useSocketEvent } from '../../hooks/useSocket';
import { usePickup } from '../../hooks/usePickup';
import QueueList from '../../components/QueueList';
import NotificationBell from '../../components/NotificationBell';
import toast from 'react-hot-toast';

export default function TeacherDashboard() {
  const { user } = useAuth();
  const [queue, setQueue] = useState([]);
  const { confirmPickup, loading } = usePickup();

  const fetchQueue = useCallback(async () => {
    try {
      const { data } = await api.get('/pickup/queue');
      setQueue(data);
    } catch (e) {
      toast.error('ບໍ່ສາມາດໂຫຼດຄິວ');
    }
  }, []);

  useEffect(() => {
    fetchQueue();
  }, [fetchQueue]);

  useSocketEvent('queue:updated', useCallback((data) => {
    setQueue(data.queue);
  }, []));

  const handleConfirm = async (requestId) => {
    await confirmPickup(requestId);
    fetchQueue();
  };

  const arrivedCount = queue.filter(q => q.status === 'arrived').length;
  const comingCount = queue.filter(q => q.status === 'coming').length;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-blue-600 text-white">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">ແດັດບອດຄູ</h1>
            <p className="text-blue-200 text-sm">{user?.name}</p>
          </div>
          <div className="flex items-center gap-3">
            <NotificationBell />
            <a href="/login" onClick={(e) => { e.preventDefault(); localStorage.clear(); window.location.href = '/login'; }}
              className="text-blue-200 hover:text-white text-sm">ອອກ</a>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-4">
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="bg-white rounded-xl shadow-sm p-4 text-center">
            <p className="text-2xl font-bold text-blue-600">{queue.length}</p>
            <p className="text-xs text-gray-500">ທັງໝົດ</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4 text-center">
            <p className="text-2xl font-bold text-orange-500">{comingCount}</p>
            <p className="text-xs text-gray-500">ກຳລັງມາ</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4 text-center">
            <p className="text-2xl font-bold text-green-600">{arrivedCount}</p>
            <p className="text-xs text-gray-500">ມາຮອດແລ້ວ</p>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 pb-6">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">ຄິວລໍຖ້າ</h2>
        <QueueList queue={queue} onConfirm={handleConfirm} loading={loading} />
      </div>
    </div>
  );
}
