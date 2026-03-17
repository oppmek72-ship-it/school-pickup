import { useState, useEffect, useCallback } from 'react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { useSocketEvent } from '../../hooks/useSocket';
import { usePickup } from '../../hooks/usePickup';
import StudentCard from '../../components/StudentCard';
import PickupButton from '../../components/PickupButton';
import NotificationBell from '../../components/NotificationBell';
import toast from 'react-hot-toast';

export default function ParentHome() {
  const { user } = useAuth();
  const [students, setStudents] = useState([]);
  const [showModal, setShowModal] = useState(null);
  const [carPlate, setCarPlate] = useState('');
  const [carColor, setCarColor] = useState('ຂາວ');
  const { createRequest, markArrived, cancelRequest, loading } = usePickup();

  const fetchStudents = useCallback(async () => {
    try {
      const { data } = await api.get('/students');
      setStudents(data);
    } catch (e) {
      toast.error('ບໍ່ສາມາດໂຫຼດຂໍ້ມູນນັກຮຽນ');
    }
  }, []);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  useSocketEvent('queue:updated', useCallback(() => {
    fetchStudents();
  }, [fetchStudents]));

  useSocketEvent('pickup:confirmed', useCallback((data) => {
    toast.success(data.message);
    fetchStudents();
  }, [fetchStudents]));

  const handleRequest = (studentId, eta) => {
    setShowModal({ studentId, eta });
  };

  const submitRequest = async () => {
    if (!showModal) return;
    try {
      await createRequest(showModal.studentId, showModal.eta, carPlate, carColor);
      setShowModal(null);
      setCarPlate('');
      setCarColor('ຂາວ');
      fetchStudents();
    } catch (e) {}
  };

  const handleArrive = async (requestId) => {
    await markArrived(requestId);
    fetchStudents();
  };

  const handleCancel = async (requestId) => {
    await cancelRequest(requestId);
    fetchStudents();
  };

  const colorOptions = ['ຂາວ', 'ດຳ', 'ເງິນ', 'ແດງ', 'ຟ້າ', 'ຂຽວ', 'ອື່ນໆ'];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-gray-900">ສະບາຍດີ, {user?.name}</h1>
            <p className="text-xs text-gray-500">ລະບົບຮັບ-ສົ່ງນັກຮຽນ</p>
          </div>
          <NotificationBell />
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-4">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">ລູກຂອງທ່ານ</h2>
        {students.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <p className="text-4xl mb-2">📚</p>
            <p>ບໍ່ພົບຂໍ້ມູນນັກຮຽນ</p>
          </div>
        ) : (
          students.map((student) => {
            const activeRequest = student.pickupRequests?.[0];
            return (
              <StudentCard key={student.id} student={student}>
                <PickupButton
                  student={student}
                  activeRequest={activeRequest}
                  onRequest={handleRequest}
                  onArrive={handleArrive}
                  onCancel={handleCancel}
                  loading={loading}
                />
              </StudentCard>
            );
          })
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 px-4">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-md p-6 space-y-4">
            <h3 className="text-lg font-bold text-gray-900">ຂໍ້ມູນລົດ</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ເລກທະບຽນລົດ</label>
              <input
                type="text"
                value={carPlate}
                onChange={(e) => setCarPlate(e.target.value)}
                placeholder="ເຊັ່ນ: ກທ 1234"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ສີລົດ</label>
              <div className="grid grid-cols-4 gap-2">
                {colorOptions.map((color) => (
                  <button
                    key={color}
                    onClick={() => setCarColor(color)}
                    className={`py-2 rounded-lg text-sm font-medium transition ${
                      carColor === color
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {color}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowModal(null)}
                className="flex-1 py-3 rounded-xl font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition"
              >
                ຍົກເລີກ
              </button>
              <button
                onClick={submitRequest}
                disabled={loading}
                className="flex-1 py-3 rounded-xl font-bold text-white transition disabled:opacity-50"
                style={{ backgroundColor: 'var(--primary)' }}
              >
                {loading ? 'ກຳລັງສົ່ງ...' : 'ຕົກລົງ'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
