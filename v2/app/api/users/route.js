import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getUsers } from '@/lib/db';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const role = (session.user.role || '').toLowerCase().trim();
  if (role !== 'trưởng phòng') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const users = await getUsers();
  return NextResponse.json({ users });
}

export async function POST(request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const role = (session.user.role || '').toLowerCase().trim();
  if (role !== 'trưởng phòng') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json();
  const { action, ...data } = body;

  const { addUser, deleteUser, updateUser } = await import('@/lib/db');

  switch (action) {
    case 'create': {
      const result = await addUser(data);
      return NextResponse.json(result);
    }
    case 'update': {
      const result = await updateUser(data);
      return NextResponse.json(result);
    }
    case 'delete': {
      const result = await deleteUser(data.email);
      return NextResponse.json(result);
    }
    default:
      return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  }
}
