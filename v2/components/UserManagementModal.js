'use client';

import { useState } from 'react';

export default function UserManagementModal({ users, onUpdate, onClose }) {
  const [newUser, setNewUser] = useState({ name: '', email: '', role: 'Designer' });
  const [loading, setLoading] = useState(false);

  const handleAddUser = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create', ...newUser }),
      });
      if (res.ok) {
        onUpdate();
        setNewUser({ name: '', email: '', role: 'Designer' });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (email) => {
    if (!confirm(`Xác nhận xóa nhân viên ${email}?`)) return;
    setLoading(true);
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', email }),
      });
      if (res.ok) onUpdate();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Quản lý nhân sự</h2>
            <p className="text-xs text-gray-500 mt-0.5">Thêm hoặc xóa quyền truy cập của nhân viên</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white rounded-xl transition-colors text-gray-400 hover:text-gray-600">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>

        <div className="p-6 max-h-[70vh] overflow-y-auto">
          {/* Add Form */}
          <form onSubmit={handleAddUser} className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-8 p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100">
            <div className="md:col-span-1">
              <label className="block text-[10px] font-bold text-indigo-600 uppercase mb-1 ml-1">Họ tên</label>
              <input
                required
                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                value={newUser.name}
                onChange={e => setNewUser({ ...newUser, name: e.target.value })}
                placeholder="VD: Nguyen Van A"
              />
            </div>
            <div className="md:col-span-1">
              <label className="block text-[10px] font-bold text-indigo-600 uppercase mb-1 ml-1">Email</label>
              <input
                required
                type="email"
                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                value={newUser.email}
                onChange={e => setNewUser({ ...newUser, email: e.target.value })}
                placeholder="email@gmail.com"
              />
            </div>
            <div className="md:col-span-1">
              <label className="block text-[10px] font-bold text-indigo-600 uppercase mb-1 ml-1">Chức vụ</label>
              <select
                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                value={newUser.role}
                onChange={e => setNewUser({ ...newUser, role: e.target.value })}
              >
                <option>Designer</option>
                <option>Media</option>
                <option>Digital</option>
                <option>Video Code</option>
                <option>Trưởng phòng</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                disabled={loading}
                type="submit"
                className="w-full gradient-primary text-white text-xs font-bold py-2.5 rounded-xl shadow-lg shadow-indigo-200 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
              >
                {loading ? 'Đang thêm...' : 'Thêm mới'}
              </button>
            </div>
          </form>

          {/* User List */}
          <div className="space-y-2">
            <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-3 px-1">Danh sách nhân viên ({users.length})</h3>
            {users.map(user => (
              <div key={user.email} className="flex items-center justify-between p-3 border border-gray-50 rounded-2xl hover:bg-gray-50 transition-colors group">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-gray-500 text-xs font-bold">
                    {(user.name || '?')[0]}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{user.name}</p>
                    <p className="text-[11px] text-gray-500">{user.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-[10px] font-bold px-2 py-1 bg-gray-100 text-gray-600 rounded-full">{user.role}</span>
                  <button
                    onClick={() => handleDeleteUser(user.email)}
                    disabled={loading}
                    className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                    title="Xóa nhân viên"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"></path></svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
