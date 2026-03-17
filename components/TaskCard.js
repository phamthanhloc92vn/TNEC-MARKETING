'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const PRIORITY_STYLES = {
  'Cao': 'border-l-red-500 bg-red-50/30',
  'Trung bình': 'border-l-amber-500 bg-amber-50/30',
  'Thấp': 'border-l-green-500 bg-green-50/30',
};

export function TaskCardContent({ task, isDragging }) {
  const priorityStyle = PRIORITY_STYLES[task.priority] || '';
  const isOverdue = task.deadline && new Date(task.deadline) < new Date() && task.status !== 'Hoàn thành';
  const progress = parseInt(task.progress) || 0;

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    try {
      if (typeof dateStr === 'string' && dateStr.includes('/')) {
        const parts = dateStr.split(' ')[0].split('/');
        if (parts.length === 3) {
          if (parseInt(parts[0]) > 12 || parts[0].length === 2) {
             const d = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
             if (!isNaN(d.getTime())) {
                return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
             }
          }
        }
      }
      
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className={`bg-white rounded-xl p-4 border-l-4 border border-gray-100 hover:shadow-md transition-all duration-150 ${priorityStyle} ${isDragging ? 'opacity-50 rotate-2' : ''}`}>
      {/* Task name */}
      <h4 className="font-semibold text-sm text-gray-900 mb-2 line-clamp-2">{task.name}</h4>

      {/* Assignee */}
      <div className="flex items-center gap-2 mb-2">
        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-[10px] font-bold">
          {(task.assignee || '?')[0]?.toUpperCase()}
        </div>
        <span className="text-xs text-gray-500 truncate">{task.assignee}</span>
      </div>

      {/* Deadline */}
      {task.deadline && (
        <div className={`flex items-center gap-1.5 text-xs mb-2 ${isOverdue ? 'text-red-500 font-semibold' : 'text-gray-400'}`}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          <span>{formatDate(task.deadline)}{isOverdue ? ' (Trễ hạn!)' : ''}</span>
        </div>
      )}

      {/* Progress bar */}
      <div className="flex items-center gap-2">
        <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-300 ${
              progress >= 100 ? 'bg-emerald-500' : progress >= 50 ? 'bg-amber-500' : 'bg-indigo-500'
            }`}
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
        <span className="text-[10px] font-semibold text-gray-400">{progress}%</span>
      </div>
    </div>
  );
}

export default function TaskCard({ task, onClick, isDragging }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: task.taskId });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className={`touch-none cursor-grab active:cursor-grabbing ${isDragging ? 'z-50 relative' : ''}`}
    >
      <TaskCardContent task={task} isDragging={isDragging} />
    </div>
  );
}
