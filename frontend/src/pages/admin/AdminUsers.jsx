import { useState, useEffect, useCallback } from 'react';
import api from '../../api/axios';
import toast from 'react-hot-toast';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [classrooms, setClassrooms] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', username: '', phone: '', role: 'teacher', classroomId: '', password: '' });

  const fetchUsers = useCallback(async () => {
    const { data } = await api.get('/admin/users');
    setUsers(data);
  }, []);

  useEffect(() => {
    fetchUsers();
    api.get('/students/classrooms').then(r => setClassrooms(r.data)).catch(() => {});
  }, [fetchUsers]);

  const openAdd = () => { setEditing(null); setForm({ name: '', username: '', phone: '', role: 'teacher', classroomId: '', password: '123456' }); setShowForm(true); };
  const openEdit = (u) => { setEditing(u.id); setForm({ name: u.name, username: u.username || '', phone: u.phone || '', role: u.role, classroomId: u.classroomId || '', password: '' }); setShowForm(true); };

  const submit = async (e) => {
    e.preventDefault();
    try {
      if (editing) await api.put(`/admin/users/${editing}`, form);
      else await api.post('/admin/users', form);
      toast.success('ບັນທຶກສຳເລັດ'); setShowForm(false); fetchUsers();
    } catch (err) { toast.error(err.response?.data?.error || 'ຜິດພາດ'); }
  };

  const del = async (id) => {
    if (!confirm('ປິດໃຊ້ user ນີ້?')) return;
    await api.delete(`/admin/users/${id}`);
    toast.success('ປິດໃຊ້ແລ້ວ'); fetchUsers();
  };

  const roleLabels = { admin: '⚙️ Admin', teacher: '👩‍🏫 ຄູ', parent: '👨‍👩‍👧 ຜູ້ປົກຄອງ' };

  return (
    <div>
      <h2 className="text-lg font-bold mb-4 lao">👤 Users</h2>
      <button onClick={openAdd} className="w-full py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold lao mb-4">+ ເພີ່ມ User</button>
      <div className="space-y-2">
        {users.map(u => (
          <div key={u.id} className={`bg-white rounded-xl shadow-sm p-3 flex items-center gap-3 ${!u.isActive ? 'opacity-40' : ''}`}>
            <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center font-bold text-gray-500 text-sm shrink-0">
              {u.name.charAt(0)}
            </div>
            <div className="flex-1">
              <p className="font-semibold lao">{u.name}</p>
              <p className="text-xs text-gray-400">{roleLabels[u.role]} · {u.username || u.phone}</p>
            </div>
            <button onClick={() => openEdit(u)} className="text-blue-500 text-sm px-3 py-1.5 hover:bg-blue-50 rounded-lg">ແກ້</button>
            <button onClick={() => del(u.id)} className="text-red-500 text-sm px-3 py-1.5 hover:bg-red-50 rounded-lg">ລົບ</button>
          </div>
        ))}
      </div>
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm space-y-3 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold lao">{editing ? 'ແກ້ໄຂ User' : 'ເພີ່ມ User'}</h3>
            <form onSubmit={submit} className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-700 lao">ຊື່</label>
                <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required className="w-full mt-1 px-3 py-2.5 border rounded-xl text-sm" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Role</label>
                <select value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))} className="w-full mt-1 px-3 py-2.5 border rounded-xl text-sm lao">
                  <option value="teacher">👩‍🏫 ຄູ</option>
                  <option value="admin">⚙️ Admin</option>
                  <option value="parent">👨‍👩‍👧 ຜູ້ປົກຄອງ</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 lao">Username (ໃຊ້ Login)</label>
                <input value={form.username} onChange={e => setForm(p => ({ ...p, username: e.target.value }))} className="w-full mt-1 px-3 py-2.5 border rounded-xl text-sm" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 lao">ເບີໂທ</label>
                <input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} className="w-full mt-1 px-3 py-2.5 border rounded-xl text-sm" />
              </div>
              {form.role === 'teacher' && (
                <div>
                  <label className="text-sm font-medium text-gray-700 lao">ຫ້ອງ</label>
                  <select value={form.classroomId} onChange={e => setForm(p => ({ ...p, classroomId: e.target.value }))} className="w-full mt-1 px-3 py-2.5 border rounded-xl text-sm lao">
                    <option value="">— ເລືອກ —</option>
                    {classrooms.map(c => <option key={c.id} value={c.id}>{c.className}</option>)}
                  </select>
                </div>
              )}
              <div>
                <label className="text-sm font-medium text-gray-700 lao">{editing ? 'ລະຫັດໃໝ່ (ເວັ້ນວ່າງ=ບໍ່ປ່ຽນ)' : 'ລະຫັດຜ່ານ'}</label>
                <input type="password" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                  required={!editing} className="w-full mt-1 px-3 py-2.5 border rounded-xl text-sm" />
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
