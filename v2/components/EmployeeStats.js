'use client';

import { useState } from 'react';
import { exportEmployeeTasksToExcel } from '../lib/exportExcel';

export default function EmployeeStats({ tasks, users, isManager }) {
  const [expanded, setExpanded] = useState(true);

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
                        const empTasks = tasks.filter(t => t.assignee?.toLowerCase() === emp.email.toLowerCase());
                        if (empTasks.length > 0) {
                          exportEmployeeTasksToExcel(emp.name, emp.role, empTasks, users);
                        } else {
                          alert('Nhân viên này chưa có công việc nào để xuất!');
                        }
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
    </div>
  );
}
