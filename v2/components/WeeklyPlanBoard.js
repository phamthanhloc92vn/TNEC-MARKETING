'use client';

import { useState } from 'react';
import TaskCard from './TaskCard';

// Avatar color palette
const AVATAR_COLORS = [
  'from-indigo-400 to-violet-500',
  'from-rose-400 to-pink-500',
  'from-amber-400 to-orange-500',
  'from-teal-400 to-cyan-500',
  'from-green-400 to-emerald-500',
  'from-sky-400 to-blue-500',
];

function assigneeColor(name) {
  let hash = 0;
  for (let i = 0; i < (name || '').length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

const parseDateFromViFormat = (dateStr) => {
  if (!dateStr) return null;
  try {
    if (typeof dateStr === 'string' && dateStr.includes('/')) {
      const parts = dateStr.split(' ')[0].split('/');
      if (parts.length === 3) {
         return new Date(`${parts[2]}-${parts[1]}-${parts[0]}T00:00:00`);
      }
    }
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? null : d;
  } catch {
    return null;
  }
};

const getStartOfWeek = (date) => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
};

const BUCKETS = [
  { id: 'unscheduled', label: 'Chưa lịch', bg: 'bg-gray-50', text: 'text-gray-600' },
  { id: 'overdue', label: 'Tồn đọng', bg: 'bg-red-50', text: 'text-red-600' },
  { id: 't2', label: 'Thứ 2', bg: 'bg-white', text: 'text-indigo-600' },
  { id: 't3', label: 'Thứ 3', bg: 'bg-white', text: 'text-indigo-600' },
  { id: 't4', label: 'Thứ 4', bg: 'bg-white', text: 'text-indigo-600' },
  { id: 't5', label: 'Thứ 5', bg: 'bg-white', text: 'text-indigo-600' },
  { id: 't6', label: 'Thứ 6', bg: 'bg-white', text: 'text-indigo-600' },
  { id: 't7', label: 'Thứ 7', bg: 'bg-white', text: 'text-amber-600' },
  { id: 'cn', label: 'Chủ Nhật', bg: 'bg-white', text: 'text-rose-600' },
  { id: 'future', label: 'Tương lai', bg: 'bg-indigo-50', text: 'text-indigo-600' },
];

export default function WeeklyPlanBoard({ tasks, onTaskClick }) {
  const [collapsed, setCollapsed] = useState({});
  const startOfWeek = getStartOfWeek(new Date());
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);

  // Filter out completely finished tasks
  const activeTasks = tasks.filter(t => t.status !== 'Hoàn thành');

  // Bucket logic
  const getBucket = (task) => {
    const d = parseDateFromViFormat(task.deadline);
    if (!d) return 'unscheduled';
    if (d < startOfWeek) return 'overdue';
    if (d > endOfWeek) return 'future';
    
    // Day of week: 0(Sun) -> 6(Sat) => map to t2-cn
    const day = d.getDay();
    if (day === 0) return 'cn';
    return `t${day + 1}`;
  };

  // Group by assignee
  const grouped = activeTasks.reduce((acc, task) => {
    const assignee = task.assignee || 'Chưa phân công';
    if (!acc[assignee]) acc[assignee] = { unscheduled:[], overdue:[], t2:[], t3:[], t4:[], t5:[], t6:[], t7:[], cn:[], future:[] };
    const bucket = getBucket(task);
    acc[assignee][bucket].push(task);
    return acc;
  }, {});

  const toggleGroup = (key) => setCollapsed(prev => ({ ...prev, [key]: !prev[key] }));

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
      {/* Header Row */}
      <div className="flex border-b border-gray-200 bg-gray-50/80 sticky top-0 z-10">
        <div className="w-[180px] shrink-0 p-3 border-r border-gray-200 font-semibold text-xs text-gray-500 uppercase flex items-center">
          Nhân sự
        </div>
        <div className="flex flex-1 min-w-[1000px]">
          {BUCKETS.map(b => (
            <div key={b.id} className={`flex-1 min-w-[120px] p-3 text-center border-r border-gray-200 last:border-0 ${b.bg}`}>
              <span className={`text-xs font-bold uppercase tracking-wide ${b.text}`}>{b.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Body Rows */}
      <div className="divide-y divide-gray-100 max-h-[70vh] overflow-y-auto">
        {Object.entries(grouped).map(([assignee, buckets]) => {
          const isCollapsed = collapsed[assignee];
          const grad = assigneeColor(assignee);
          
          return (
            <div key={assignee} className="flex group hover:bg-gray-50/50 transition-colors">
              {/* Row Header (Assignee) */}
              <div 
                className="w-[180px] shrink-0 p-3 border-r border-gray-100 flex items-start gap-2 cursor-pointer bg-white"
                onClick={() => toggleGroup(assignee)}
              >
                <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${grad} flex items-center justify-center text-white text-xs font-bold shrink-0 mt-1 shadow-sm`}>
                  {(assignee || '?')[0]?.toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold text-gray-800 truncate" title={assignee}>{assignee}</div>
                  <div className="text-[10px] uppercase font-bold text-gray-400 mt-0.5">
                    {/* Count total active tasks for this user */}
                    {Object.values(buckets).flat().length} tasks
                  </div>
                </div>
              </div>

              {/* Row Cells */}
              <div className="flex flex-1 min-w-[1000px]">
                {BUCKETS.map(b => {
                  const tasksInBucket = buckets[b.id] || [];
                  return (
                    <div key={b.id} className={`flex-1 min-w-[120px] p-2 border-r border-gray-100 last:border-0 flex flex-col gap-2 ${isCollapsed ? 'items-center justify-center' : ''} ${b.bg.replace('50', '50/30')}`}>
                      {isCollapsed ? (
                        tasksInBucket.length > 0 && (
                          <span className="w-6 h-6 rounded-md bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center">
                            {tasksInBucket.length}
                          </span>
                        )
                      ) : (
                        tasksInBucket.map(task => (
                          <div 
                            key={task.taskId} 
                            onClick={() => onTaskClick(task)}
                            className={`bg-white p-2 rounded-lg border border-gray-200 shadow-sm hover:shadow hover:border-indigo-300 transition-all cursor-pointer group/card`}
                          >
                            <div className="text-[11px] font-medium text-gray-800 line-clamp-2 leading-snug group-hover/card:text-indigo-600 transition-colors">
                              {task.name}
                            </div>
                            <div className="flex items-center justify-between mt-1.5">
                              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                task.status === 'Kế hoạch' ? 'bg-indigo-50 text-indigo-600' :
                                task.status === 'Đang xử lý' ? 'bg-amber-50 text-amber-600' :
                                'bg-gray-100 text-gray-600'
                              }`}>
                                {task.status.split(' ')[0]}
                              </span>
                              <span className="text-[9px] font-bold text-gray-400">{task.progress}%</span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
        {Object.keys(grouped).length === 0 && (
          <div className="p-12 text-center text-gray-400 font-medium">
            Tất cả công việc đã hoàn thành hoặc trống.
          </div>
        )}
      </div>
    </div>
  );
}
