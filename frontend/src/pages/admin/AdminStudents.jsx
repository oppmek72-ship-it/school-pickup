import { useState, useEffect, useCallback, useMemo } from 'react';
import api from '../../api/axios';
import toast from 'react-hot-toast';

export default function AdminStudents() {
  const [students, setStudents] = useState([]);
  const [classrooms, setClassrooms] = useState([]);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ studentCode: '', firstName: '', lastName: '', nickname: '', classroomId: '', parentName: '', parentPhone: '' });
  const [view, setView] = useState('list'); // 'list' | 'families'
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [families, setFamilies] = useState([]);

  const fetchStudents = useCallback(async () => {
    const { data } = await api.get('/students');
    setStudents(data);
  }, []);

  const fetchFamilies = useCallback(async () => {
    try {
      const { data } = await api.get('/students/families');
      setFamilies(data);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    fetchStudents();
    api.get('/students/classrooms').then(r => setClassrooms(r.data)).catch(() => {});
  }, [fetchStudents]);

  useEffect(() => {
    if (view === 'families') fetchFamilies();
  }, [view, fetchFamilies]);

  const filtered = useMemo(() => students.filter(s =>
    s.firstName.includes(search) || s.lastName.includes(search) ||
    s.studentCode.includes(search.toUpperCase()) || (s.nickname || '').includes(search) ||
    (s.parentPhone || '').includes(search) || (s.parentName || '').includes(search)
  ), [students, search]);

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

  const copyId = async (code) => {
    try {
      await navigator.clipboard.writeText(code);
      toast.success(`ຄັດລອກ ${code} ແລ້ວ`);
    } catch {
      // Fallback for older browsers / iOS without clipboard API
      const ta = document.createElement('textarea');
      ta.value = code; document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); toast.success(`ຄັດລອກ ${code} ແລ້ວ`); } catch { toast.error('ຄັດລອກບໍ່ສຳເລັດ'); }
      document.body.removeChild(ta);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-bold lao">👨‍🎓 ນັກຮຽນ ({students.length})</h2>
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          <button onClick={() => setView('list')} className={`px-3 py-1.5 text-xs rounded-md lao font-semibold ${view === 'list' ? 'bg-white shadow text-blue-600' : 'text-gray-600'}`}>📋 ລາຍຊື່</button>
          <button onClick={() => setView('families')} className={`px-3 py-1.5 text-xs rounded-md lao font-semibold ${view === 'families' ? 'bg-white shadow text-blue-600' : 'text-gray-600'}`}>👨‍👩‍👧 ຄອບຄົວ</button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap gap-2 mb-3">
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="ຄົ້ນຫາ ຊື່/ID/ເບີໂທ..." className="flex-1 min-w-[160px] px-4 py-2.5 border rounded-xl lao text-sm" />
        <button onClick={openAdd} className="px-3 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold lao">+ ເພີ່ມ</button>
        <button onClick={() => setShowGroupModal(true)} className="px-3 py-2.5 bg-purple-600 text-white rounded-xl text-sm font-bold lao">👨‍👩‍👧 ຈັດກຸ່ມ</button>
        <button onClick={() => setShowExportModal(true)} className="px-3 py-2.5 bg-green-600 text-white rounded-xl text-sm font-bold lao">📥 ສົ່ງອອກ ID</button>
      </div>

      {/* List view */}
      {view === 'list' && (
        <div className="space-y-2">
          {filtered.map(s => (
            <div key={s.id} className="bg-white rounded-xl shadow-sm p-3 flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold shrink-0">
                {(s.nickname || s.firstName).charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold lao truncate">{s.firstName} {s.lastName} {s.nickname && `(${s.nickname})`}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <code className="text-xs font-mono bg-gray-100 px-1.5 py-0.5 rounded text-gray-700">{s.studentCode}</code>
                  <button onClick={() => copyId(s.studentCode)} className="text-xs text-blue-600 hover:underline lao">📋 ຄັດລອກ</button>
                  <span className="text-xs text-gray-400 lao truncate">{s.classroom?.className || '-'}</span>
                </div>
                {s.parentPhone && <p className="text-xs text-gray-500 mt-0.5">📱 {s.parentPhone}</p>}
              </div>
              <button onClick={() => openEdit(s)} className="text-blue-500 text-sm px-2 py-1.5 hover:bg-blue-50 rounded-lg lao">ແກ້</button>
              <button onClick={() => del(s.id)} className="text-red-500 text-sm px-2 py-1.5 hover:bg-red-50 rounded-lg lao">ລົບ</button>
            </div>
          ))}
          {filtered.length === 0 && <p className="text-center text-gray-400 lao py-8">— ບໍ່ພົບນັກຮຽນ —</p>}
        </div>
      )}

      {/* Families view */}
      {view === 'families' && (
        <FamiliesView families={families} copyId={copyId} onChanged={() => { fetchFamilies(); fetchStudents(); }} />
      )}

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
                { key: 'parentPhone', label: 'ເບີໂທຜູ້ປົກຄອງ (ໃຊ້ເປັນລະຫັດກຸ່ມຄອບຄົວ)' },
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

      {showGroupModal && (
        <GroupSiblingsModal
          allStudents={students}
          onClose={() => setShowGroupModal(false)}
          onSaved={() => { setShowGroupModal(false); fetchStudents(); fetchFamilies(); }}
        />
      )}

      {showExportModal && (
        <ExportIdsModal students={students} classrooms={classrooms} onClose={() => setShowExportModal(false)} />
      )}
    </div>
  );
}

