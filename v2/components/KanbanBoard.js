'use client';

import { DndContext, closestCorners, PointerSensor, useSensor, useSensors, DragOverlay, useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useState } from 'react';
import TaskCard, { TaskCardContent } from './TaskCard';

const STATUS_CONFIG = {
  'Kế hoạch': { color: 'bg-indigo-500', lightBg: 'bg-indigo-50', icon: '📋' },
  'Đang xử lý': { color: 'bg-amber-500', lightBg: 'bg-amber-50', icon: '⚡' },
  'Chờ duyệt': { color: 'bg-cyan-500', lightBg: 'bg-cyan-50', icon: '👁️' },
  'Cần chỉnh sửa': { color: 'bg-red-500', lightBg: 'bg-red-50', icon: '✏️' },
  'Hoàn thành': { color: 'bg-emerald-500', lightBg: 'bg-emerald-50', icon: '✅' },
};

// Avatar color palette — consistent per assignee initial
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

// Grouped view for columns (manager-optimized)
function GroupedColumn({ status, tasks, onTaskClick, activeId, isOver }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG['Hoàn thành'];
  const { setNodeRef } = useDroppable({ id: status });
  const [collapsed, setCollapsed] = useState({});

  // Group by assignee
  const groups = tasks.reduce((acc, task) => {
    const key = task.assignee || 'Chưa phân công';
    if (!acc[key]) acc[key] = [];
    acc[key].push(task);
    return acc;
  }, {});

  const toggleGroup = (key) =>
    setCollapsed(prev => ({ ...prev, [key]: !prev[key] }));

  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col rounded-2xl border transition-all duration-200 ${
        isOver
          ? `border-${status === 'Kế hoạch' ? 'indigo' : 'emerald'}-300 bg-${status === 'Kế hoạch' ? 'indigo' : 'emerald'}-50/50 shadow-lg shadow-${status === 'Kế hoạch' ? 'indigo' : 'emerald'}-100`
          : 'border-gray-100 bg-white'
      }`}
    >
      {/* Column Header */}
      <div className="p-4 border-b border-gray-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`w-2.5 h-2.5 rounded-full ${config.color}`} />
            <h3 className="font-semibold text-sm text-gray-800 uppercase tracking-wider">{status}</h3>
          </div>
          <span className={`text-xs font-bold text-${status === 'Kế hoạch' ? 'indigo' : 'emerald'}-600 bg-${status === 'Kế hoạch' ? 'indigo' : 'emerald'}-50 rounded-full w-6 h-6 flex items-center justify-center`}>
            {tasks.length}
          </span>
        </div>
      </div>

      <SortableContext
        id={status}
        items={tasks.map(t => t.taskId)}
        strategy={verticalListSortingStrategy}
      >
        <div className="p-3 min-h-[300px] flex-1 space-y-4" data-status={status}>
          {tasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-300 h-full">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <line x1="8" y1="12" x2="16" y2="12" />
              </svg>
              <p className="text-xs mt-2">Không có công việc</p>
            </div>
          ) : (
            Object.entries(groups).map(([assignee, groupTasks]) => {
              const isCollapsed = collapsed[assignee];
              const grad = assigneeColor(assignee);
              return (
                <div key={assignee} className="rounded-xl border border-gray-100 overflow-hidden">
                  {/* Group header — clickable to collapse */}
                  <button
                    onClick={() => toggleGroup(assignee)}
                    className="w-full flex items-center justify-between px-3 py-2.5 bg-gray-50 hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div className={`w-7 h-7 rounded-full bg-gradient-to-br ${grad} flex items-center justify-center text-white text-[11px] font-bold shrink-0`}>
                        {(assignee || '?')[0]?.toUpperCase()}
                      </div>
                      <span className="text-xs font-semibold text-gray-700 truncate">{assignee}</span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className={`text-[10px] font-bold text-${status === 'Kế hoạch' ? 'indigo' : 'emerald'}-600 bg-${status === 'Kế hoạch' ? 'indigo' : 'emerald'}-100 rounded-full px-1.5 py-0.5`}>
                        {groupTasks.length}
                      </span>
                      <svg
                        width="14" height="14" viewBox="0 0 24 24" fill="none"
                        stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                        className={`text-gray-400 transition-transform duration-200 ${isCollapsed ? '-rotate-90' : ''}`}
                      >
                        <polyline points="6,9 12,15 18,9" />
                      </svg>
                    </div>
                  </button>

                  {/* Tasks */}
                  {!isCollapsed && (
                    <div className="p-2 space-y-2 bg-white">
                      {groupTasks.map(task => (
                        <TaskCard
                          key={task.taskId}
                          task={task}
                          onClick={() => onTaskClick(task)}
                          isDragging={activeId === task.taskId}
                        />
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </SortableContext>
    </div>
  );
}

function KanbanColumn({ status, tasks, onTaskClick, activeId, isOver }) {
  const config = STATUS_CONFIG[status] || {};
  const { setNodeRef } = useDroppable({
    id: status,
  });

  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col rounded-2xl border transition-all duration-200 ${
        isOver
          ? 'border-indigo-300 bg-indigo-50/50 shadow-lg shadow-indigo-100'
          : 'border-gray-100 bg-white'
      }`}
    >
      {/* Column Header */}
      <div className="p-4 border-b border-gray-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`w-2.5 h-2.5 rounded-full ${config.color}`} />
            <h3 className="font-semibold text-sm text-gray-800 uppercase tracking-wider">{status}</h3>
          </div>
          <span className="text-xs font-bold text-gray-400 bg-gray-100 rounded-full w-6 h-6 flex items-center justify-center">
            {tasks.length}
          </span>
        </div>
      </div>

      {/* Drop Zone with SortableContext */}
      <SortableContext
        id={status}
        items={tasks.map(t => t.taskId)}
        strategy={verticalListSortingStrategy}
      >
        <div
          className="p-3 min-h-[300px] flex-1 space-y-3"
          data-status={status}
        >
          {tasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-300 h-full">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <line x1="8" y1="12" x2="16" y2="12" />
              </svg>
              <p className="text-xs mt-2">Không có công việc</p>
            </div>
          ) : (
            tasks.map(task => (
              <TaskCard
                key={task.taskId}
                task={task}
                onClick={() => onTaskClick(task)}
                isDragging={activeId === task.taskId}
              />
            ))
          )}
        </div>
      </SortableContext>
    </div>
  );
}


