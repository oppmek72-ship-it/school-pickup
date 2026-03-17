const statusConfig = {
  at_school: { label: 'ຢູ່ໂຮງຮຽນ', color: 'bg-blue-100 text-blue-700' },
  called: { label: 'ກຳລັງຖືກເອີ້ນ', color: 'bg-orange-100 text-orange-700' },
  picked_up: { label: 'ຮັບແລ້ວ', color: 'bg-green-100 text-green-700' },
  coming: { label: 'ກຳລັງມາ', color: 'bg-orange-100 text-orange-700' },
  arrived: { label: 'ມາຮອດແລ້ວ', color: 'bg-green-100 text-green-700' },
  confirmed: { label: 'ຢືນຢັນແລ້ວ', color: 'bg-green-100 text-green-700' },
  cancelled: { label: 'ຍົກເລີກ', color: 'bg-red-100 text-red-700' }
};

export default function StatusBadge({ status }) {
  const config = statusConfig[status] || { label: status, color: 'bg-gray-100 text-gray-700' };
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium mt-1 ${config.color}`}>
      {config.label}
    </span>
  );
}