/* ============================================================
   Families view — groups by parentPhone
   ============================================================ */
function FamiliesView({ families, copyId, onChanged }) {
  const [editingPhone, setEditingPhone] = useState(null);

  const unlink = async (studentId) => {
    if (!confirm('ເອົາອອກຈາກກຸ່ມຄອບຄົວ?')) return;
    try {
      await api.put(`/students/${studentId}`, { parentPhone: '' });
      toast.success('ເອົາອອກແລ້ວ');
      onChanged();
    } catch { toast.error('ຜິດພາດ'); }
  };

  if (families.length === 0) {
    return (
      <div className="bg-white rounded-xl p-6 text-center">
        <p className="text-gray-500 lao mb-2">ຍັງບໍ່ມີກຸ່ມຄອບຄົວ</p>
        <p className="text-xs text-gray-400 lao">ກົດ "👨‍👩‍👧 ຈັດກຸ່ມ" ເພື່ອເຊື່ອມໂຍງອ້າຍເອື້ອຍນ້ອງເຂົ້າກັນ</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {families.map(f => (
        <div key={f.parentPhone} className={`bg-white rounded-xl shadow-sm p-3 ${f.count > 1 ? 'border-2 border-purple-200' : ''}`}>
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="font-bold lao">
                {f.count > 1 ? '👨‍👩‍👧' : '👤'} {f.parentName || 'ຜູ້ປົກຄອງ'}
                <span className="ml-2 text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">{f.count} ຄົນ</span>
              </p>
              <p className="text-xs text-gray-500">📱 {f.parentPhone}</p>
            </div>
          </div>
          <div className="space-y-1 pl-2 border-l-2 border-gray-100">
            {f.students.map(s => (
              <div key={s.id} className="flex items-center gap-2 py-1.5">
                <div className="w-7 h-7 bg-blue-100 rounded-full flex items-center justify-center text-xs font-bold text-blue-700 shrink-0">
                  {(s.nickname || s.firstName).charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm lao truncate">{s.firstName} {s.lastName} {s.nickname && `(${s.nickname})`}</p>
                  <div className="flex items-center gap-1.5">
                    <code className="text-[10px] font-mono bg-gray-100 px-1 rounded text-gray-700">{s.studentCode}</code>
                    <button onClick={() => copyId(s.studentCode)} className="text-[10px] text-blue-600 lao">📋</button>
                    <span className="text-[10px] text-gray-400 lao">{s.classroom || '-'}</span>
                  </div>
                </div>
                <button onClick={() => unlink(s.id)} className="text-xs text-red-500 lao px-2">ເອົາອອກ</button>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ============================================================
   Group Siblings Modal — search + multi-select + assign phone
   ============================================================ */
function GroupSiblingsModal({ allStudents, onClose, onSaved }) {
  const [q, setQ] = useState('');
  const [selected, setSelected] = useState([]); // student ids
  const [phone, setPhone] = useState('');
  const [parentName, setParentName] = useState('');
  const [saving, setSaving] = useState(false);

  const matches = useMemo(() => {
    const term = q.trim();
    if (!term) return [];
    const upper = term.toUpperCase();
    return allStudents.filter(s =>
      s.firstName.includes(term) || s.lastName.includes(term) ||
      s.studentCode.includes(upper) || (s.nickname || '').includes(term) ||
      (s.parentPhone || '').includes(term)
    ).slice(0, 20);
  }, [q, allStudents]);

  const selectedStudents = useMemo(
    () => selected.map(id => allStudents.find(s => s.id === id)).filter(Boolean),
    [selected, allStudents]
  );

  const toggle = (s) => {
    setSelected(prev => prev.includes(s.id) ? prev.filter(x => x !== s.id) : [...prev, s.id]);
    // Auto-fill phone/name from first student selected (if empty)
    if (!selected.includes(s.id)) {
      if (!phone && s.parentPhone) setPhone(s.parentPhone);
      if (!parentName && s.parentName) setParentName(s.parentName);
    }
  };

  const save = async () => {
    if (selected.length < 1) { toast.error('ເລືອກນັກຮຽນ'); return; }
    if (!phone.trim()) { toast.error('ໃສ່ເບີໂທ'); return; }
    setSaving(true);
    try {
      const { data } = await api.post('/students/group-siblings', {
        studentIds: selected, parentPhone: phone, parentName,
      });
      toast.success(`ຈັດກຸ່ມ ${data.updated} ຄົນສຳເລັດ`);
      onSaved();
    } catch (err) {
      toast.error(err.response?.data?.error || 'ຜິດພາດ');
    } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[92vh] flex flex-col">
        <div className="p-5 border-b">
          <h3 className="text-lg font-bold lao">👨‍👩‍👧 ຈັດກຸ່ມອ້າຍເອື້ອຍນ້ອງ</h3>
          <p className="text-xs text-gray-500 lao mt-1">ຊອກຫາ ແລະ ເລືອກນັກຮຽນທີ່ເປັນອ້າຍເອື້ອຍນ້ອງ → ໃສ່ເບີໂທຜູ້ປົກຄອງດຽວກັນ</p>
        </div>

        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          {/* Selected chips */}
          {selectedStudents.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-500 mb-1.5 lao">ເລືອກແລ້ວ ({selectedStudents.length})</p>
              <div className="flex flex-wrap gap-1.5">
                {selectedStudents.map(s => (
                  <button key={s.id} onClick={() => toggle(s)}
                    className="px-2.5 py-1 bg-purple-100 text-purple-700 rounded-full text-xs lao flex items-center gap-1">
                    {s.firstName} <span className="font-mono">{s.studentCode}</span> ✕
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Search */}
          <div>
            <label className="text-xs font-semibold text-gray-700 lao">ຊອກຫານັກຮຽນ (ຊື່ ຫຼື ID)</label>
            <input autoFocus value={q} onChange={e => setQ(e.target.value)}
              placeholder="ພິມຊື່ ຫຼື STD-XXXX..."
              className="w-full mt-1 px-3 py-2.5 border rounded-xl text-sm" />
          </div>
          {q && (
            <div className="space-y-1 max-h-60 overflow-y-auto border rounded-xl">
              {matches.map(s => {
                const isSel = selected.includes(s.id);
                return (
                  <button key={s.id} onClick={() => toggle(s)}
                    className={`w-full text-left p-2.5 flex items-center gap-2 hover:bg-gray-50 ${isSel ? 'bg-purple-50' : ''}`}>
                    <input type="checkbox" checked={isSel} readOnly className="w-4 h-4 accent-purple-600" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm lao truncate">{s.firstName} {s.lastName} {s.nickname && `(${s.nickname})`}</p>
                      <p className="text-xs text-gray-500">
                        <code className="font-mono">{s.studentCode}</code> · {s.classroom?.className || '-'}
                        {s.parentPhone && <span className="ml-1">· 📱 {s.parentPhone}</span>}
                      </p>
                    </div>
                  </button>
                );
              })}
              {matches.length === 0 && <p className="text-center text-xs text-gray-400 py-4 lao">— ບໍ່ພົບ —</p>}
            </div>
          )}

          {/* Family info */}
          <div className="bg-purple-50 rounded-xl p-3 space-y-2">
            <p className="text-xs font-bold text-purple-800 lao">ຂໍ້ມູນຜູ້ປົກຄອງຮ່ວມກັນ</p>
            <div>
              <label className="text-xs text-gray-700 lao">ເບີໂທ (ຈຳເປັນ — ໃຊ້ເປັນລະຫັດກຸ່ມ)</label>
              <input value={phone} onChange={e => setPhone(e.target.value)}
                placeholder="020 XXXXXXXX"
                className="w-full mt-1 px-3 py-2 border rounded-lg text-sm" />
            </div>
            <div>
              <label className="text-xs text-gray-700 lao">ຊື່ຜູ້ປົກຄອງ (ບໍ່ບັງຄັບ)</label>
              <input value={parentName} onChange={e => setParentName(e.target.value)}
                className="w-full mt-1 px-3 py-2 border rounded-lg text-sm lao" />
            </div>
          </div>
        </div>

        <div className="p-4 border-t flex gap-2">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl bg-gray-100 lao">ຍົກເລີກ</button>
          <button onClick={save} disabled={saving || !selected.length || !phone.trim()}
            className="flex-1 py-2.5 rounded-xl bg-purple-600 text-white font-bold lao disabled:opacity-50">
            {saving ? 'ກຳລັງບັນທຶກ...' : `ບັນທຶກ (${selected.length})`}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   Export IDs Modal — CSV download + printable list
   ============================================================ */
function ExportIdsModal({ students, classrooms, onClose }) {
  const [search, setSearch] = useState('');
  const [classroomId, setClassroomId] = useState('all'); // 'all' | 'none' | <id> | 'each'
  const [groupByRoom, setGroupByRoom] = useState(true);

  // Filtered list (used by CSV/Copy/preview/Print when not 'each')
  const filtered = useMemo(() => students.filter(s => {
    if (classroomId === 'all') { /* no filter */ }
    else if (classroomId === 'none') { if (s.classroomId) return false; }
    else if (classroomId !== 'each') { if (String(s.classroomId) !== String(classroomId)) return false; }
    if (search) {
      const t = search; const u = t.toUpperCase();
      if (!(s.firstName.includes(t) || s.lastName.includes(t) || s.studentCode.includes(u) || (s.nickname || '').includes(t))) return false;
    }
    return true;
  }), [students, search, classroomId]);

  // Group filtered students by classroom for grouped views
  const grouped = useMemo(() => {
    const map = new Map();
    for (const s of filtered) {
      const key = s.classroom?.className || '— ບໍ່ມີຫ້ອງ —';
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(s);
    }
    return Array.from(map.entries())
      .map(([className, list]) => ({
        className,
        students: list.sort((a, b) => a.firstName.localeCompare(b.firstName))
      }))
      .sort((a, b) => a.className.localeCompare(b.className));
  }, [filtered]);

  const selectedClassName = useMemo(() => {
    if (classroomId === 'all') return 'ທຸກຫ້ອງ';
    if (classroomId === 'none') return 'ບໍ່ມີຫ້ອງ';
    if (classroomId === 'each') return 'ແຍກທຸກຫ້ອງ';
    const c = classrooms.find(x => String(x.id) === String(classroomId));
    return c?.className || 'ຫ້ອງ';
  }, [classroomId, classrooms]);

  const dateStr = new Date().toISOString().slice(0, 10);
  const safeName = (s) => s.replace(/[\\/:*?"<>|]/g, '').replace(/\s+/g, '_');

  const buildCsv = (list) => {
    const header = ['StudentCode', 'FirstName', 'LastName', 'Nickname', 'Classroom', 'ParentName', 'ParentPhone'];
    const rows = list.map(s => [
      s.studentCode, s.firstName, s.lastName, s.nickname || '',
      s.classroom?.className || '', s.parentName || '', s.parentPhone || '',
    ]);
    return [header, ...rows]
      .map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))
      .join('\n');
  };
  const downloadBlob = (csv, name) => {
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = name;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const downloadCsv = () => {
    if (classroomId === 'each') {
      // One CSV per classroom — sequential downloads
      let n = 0;
      grouped.forEach((g, i) => {
        setTimeout(() => {
          downloadBlob(buildCsv(g.students), `students-${safeName(g.className)}-${dateStr}.csv`);
        }, i * 250);
        n += g.students.length;
      });
      toast.success(`ດາວໂຫລດ ${grouped.length} ໄຟລ໌ (${n} ຄົນ)`);
      return;
    }
    downloadBlob(buildCsv(filtered), `students-${safeName(selectedClassName)}-${dateStr}.csv`);
    toast.success(`ດາວໂຫລດ CSV ${filtered.length} ຄົນ`);
  };

  const buildPrintHtml = (groups) => {
    const sections = groups.map(g => {
      const rows = g.students.map(s => `
        <tr>
          <td><code>${s.studentCode}</code></td>
          <td>${s.firstName} ${s.lastName}${s.nickname ? ` (${s.nickname})` : ''}</td>
          <td>${s.parentName || '-'}</td>
          <td>${s.parentPhone || '-'}</td>
        </tr>`).join('');
      return `
        <section>
          <h2>${g.className} <span class="cnt">(${g.students.length} ຄົນ)</span></h2>
          <table>
            <thead><tr><th style="width:110px">ລະຫັດ</th><th>ຊື່ ນາມສະກຸນ</th><th>ຜູ້ປົກຄອງ</th><th style="width:140px">ເບີໂທ</th></tr></thead>
            <tbody>${rows}</tbody>
          </table>
        </section>`;
    }).join('');
    return `
      <!doctype html><html lang="lo"><head><meta charset="utf-8">
      <title>ລາຍຊື່ນັກຮຽນ — ${selectedClassName}</title>
      <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Lao:wght@400;700&display=swap" rel="stylesheet">
      <style>
        body { font-family: 'Noto Sans Lao', sans-serif; padding: 24px; color:#111; }
        h1 { font-size: 18px; margin: 0 0 4px; }
        h2 { font-size: 15px; margin: 18px 0 6px; padding-bottom:4px; border-bottom: 2px solid #1E40AF; color:#1E40AF; }
        .cnt { color:#6b7280; font-size:12px; font-weight:400; }
        .meta { color: #666; font-size: 12px; margin-bottom: 16px; }
        table { width: 100%; border-collapse: collapse; font-size: 13px; }
        th, td { border: 1px solid #ddd; padding: 6px 10px; text-align: left; }
        th { background: #f3f4f6; }
        code { font-family: ui-monospace, SFMono-Regular, monospace; font-size: 12px; background: #eff6ff; color:#1d4ed8; padding: 1px 5px; border-radius: 3px; font-weight:700; }
        tr:nth-child(even) td { background: #fafafa; }
        section { page-break-inside: avoid; }
        section + section { page-break-before: always; }
        @media print { .noprint { display: none; } body { padding: 12px; } }
      </style></head><body>
      <div class="noprint" style="margin-bottom:12px"><button onclick="window.print()" style="padding:8px 16px;font-size:14px;cursor:pointer;">🖨️ Print</button></div>
      <h1>ລາຍຊື່ນັກຮຽນ — ໂຮງຮຽນ ເພັດດາຣາ</h1>
      <p class="meta">${selectedClassName} · ທັງໝົດ ${groups.reduce((a,g)=>a+g.students.length,0)} ຄົນ · ${new Date().toLocaleString('lo-LA')}</p>
      ${sections}
      </body></html>`;
  };

  const printList = () => {
    const w = window.open('', '_blank');
    if (!w) { toast.error('ກະລຸນາອະນຸຍາດ pop-up'); return; }
    // For 'each' OR groupByRoom → multiple sections; else single section
    const groups = (classroomId === 'each' || groupByRoom) ? grouped : [{ className: selectedClassName, students: filtered }];
    w.document.write(buildPrintHtml(groups));
    w.document.close();
    setTimeout(() => w.print(), 500);
  };

  const copyAll = async () => {
    let text;
    if (classroomId === 'each' || groupByRoom) {
      text = grouped.map(g =>
        `=== ${g.className} (${g.students.length}) ===\n` +
        g.students.map(s => `${s.studentCode}\t${s.firstName} ${s.lastName}${s.nickname ? ` (${s.nickname})` : ''}`).join('\n')
      ).join('\n\n');
    } else {
      text = filtered.map(s => `${s.studentCode}\t${s.firstName} ${s.lastName}${s.nickname ? ` (${s.nickname})` : ''}\t${s.classroom?.className || '-'}`).join('\n');
    }
    try { await navigator.clipboard.writeText(text); toast.success(`ຄັດລອກ ${filtered.length} ລາຍການ`); }
    catch { toast.error('ຄັດລອກບໍ່ສຳເລັດ'); }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[92vh] flex flex-col">
        <div className="p-5 border-b flex items-center justify-between">
          <h3 className="text-lg font-bold lao">📥 ສົ່ງອອກລະຫັດນັກຮຽນ</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
        </div>

        <div className="p-5 space-y-3 flex-1 overflow-y-auto">
          {/* Classroom filter */}
          <div>
            <label className="text-xs font-semibold text-gray-700 lao">ເລືອກຫ້ອງຮຽນ</label>
            <select value={classroomId} onChange={e => setClassroomId(e.target.value)}
              className="w-full mt-1 px-3 py-2.5 border rounded-xl text-sm lao bg-white">
              <option value="all">📚 ທຸກຫ້ອງ ({students.length})</option>
              <option value="each">📦 ແຍກທຸກຫ້ອງ (1 ໄຟລ໌/ຫ້ອງ)</option>
              <option value="none">— ນັກຮຽນທີ່ບໍ່ມີຫ້ອງ —</option>
              {classrooms.map(c => (
                <option key={c.id} value={c.id}>
                  🏫 {c.className} ({students.filter(s => String(s.classroomId) === String(c.id)).length})
                </option>
              ))}
            </select>
            {classroomId === 'each' && (
              <p className="text-[11px] text-amber-700 lao mt-1">⚠ CSV: ດາວໂຫລດ {grouped.length} ໄຟລ໌ (1 ໄຟລ໌/ຫ້ອງ) · Print/Copy: ລວມໝົດໃນເອກະສານດຽວ ແຍກຫົວຂໍ້ຫ້ອງ</p>
            )}
          </div>

          {/* Search */}
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="ຊອກຫາ..." className="w-full px-3 py-2.5 border rounded-xl text-sm lao" />

          {/* Group toggle (when not in 'each' mode) */}
          {classroomId !== 'each' && classroomId !== 'none' && (
            <label className="flex items-center gap-2 text-xs lao text-gray-700 cursor-pointer select-none">
              <input type="checkbox" checked={groupByRoom} onChange={e => setGroupByRoom(e.target.checked)} className="w-4 h-4 accent-blue-600" />
              ແຍກຫົວຂໍ້ຫ້ອງໃນ Print/Copy (CSV ສົ່ງອອກລວມ)
            </label>
          )}

          {/* Action buttons */}
          <div className="grid grid-cols-3 gap-2">
            <button onClick={downloadCsv} className="py-3 rounded-xl bg-green-600 text-white text-sm font-bold lao">📊 CSV</button>
            <button onClick={printList} className="py-3 rounded-xl bg-blue-600 text-white text-sm font-bold lao">🖨️ Print</button>
            <button onClick={copyAll} className="py-3 rounded-xl bg-gray-700 text-white text-sm font-bold lao">📋 Copy</button>
          </div>
          <p className="text-xs text-gray-500 lao text-center">
            {selectedClassName} · {filtered.length} ຄົນ
            {(classroomId === 'each' || groupByRoom) && grouped.length > 1 && ` · ${grouped.length} ຫ້ອງ`}
          </p>

          {/* Preview — grouped or flat */}
          <div className="border rounded-xl max-h-[40vh] overflow-y-auto">
            {(classroomId === 'each' || groupByRoom) && grouped.length > 1 ? (
              grouped.map(g => (
                <div key={g.className}>
                  <div className="bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-800 lao sticky top-0">
                    🏫 {g.className} <span className="text-blue-500 font-normal">({g.students.length})</span>
                  </div>
                  <div className="divide-y">
                    {g.students.map(s => (
                      <div key={s.id} className="p-2.5 flex items-center gap-2">
                        <code className="text-xs font-mono bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-bold">{s.studentCode}</code>
                        <span className="flex-1 text-sm lao truncate">{s.firstName} {s.lastName} {s.nickname && `(${s.nickname})`}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <div className="divide-y">
                {filtered.map(s => (
                  <div key={s.id} className="p-2.5 flex items-center gap-2">
                    <code className="text-xs font-mono bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-bold">{s.studentCode}</code>
                    <span className="flex-1 text-sm lao truncate">{s.firstName} {s.lastName} {s.nickname && `(${s.nickname})`}</span>
                    <span className="text-xs text-gray-400 lao">{s.classroom?.className || '-'}</span>
                  </div>
                ))}
                {filtered.length === 0 && <p className="text-center text-xs text-gray-400 py-6 lao">— ບໍ່ພົບ —</p>}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
