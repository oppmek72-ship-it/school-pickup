import StatusBadge from './StatusBadge';

export default function QueueList({ queue, onConfirm, loading }) {
  if (queue.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400">
        <p className="text-5xl mb-4">📭</p>
        <p className="text-lg">ບໍ່ມີຄິວລໍຖ້າ</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {queue.map((item, index) => (
        <div
          key={item.id}
          className={`bg-white rounded-xl shadow-sm border p-4 transition-all ${
            item.status === 'arrived' ? 'border-yellow-400 bg-yellow-50' : 'border-gray-100'
          }`}
        >
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-lg shrink-0">
              {index + 1}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-gray-900">{item.student.name}</h3>
                <span className="text-sm text-gray-500">ຊັ້ນ {item.student.class}</span>
              </div>
              <p className="text-sm text-gray-600">
                ຜູ້ປົກຄອງ: {item.parent.name} | {item.parent.phone}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <StatusBadge status={item.status} />
                {item.status === 'coming' && item.eta && (
                  <span className="text-xs text-orange-600">({item.eta} ນາທີ)</span>
                )}
                {item.carPlate && (
                  <span className="text-xs text-gray-500">ລົດ: {item.carPlate} {item.carColor}</span>
                )}
              </div>
            </div>
            {item.status === 'arrived' && (
              <button
                onClick={() => onConfirm(item.id)}
                disabled={loading}
                className="px-4 py-2 rounded-lg text-white font-medium transition disabled:opacity-50 shrink-0"
                style={{ backgroundColor: 'var(--success)' }}
              >
                ✓ ຢືນຢັນຮັບ
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
