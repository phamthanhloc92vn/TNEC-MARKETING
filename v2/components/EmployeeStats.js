'use client';

import { useState } from 'react';
import { exportEmployeeTasksToExcel } from '../lib/exportExcel';

export default function EmployeeStats({ tasks, users, isManager }) {
  const [expanded, setExpanded] = useState(true);
  const [exportModalState, setExportModalState] = useState({
    isOpen: false,
    employee: null,
    startDate: '',
    endDate: '',
  });

  const handlePresetDate = (type) => {
    const end = new Date();
    const start = new Date();

    if (type === 'this_month') {
      start.setDate(1); // Mùng 1 tháng hiện tại
    } else if (type === '1_month') {
      start.setMonth(start.getMonth() - 1);
    } else if (type === '2_months') {
      start.setMonth(start.getMonth() - 2);
    } else if (type === '3_months') {
      start.setMonth(start.getMonth() - 3);
    }

    const pad = n => n.toString().padStart(2, '0');
    const formatDate = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

    setExportModalState(prev => ({
      ...prev,
      startDate: formatDate(start),
      endDate: formatDate(end)
    }));
  };

  const handleExportSubmit = () => {
    const { employee, startDate, endDate } = exportModalState;
    if (!employee) return;

    let empTasks = tasks.filter(t => t.assignee?.toLowerCase() === employee.email.toLowerCase());

    if (startDate || endDate) {
      const sDate = startDate ? new Date(startDate) : null;
      if (sDate) sDate.setHours(0, 0, 0, 0);

      const eDate = endDate ? new Date(endDate) : null;
      if (eDate) eDate.setHours(23, 59, 59, 999);

      empTasks = empTasks.filter(t => {
        let taskStart = t.startDate ? new Date(t.startDate) : null;
        let taskEnd = t.deadline ? new Date(t.deadline) : null;

        // Bỏ qua task nếu không có bất kỳ ngày nào
        if (!taskStart && !taskEnd) return false;

        if (!taskEnd) taskEnd = taskStart;
        if (!taskStart) taskStart = taskEnd;

        if (sDate && taskEnd < sDate) return false;
        if (eDate && taskStart > eDate) return false;

        return true;
      });
    }

    if (empTasks.length > 0) {
      // Sắp xếp các task theo Ngày bắt đầu (startDate) tăng dần
      empTasks.sort((a, b) => {
        const dateA = a.startDate ? new Date(a.startDate).getTime() : Number.MAX_SAFE_INTEGER;
        const dateB = b.startDate ? new Date(b.startDate).getTime() : Number.MAX_SAFE_INTEGER;
        
        // Nếu cùng ngày bắt đầu, ưu tiên xếp theo Hạn chót (Deadline)
        if (dateA === dateB) {
           const deadlineA = a.deadline ? new Date(a.deadline).getTime() : Number.MAX_SAFE_INTEGER;
           const deadlineB = b.deadline ? new Date(b.deadline).getTime() : Number.MAX_SAFE_INTEGER;
           return deadlineA - deadlineB;
        }

        return dateA - dateB;
      });

      exportEmployeeTasksToExcel(employee.name, employee.role, empTasks, users);
      setExportModalState({ isOpen: false, employee: null, startDate: '', endDate: '' });
    } else {
      alert('Không có công việc nào trong khoảng thời gian này để xuất!');
    }
  };

  const employees = users.filter(u => u.role?.toLowerCase() !== 'trưởng phòng');

  const getEmployeeStats = (email) => {
    const empTasks = tasks.filter(t => t.assignee?.toLowerCase() === email.toLowerCase());
    const total = empTasks.length;
    const completed = empTasks.filter(t => t.status === 'Hoàn thành').length;
    const avgProgress = total > 0 ? Math.round(empTasks.reduce((s, t) => s + (parseInt(t.progress) || 0), 0) / total) : 0;
    const statusCounts = {};
    empTasks.forEach(t => { statusCounts[t.status] = (statusCounts[t.status] || 0) + 1; });
    return { total, completed, avgProgress, completionRate: total > 0 ? Math.round((completed / total) * 100) : 0, statusCounts };
  };

  const statusColors = {
    'Kế hoạch': 'bg-indigo-100 text-indigo-700',
    'Đang xử lý': 'bg-amber-100 text-amber-700',
    'Chờ duyệt': 'bg-cyan-100 text-cyan-700',
    'Cần chỉnh sửa': 'bg-red-100 text-red-700',
    'Hoàn thành': 'bg-emerald-100 text-emerald-700',
  };

  const roleColors = {
    'designer': 'from-cyan-500 to-blue-500',
    'media': 'from-amber-500 to-orange-500',
    'digital': 'from-pink-500 to-rose-500',
    'vide code': 'from-green-500 to-emerald-500',
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 mb-6 overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-lg">👥</span>
          <span className="font-semibold text-gray-900">{isManager ? 'Thống kê theo nhân viên' : 'Thống kê cá nhân / Báo cáo'}</span>
        </div>
        <span className="text-sm text-indigo-500 font-medium">
          {expanded ? 'Thu gọn ▲' : 'Mở rộng ▼'}
        </span>
      </button>

      {expanded && (
        <div className="px-6 pb-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {employees.map(emp => {
            const stats = getEmployeeStats(emp.email);
            const gradientClass = roleColors[emp.role.toLowerCase()] || 'from-gray-500 to-gray-600';

            return (
              <div key={emp.id} className="border border-gray-100 rounded-xl p-5 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${gradientClass} flex items-center justify-center text-white text-sm font-bold shadow-md`}>
                    {emp.name[0]}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{emp.name}</p>
                    <p className="text-xs text-gray-500 uppercase tracking-wider">{emp.role}</p>
                  </div>
                  <div className="ml-auto flex items-center gap-3">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        // Mở Export Modal thay vì tải ngay
                        setExportModalState({
                          isOpen: true,
                          employee: emp,
                          startDate: '',
                          endDate: ''
                        });
                      }}
                      className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors group relative"
                      title="Xuất báo cáo Excel"
                    >
                      <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      {/* Tooltip */}
                      <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                        Xuất Excel
                      </span>
                    </button>
                    <span className="text-2xl font-bold text-gray-300">{stats.total}</span>
                  </div>
                </div>

                {/* Status badges */}
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {Object.entries(stats.statusCounts).map(([status, count]) => (
                    <span key={status} className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[status] || 'bg-gray-100 text-gray-600'}`}>
                      {status}: {count}
                    </span>
                  ))}
                  {stats.total === 0 && <span className="text-xs text-gray-400">Chưa có task</span>}
                </div>

                {/* Progress bar */}
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full bg-gradient-to-r ${gradientClass} transition-all duration-500`}
                      style={{ width: `${stats.completionRate}%` }}
                    />
                  </div>
                  <span className="text-xs font-semibold text-gray-500">{stats.completionRate}%</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* EXPORT MODAL */}
      {exportModalState.isOpen && exportModalState.employee && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Tải báo cáo Excel</h3>
                <p className="text-sm text-gray-500">Cho: {exportModalState.employee.name}</p>
              </div>
              <button 
                onClick={() => setExportModalState({ isOpen: false, employee: null, startDate: '', endDate: '' })}
                className="text-gray-400 hover:text-red-500 transition-colors bg-white hover:bg-red-50 rounded-full p-1.5 shadow-sm"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6">
              {/* Presets */}
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-2">Chọn nhanh</p>
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => handlePresetDate('this_month')} className="px-3 py-2 text-xs font-medium bg-gray-50 hover:bg-indigo-50 text-gray-700 hover:text-indigo-600 rounded-lg border border-gray-100 transition-colors">Tháng này</button>
                  <button onClick={() => handlePresetDate('1_month')} className="px-3 py-2 text-xs font-medium bg-gray-50 hover:bg-indigo-50 text-gray-700 hover:text-indigo-600 rounded-lg border border-gray-100 transition-colors">1 Tháng gần nhất</button>
                  <button onClick={() => handlePresetDate('2_months')} className="px-3 py-2 text-xs font-medium bg-gray-50 hover:bg-indigo-50 text-gray-700 hover:text-indigo-600 rounded-lg border border-gray-100 transition-colors">2 Tháng gần nhất</button>
                  <button onClick={() => handlePresetDate('3_months')} className="px-3 py-2 text-xs font-medium bg-gray-50 hover:bg-indigo-50 text-gray-700 hover:text-indigo-600 rounded-lg border border-gray-100 transition-colors">3 Tháng gần nhất</button>
                </div>
              </div>

              {/* Custom Date Range */}
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-2">Hoặc chọn tùy chỉnh</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Từ ngày</label>
                    <input 
                      type="date" 
                      value={exportModalState.startDate} 
                      onChange={(e) => setExportModalState(prev => ({ ...prev, startDate: e.target.value }))}
                      className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Đến ngày</label>
                    <input 
                      type="date" 
                      value={exportModalState.endDate} 
                      onChange={(e) => setExportModalState(prev => ({ ...prev, endDate: e.target.value }))}
                      className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
              <button 
                onClick={() => setExportModalState({ isOpen: false, employee: null, startDate: '', endDate: '' })}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 rounded-lg transition-colors border border-gray-200 bg-white shadow-sm"
              >
                Hủy
              </button>
              <button 
                onClick={handleExportSubmit}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow-md hover:shadow-lg transition-all flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Xuất Excel
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
