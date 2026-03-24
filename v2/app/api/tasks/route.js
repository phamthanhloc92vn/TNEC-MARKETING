import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getTasks, getTasksByUser, createTask, updateTask, updateTaskStatus, deleteTask } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const role = (session.user.role || '').toLowerCase().trim();
  const isManager = role === 'trưởng phòng';

  const tasks = isManager ? await getTasks() : await getTasksByUser(session.user.email);
  return NextResponse.json({ tasks });
}

export async function POST(request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const { action, ...data } = body;

  switch (action) {
    case 'create': {
      try {
        const result = await createTask({
          ...data,
          assignedBy: session.user.email,
        });
        return NextResponse.json(result);
      } catch (e) {
        console.error('Create task error:', e);
        return NextResponse.json({ success: false, error: e.message || 'Error executing createTask' }, { status: 500 });
      }
    }
    case 'update': {
      const result = await updateTask(data);
      return NextResponse.json(result);
    }
    case 'updateStatus': {
      const result = await updateTaskStatus(data.taskId, data.status);
      return NextResponse.json(result);
    }
    case 'delete': {
      const result = await deleteTask(data.taskId);
      return NextResponse.json(result);
    }
    default:
      return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  }
}
