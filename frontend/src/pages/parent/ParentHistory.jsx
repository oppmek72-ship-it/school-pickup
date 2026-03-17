import { useState, useEffect } from 'react';
import api from '../../api/axios';

export default function ParentHistory() {
  const [history, setHistory] = useState([]);

  useEffect(() => {
    api.get('/history').then(({ data }) => setHistory(data)).catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-md mx-auto px-4 py-3">
          <h1 className="text-lg font-bold text-gray-900">ປະຫວັດການຮັບ</h1>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-4">
        {history.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <p className="text-4xl mb-2">📋</p>
            <p>ບໍ່ມີປະຫວັດການຮັບ</p>
          </div>
        ) : (
          <div className="space-y-3">
            {history.map((item) => (
              <div key={item.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900">{item.student.name}</h3>
                    <p className="text-sm text-gray-500">ຊັ້ນ {item.student.class}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-700">
                      {new Date(item.pickupTime).toLocaleDateString('lo-LA')}
                    </p>
                    <p className="text-xs text-gray-400">
                      {new Date(item.pickupTime).toLocaleTimeString('lo-LA', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
                {item.teacher && (
                  <p className="text-xs text-gray-400 mt-2">ຢືນຢັນໂດຍ: {item.teacher.name}</p>
                )}
                {item.carPlate && (
                  <p className="text-xs text-gray-400">ລົດ: {item.carPlate}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
