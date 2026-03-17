'use client';

import { useState } from 'react';

export default function CreateTaskModal({ users, isManager, currentUserEmail, onSubmit, onClose }) {
  const [form, setForm] = useState({
    name: '',
    description: '',
    assignee: isManager ? '' : currentUserEmail,
    status: 'Kế hoạch',
    startDate: new Date().toISOString().split('T')[0],
    deadline: '',
    progress: 0,
    priority: 'Trung bình',
    attachmentLink: '',
    notes: '',
  });
  const [saving, setSaving] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    await onSubmit(form);
    setSaving(false);
  };

  const getAISuggestion = async () => {
    if (!form.name.trim()) return;
    setAiLoading(true);
    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: `Mô tả chi tiết cho công việc: ${form.name}` }),
      });
      const data = await res.json();
      if (data.success && data.rawText) {
        setForm(prev => ({ ...prev, description: data.rawText }));
      }
    } catch (e) {
      console.error('AI error:', e);
    }
    setAiLoading(false);
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
            <h2 className="text-xl font-bold text-gray-900">Tạo công việc mới</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-8 py-6 space-y-5">
          {/* Task name */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Tên công việc <span className="text-red-500">*</span></label>
            <input
              type="text"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all text-sm"
              placeholder="Nhập tên công việc..."
              required
            />
          </div>

          {/* Description */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-sm font-semibold text-gray-700">Mô tả</label>
              <button
                type="button"
                onClick={getAISuggestion}
                disabled={aiLoading}
                className="text-xs px-3 py-1 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 font-medium transition-colors disabled:opacity-50"
              >
                {aiLoading ? '⏳ Đang phân tích...' : '✨ Gợi ý bằng AI'}
              </button>
            </div>
            <textarea
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all text-sm resize-none"
              rows={3}
              placeholder="Mô tả chi tiết công việc..."
            />
          </div>

          {/* Assignee & Status */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Người nhận <span className="text-red-500">*</span></label>
              <select
                value={form.assignee}
                onChange={e => setForm({ ...form, assignee: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all text-sm bg-white"
                required
              >
                <option value="">Chọn...</option>
                {isManager && users.map(u => (
                  <option key={u.id} value={u.email}>{u.name} ({u.role})</option>
                ))}
                {!isManager && <option value={currentUserEmail}>{currentUserEmail}</option>}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Trạng thái</label>
              <select
                value={form.status}
                onChange={e => setForm({ ...form, status: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all text-sm bg-white"
              >
                {['Kế hoạch', 'Đang xử lý', 'Chờ duyệt', 'Cần chỉnh sửa', 'Hoàn thành'].map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Ngày bắt đầu</label>
              <input
                type="date"
                value={form.startDate}
                onChange={e => setForm({ ...form, startDate: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Deadline</label>
              <input
                type="date"
                value={form.deadline}
                onChange={e => setForm({ ...form, deadline: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all text-sm"
              />
            </div>
          </div>

          {/* Priority */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Ưu tiên</label>
            <div className="flex gap-3">
              {[
                { value: 'Thấp', label: 'Thấp', color: 'border-green-300 bg-green-50 text-green-700' },
                { value: 'Trung bình', label: 'Trung bình', color: 'border-amber-300 bg-amber-50 text-amber-700' },
                { value: 'Cao', label: 'Cao', color: 'border-red-300 bg-red-50 text-red-700' },
              ].map(p => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => setForm({ ...form, priority: p.value })}
                  className={`flex-1 py-2.5 rounded-xl border-2 text-sm font-semibold transition-all ${
                    form.priority === p.value ? p.color + ' shadow-md' : 'border-gray-200 bg-white text-gray-400 hover:border-gray-300'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Notes & Link */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Link sản phẩm đính kèm</label>
              <input
                type="url"
                value={form.attachmentLink}
                onChange={e => setForm({ ...form, attachmentLink: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all text-sm"
                placeholder="https://..."
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Ghi chú</label>
              <input
                type="text"
                value={form.notes}
                onChange={e => setForm({ ...form, notes: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all text-sm"
                placeholder="Ghi chú thêm..."
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 font-semibold hover:bg-gray-50 transition-colors text-sm"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={saving || !form.name.trim()}
              className="flex-1 py-3 rounded-xl gradient-primary text-white font-semibold hover:shadow-lg hover:shadow-indigo-500/30 transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? '⏳ Đang lưu...' : 'Tạo Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
