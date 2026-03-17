import StatusBadge from './StatusBadge';

export default function StudentCard({ student, children }) {
  return (
    <div className="bg-white rounded-xl shadow-md p-4 mb-4">
      <div className="flex items-center gap-4">
        <div className="w-15 h-15 rounded-full bg-blue-100 flex items-center justify-center text-2xl font-bold text-blue-700 shrink-0">
          {student.name.charAt(0)}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-gray-900 truncate">{student.name}</h3>
          <p className="text-sm text-gray-500">ຊັ້ນ {student.class}</p>
          <StatusBadge status={student.status} />
        </div>
      </div>
      {children && <div className="mt-4">{children}</div>}
    </div>
  );
}
