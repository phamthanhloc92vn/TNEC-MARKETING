'use client';

import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, DragOverlay, useDroppable } from '@dnd-kit/core';
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
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {statuses.map(status => (
          <KanbanColumn
            key={status}
            status={status}
            tasks={getTasksByStatus(status)}
            activeId={activeId}
            onTaskClick={onTaskClick}
            isOver={overId === status}
          />
        ))}
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