export default function KanbanBoard({ tasks, statuses, onStatusChange, onTaskClick }) {
  const [activeId, setActiveId] = useState(null);
  const [overId, setOverId] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const getTasksByStatus = (status) => tasks.filter(t => t.status === status);

  const handleDragStart = (event) => {
    setActiveId(event.active.id);
  };

  const handleDragOver = (event) => {
    setOverId(event.over?.id || null);
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    setActiveId(null);
    setOverId(null);

    if (!over) return;

    const taskId = active.id;
    let newStatus = null;

    // Check if dropped on a column
    if (statuses.includes(over.id)) {
      newStatus = over.id;
    } else {
      // Dropped on another task — find that task's status
      const targetTask = tasks.find(t => t.taskId === over.id);
      if (targetTask) newStatus = targetTask.status;
    }

    if (newStatus) {
      const task = tasks.find(t => t.taskId === taskId);
      if (task && task.status !== newStatus) {
        onStatusChange(taskId, newStatus);
      }
    }
  };

  const activeTask = activeId ? tasks.find(t => t.taskId === activeId) : null;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {statuses.map(status =>
          (status === 'Hoàn thành' || status === 'Kế hoạch') ? (
            <GroupedColumn
              key={status}
              status={status}
              tasks={getTasksByStatus(status)}
              activeId={activeId}
              onTaskClick={onTaskClick}
              isOver={overId === status}
            />
          ) : (
            <KanbanColumn
              key={status}
              status={status}
              tasks={getTasksByStatus(status)}
              activeId={activeId}
              onTaskClick={onTaskClick}
              isOver={overId === status}
            />
          )
        )}
      </div>

      {/* Drag Overlay */}
      <DragOverlay>
        {activeTask && (
          <div className="rotate-3 opacity-90">
            <TaskCardContent task={activeTask} isDragging={true} />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}
