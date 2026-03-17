export default function PickupButton({ student, activeRequest, onRequest, onArrive, onCancel, loading }) {
  if (activeRequest?.status === 'arrived') {
    return (
      <div className="space-y-2">
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
          <p className="text-green-700 font-medium">ມາຮອດແລ້ວ - ລໍຖ້າຢືນຢັນ</p>
        </div>
        <button
          onClick={() => onCancel(activeRequest.id)}
          disabled={loading}
          className="w-full py-2 rounded-lg text-sm font-medium bg-red-50 text-red-600 hover:bg-red-100 transition disabled:opacity-50"
        >
          ຍົກເລີກ
        </button>
      </div>
    );
  }

  if (activeRequest?.status === 'coming') {
    return (
      <div className="space-y-2">
        <button
          onClick={() => onArrive(activeRequest.id)}
          disabled={loading}
          className="w-full py-3 rounded-xl text-white font-bold text-lg transition disabled:opacity-50"
          style={{ backgroundColor: 'var(--success)' }}
        >
          {loading ? 'ກຳລັງດຳເນີນ...' : 'ມາຮອດແລ້ວ'}
        </button>
        <button
          onClick={() => onCancel(activeRequest.id)}
          disabled={loading}
          className="w-full py-2 rounded-lg text-sm font-medium bg-red-50 text-red-600 hover:bg-red-100 transition disabled:opacity-50"
        >
          ຍົກເລີກ
        </button>
      </div>
    );
  }

  return (
    <div className="flex gap-2">
      <button
        onClick={() => onRequest(student.id, 10)}
        disabled={loading}
        className="flex-1 py-3 rounded-xl text-white font-bold transition disabled:opacity-50"
        style={{ backgroundColor: 'var(--warning)' }}
      >
        ກຳລັງມາ 10 ນາທີ
      </button>
      <button
        onClick={() => onRequest(student.id, 5)}
        disabled={loading}
        className="flex-1 py-3 rounded-xl text-white font-bold transition disabled:opacity-50"
        style={{ backgroundColor: 'var(--primary)' }}
      >
        ກຳລັງມາ 5 ນາທີ
      </button>
    </div>
  );
}
