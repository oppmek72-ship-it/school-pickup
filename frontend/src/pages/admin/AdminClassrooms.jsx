import { useState, useEffect, useCallback } from 'react';
import api from '../../api/axios';
import toast from 'react-hot-toast';

export default function AdminClassrooms() {
  const [classrooms, setClassrooms] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ className: '', gradeLevel: '', classCode: '', teacherName: '' });

  const fetchClassrooms = useCallback(async () => {
    const { data } = await api.get('/admin/classrooms');
    setClassrooms(data);
  }, []);
  useEffect(() => { fetchClassrooms(); }, [fetchClassrooms]);

  const openAdd = () => { setEditing(null); setForm({ className: '', gradeLevel: '', classCode: '', teacherName: '' }); setShowForm(true); };
  const openEdit = (c) => { setEditing(c.id); setForm({ className: c.className, gradeLevel: c.gradeLevel, classCode: c.classCode, teacherName: c.teacherName || '' }); setShowForm(true); };

  const submit = async (e) => {
    e.preventDefault();
    try {
      if (editing) await api.put(`/admin/classrooms/${editing}`, form);
      else await api.post('/admin/classrooms', form);
      toast.success('ບັນທຶກສຳເລັດ'); setShowForm(false); fetchClassrooms();
    } catch (err) { toast.error(err.response?.data?.error || 'ຜິດພາດ'); }
  };

  const del = async (id) => {
    if (!confirm('ລົບຫ້ອງນີ້?')) return;
    await api.delete(`/admin/classrooms/${id}`);
    toast.success('ລົບແລ້ວ'); fetchClassrooms();
  };

  return (
    <div>
      <h2 className="text-lg font-bold mb-4 lao">🏫 ຫ້ອງຮຽນ</h2>
      <button onClick={openAdd} className="w-full py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold lao mb-4">+ ເພີ່ມຫ້ອງຮຽນ</button>
      <div className="space-y-2">
        {classrooms.map(c => (
          <div key={c.id} className="bg-white rounded-xl shadow-sm p-3 flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center text-purple-700 font-bold text-sm shrink-0">{c.classCode}</div>
            <div className="flex-1">
              <p className="font-semibold lao">{c.className}</p>
              <p className="text-xs text-gray-400 lao">{c.teacherName} · {c._count?.students || 0} ຄົນ</p>
            </div>
            <button onClick={() => openEdit(c)} className="text-blue-500 text-sm px-3 py-1.5 hover:bg-blue-50 rounded-lg">ແກ້</button>
            <button onClick={() => del(c.id)} className="text-red-500 text-sm px-3 py-1.5 hover:bg-red-50 rounded-lg">ລົບ</button>
          </div>
        ))}
      </div>
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm space-y-3">
            <h3 className="text-lg font-bold lao">{editing ? 'ແກ້ໄຂຫ້ອງ' : 'ເພີ່ມຫ້ອງ'}</h3>
            <form onSubmit={submit} className="space-y-3">
              {[
                { key: 'className', label: 'ຊື່ຫ້ອງ (ເຊັ່ນ: ຫ້ອງ ປ.3/1)', required: true },
                { key: 'gradeLevel', label: 'ລະດັບ (ປ.1, ມ.3 ...)', required: true },
                { key: 'classCode', label: 'ລະຫັດຫ້ອງ (P3-1)', required: true },
                { key: 'teacherName', label: 'ຊື່ຄູ' },
              ].map(f => (
                <div key={f.key}>
                  <label className="text-sm font-medium text-gray-700 lao">{f.label}</label>
                  <input value={form[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                    required={f.required} className="w-full mt-1 px-3 py-2.5 border rounded-xl text-sm" />
                </div>
              ))}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-2.5 rounded-xl bg-gray-100 lao">ຍົກເລີກ</button>
                <button type="submit" className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white font-bold lao">ບັນທຶກ</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
