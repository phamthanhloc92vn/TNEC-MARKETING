'use client';

import { useState } from 'react';

export default function TaskDetailModal({ task, users, isManager, onUpdate, onDelete, onClose }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ ...task });

  const handleSave = async () => {
    await onUpdate(form);
    setEditing(false);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  const priorityBadge = {
    'Cao': 'bg-red-100 text-red-700',
    'Trung bình': 'bg-amber-100 text-amber-700',
    'Thấp': 'bg-green-100 text-green-700',
  };

  const statusBadge = {
    'Kế hoạch': 'bg-indigo-100 text-indigo-700',
    'Đang xử lý': 'bg-amber-100 text-amber-700',
    'Chờ duyệt': 'bg-cyan-100 text-cyan-700',
    'Cần chỉnh sửa': 'bg-red-100 text-red-700',
    'Hoàn thành': 'bg-emerald-100 text-emerald-700',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center modal-overlay" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div
        className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-auto animate-slide-up"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-8 py-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900 flex-1 mr-4">
              {editing ? (
                <input
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-indigo-500 outline-none text-lg"
                />
              ) : task.name}
            </h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
          <div className="flex gap-2 mt-3">
            <span className={`text-xs px-3 py-1 rounded-full font-medium ${statusBadge[task.status] || 'bg-gray-100 text-gray-600'}`}>
              {task.status}
            </span>
            <span className={`text-xs px-3 py-1 rounded-full font-medium ${priorityBadge[task.priority] || 'bg-gray-100 text-gray-600'}`}>
              {task.priority}
            </span>
          </div>
        </div>

        {/* Body */}
        <div className="px-8 py-6 space-y-5">
          {editing ? (
            <>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Mô tả</label>
                <textarea
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 outline-none text-sm resize-none"
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Trạng thái</label>
                  <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none text-sm bg-white">
                    {['Kế hoạch', 'Đang xử lý', 'Chờ duyệt', 'Cần chỉnh sửa', 'Hoàn thành'].map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Ưu tiên</label>
                  <select value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none text-sm bg-white">
                    {['Thấp', 'Trung bình', 'Cao'].map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Tiến độ: {form.progress}%</label>
                <input type="range" min="0" max="100" value={form.progress} onChange={e => setForm({ ...form, progress: parseInt(e.target.value) })} className="w-full accent-indigo-500" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Deadline</label>
                  <input type="date" value={form.deadline} onChange={e => setForm({ ...form, deadline: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Ghi chú</label>
                  <input type="text" value={form.notes || ''} onChange={e => setForm({ ...form, notes: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none text-sm" />
                </div>
              </div>
            </>
          ) : (
            <>
              {task.description && (
                <div>
                  <p className="text-sm font-semibold text-gray-500 mb-1">Mô tả</p>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{task.description}</p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="text-gray-500">Người giao:</span> <span className="font-medium ml-1">{task.assignedBy || '—'}</span></div>
                <div><span className="text-gray-500">Người nhận:</span> <span className="font-medium ml-1">{task.assignee || '—'}</span></div>
                <div><span className="text-gray-500">Bắt đầu:</span> <span className="font-medium ml-1">{formatDate(task.startDate)}</span></div>
                <div><span className="text-gray-500">Deadline:</span> <span className="font-medium ml-1">{formatDate(task.deadline)}</span></div>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Tiến độ</p>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-cyan-500 transition-all" style={{ width: `${task.progress}%` }} />
                  </div>
                  <span className="text-sm font-bold text-gray-600">{task.progress}%</span>
                </div>
              </div>
              {task.notes && (
                <div><p className="text-sm font-semibold text-gray-500 mb-1">Ghi chú</p><p className="text-sm text-gray-700">{task.notes}</p></div>
              )}
            </>
          )}
        </div>

        {/* Actions */}
        <div className="px-8 py-4 border-t border-gray-100 flex gap-3">
          {editing ? (
            <>
              <button onClick={() => setEditing(false)} className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 font-semibold text-sm hover:bg-gray-50">Hủy</button>
              <button onClick={handleSave} className="flex-1 py-3 rounded-xl gradient-primary text-white font-semibold text-sm hover:shadow-lg hover:shadow-indigo-500/30">Lưu</button>
            </>
          ) : (
            <>
              {isManager && (
                <button onClick={() => onDelete(task.taskId)} className="py-3 px-5 rounded-xl border border-red-200 text-red-500 font-semibold text-sm hover:bg-red-50">Xóa</button>
              )}
              <div className="flex-1" />
              <button onClick={() => setEditing(true)} className="py-3 px-8 rounded-xl gradient-primary text-white font-semibold text-sm hover:shadow-lg hover:shadow-indigo-500/30">Chỉnh sửa</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
