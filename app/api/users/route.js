import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getUsers } from '@/lib/sheets';

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
