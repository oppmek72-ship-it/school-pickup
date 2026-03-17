import { useState, useEffect } from 'react';
import api from '../../api/axios';

export default function TeacherHistory() {
  const [history, setHistory] = useState([]);

  useEffect(() => {
    api.get('/history').then(({ data }) => setHistory(data)).catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-blue-600 text-white">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <h1 className="text-xl font-bold">ປະຫວັດການຮັບ</h1>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-4">
        {history.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <p className="text-4xl mb-2">📋</p>
            <p>ບໍ່ມີປະຫວັດ</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">ນັກຮຽນ</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">ຊັ້ນ</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">ຜູ້ປົກຄອງ</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">ວັນທີ/ເວລາ</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">ລົດ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {history.map((item) => (
                  <tr key={item.id}>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{item.student.name}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{item.student.class}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{item.parent.name}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {new Date(item.pickupTime).toLocaleString('lo-LA')}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">{item.carPlate || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
