import { useState, useEffect, useCallback } from 'react';
import api from '../../api/axios';
import toast from 'react-hot-toast';

export default function AdminStudents() {
  const [students, setStudents] = useState([]);
  const [classrooms, setClassrooms] = useState([]);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ studentCode: '', firstName: '', lastName: '', nickname: '', classroomId: '', parentName: '', parentPhone: '' });

  const fetchStudents = useCallback(async () => {
    const { data } = await api.get('/students');
    setStudents(data);
  }, []);

  useEffect(() => {
    fetchStudents();
    api.get('/students/classrooms').then(r => setClassrooms(r.data)).catch(() => {});
  }, [fetchStudents]);

  const filtered = students.filter(s =>
    s.firstName.includes(search) || s.lastName.includes(search) ||
    s.studentCode.includes(search.toUpperCase()) || (s.nickname || '').includes(search)
  );

  const openAdd = () => { setEditing(null); setForm({ studentCode: '', firstName: '', lastName: '', nickname: '', classroomId: '', parentName: '', parentPhone: '' }); setShowForm(true); };
  const openEdit = (s) => { setEditing(s.id); setForm({ studentCode: s.studentCode, firstName: s.firstName, lastName: s.lastName, nickname: s.nickname || '', classroomId: s.classroomId || '', parentName: s.parentName || '', parentPhone: s.parentPhone || '' }); setShowForm(true); };

  const submit = async (e) => {
    e.preventDefault();
    try {
      if (editing) await api.put(`/students/${editing}`, form);
      else await api.post('/students', form);
      toast.success(editing ? 'ແກ້ໄຂສຳເລັດ' : 'ເພີ່ມສຳເລັດ');
      setShowForm(false); fetchStudents();
    } catch (err) { toast.error(err.response?.data?.error || 'ຜິດພາດ'); }
  };

  const del = async (id) => {
    if (!confirm('ລົບນັກຮຽນນີ້?')) return;
    await api.delete(`/students/${id}`);
    toast.success('ລົບແລ້ວ'); fetchStudents();
  };

  return (
    <div>
      <h2 className="text-lg font-bold mb-4 lao">👨‍🎓 ນັກຮຽນ</h2>
      <div className="flex gap-3 mb-4">
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="ຄົ້ນຫານັກຮຽນ..." className="flex-1 px-4 py-2.5 border rounded-xl lao text-sm" />
        <button onClick={openAdd} className="px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold lao">+ ເພີ່ມ</button>
      </div>
      <div className="space-y-2">
        {filtered.map(s => (
          <div key={s.id} className="bg-white rounded-xl shadow-sm p-3 flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold shrink-0">
              {(s.nickname || s.firstName).charAt(0)}
            </div>
            <div className="flex-1">
              <p className="font-semibold lao">{s.firstName} {s.lastName} {s.nickname && `(${s.nickname})`}</p>
              <p className="text-xs text-gray-400">{s.studentCode} · {s.classroom?.className || '-'}</p>
            </div>
            <button onClick={() => openEdit(s)} className="text-blue-500 text-sm px-3 py-1.5 hover:bg-blue-50 rounded-lg">ແກ້</button>
            <button onClick={() => del(s.id)} className="text-red-500 text-sm px-3 py-1.5 hover:bg-red-50 rounded-lg">ລົບ</button>
          </div>
        ))}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md space-y-3 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold lao">{editing ? 'ແກ້ໄຂນັກຮຽນ' : 'ເພີ່ມນັກຮຽນ'}</h3>
            <form onSubmit={submit} className="space-y-3">
              {[
                { key: 'studentCode', label: 'ລະຫັດ (STD-XXXX)', required: true },
                { key: 'firstName', label: 'ຊື່', required: true },
                { key: 'lastName', label: 'ນາມສະກຸນ', required: true },
                { key: 'nickname', label: 'ຊື່ຫຼິ້ນ' },
                { key: 'parentName', label: 'ຊື່ຜູ້ປົກຄອງ' },
                { key: 'parentPhone', label: 'ເບີໂທຜູ້ປົກຄອງ' },
              ].map(f => (
                <div key={f.key}>
                  <label className="text-sm font-medium text-gray-700 lao">{f.label}</label>
                  <input value={form[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                    required={f.required} className="w-full mt-1 px-3 py-2.5 border rounded-xl text-sm" />
                </div>
              ))}
              <div>
                <label className="text-sm font-medium text-gray-700 lao">ຫ້ອງຮຽນ</label>
                <select value={form.classroomId} onChange={e => setForm(p => ({ ...p, classroomId: e.target.value }))}
                  className="w-full mt-1 px-3 py-2.5 border rounded-xl text-sm lao">
                  <option value="">— ເລືອກຫ້ອງ —</option>
                  {classrooms.map(c => <option key={c.id} value={c.id}>{c.className}</option>)}
                </select>
              </div>
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
