'use client';

import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import KanbanBoard from '@/components/KanbanBoard';
import StatsBar from '@/components/StatsBar';
import EmployeeStats from '@/components/EmployeeStats';
import CreateTaskModal from '@/components/CreateTaskModal';
import TaskDetailModal from '@/components/TaskDetailModal';
import Toast from '@/components/Toast';

const STATUSES = ['Kế hoạch', 'Đang xử lý', 'Chờ duyệt', 'Cần chỉnh sửa', 'Hoàn thành'];

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [toast, setToast] = useState(null);

  const isManager = session?.user?.role?.toLowerCase().trim() === 'trưởng phòng';

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/');
  }, [status, router]);

  const fetchTasks = useCallback(async () => {
    try {
      const res = await fetch('/api/tasks');
      const data = await res.json();
      setTasks(data.tasks || []);
    } catch (e) {
      console.error('Error fetching tasks:', e);
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    if (!isManager) return;
    try {
      const res = await fetch('/api/users');
      const data = await res.json();
      setUsers(data.users || []);
    } catch (e) {
      console.error('Error fetching users:', e);
    }
  }, [isManager]);

  useEffect(() => {
    if (status === 'authenticated') {
      Promise.all([fetchTasks(), fetchUsers()]).then(() => setLoading(false));
    }
  }, [status, fetchTasks, fetchUsers]);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleStatusChange = async (taskId, newStatus) => {
    // Optimistic update
    setTasks(prev => prev.map(t => t.taskId === taskId
      ? { ...t, status: newStatus, progress: newStatus === 'Hoàn thành' ? 100 : t.progress }
      : t
    ));

    try {
      await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'updateStatus', taskId, status: newStatus }),
      });
      showToast(`Đã chuyển sang "${newStatus}"`);
    } catch {
      fetchTasks(); // Revert on error
      showToast('Lỗi cập nhật trạng thái', 'error');
    }
  };

  const handleCreateTask = async (taskData) => {
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create', ...taskData }),
      });
      const result = await res.json();
      if (result.success) {
        showToast('Tạo task thành công!');
        setShowCreateModal(false);
        fetchTasks();
      }
    } catch {
      showToast('Lỗi tạo task', 'error');
    }
  };

  const handleUpdateTask = async (taskData) => {
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update', ...taskData }),
      });
      const result = await res.json();
      if (result.success) {
        showToast('Cập nhật thành công!');
        setSelectedTask(null);
        fetchTasks();
      }
    } catch {
      showToast('Lỗi cập nhật', 'error');
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!confirm('Bạn chắc chắn muốn xóa task này?')) return;
    try {
      await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', taskId }),
      });
      showToast('Đã xóa task');
      setSelectedTask(null);
      fetchTasks();
    } catch {
      showToast('Lỗi xóa task', 'error');
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500 font-medium">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  if (!session) return null;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-[1600px] mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center shadow-md shadow-indigo-500/20">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
              </svg>
            </div>
            <h1 className="text-lg font-bold bg-gradient-to-r from-indigo-600 to-cyan-500 bg-clip-text text-transparent">
              TNEC Marketing
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-semibold text-gray-900">{session.user.sheetName || session.user.name}</p>
              <p className="text-xs text-indigo-500 font-medium">{session.user.role}</p>
            </div>
            {session.user.image ? (
              <img src={session.user.image} alt="" className="w-9 h-9 rounded-full ring-2 ring-indigo-100" />
            ) : (
              <div className="w-9 h-9 rounded-full gradient-primary flex items-center justify-center text-white text-sm font-bold">
                {(session.user.sheetName || session.user.name || '?')[0]}
              </div>
            )}
            <button
              onClick={() => signOut({ callbackUrl: '/' })}
              className="text-gray-400 hover:text-red-500 transition-colors p-2 rounded-lg hover:bg-red-50"
              title="Đăng xuất"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
                <polyline points="16,17 21,12 16,7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-[1600px] mx-auto px-6 py-6">
        {/* Stats */}
        <StatsBar tasks={tasks} />

        {/* Employee Stats (Manager only) */}
        {isManager && <EmployeeStats tasks={tasks} users={users} />}

        {/* Kanban Board */}
        <KanbanBoard
          tasks={tasks}
          statuses={STATUSES}
          onStatusChange={handleStatusChange}
          onTaskClick={setSelectedTask}
        />
      </main>

      {/* FAB - Create Task */}
      <button
        onClick={() => setShowCreateModal(true)}
        className="fixed bottom-8 right-8 w-14 h-14 rounded-2xl gradient-primary shadow-xl shadow-indigo-500/30 hover:shadow-indigo-500/50 transition-all duration-200 flex items-center justify-center text-white hover:scale-105 active:scale-95 z-50"
        title="Tạo task mới"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </button>

      {/* Modals */}
      {showCreateModal && (
        <CreateTaskModal
          users={users}
          isManager={isManager}
          currentUserEmail={session.user.email}
          onSubmit={handleCreateTask}
          onClose={() => setShowCreateModal(false)}
        />
      )}

      {selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          users={users}
          isManager={isManager}
          onUpdate={handleUpdateTask}
          onDelete={handleDeleteTask}
          onClose={() => setSelectedTask(null)}
        />
      )}

      {/* Toast */}
      {toast && <Toast message={toast.message} type={toast.type} />}
    </div>
  );
}
