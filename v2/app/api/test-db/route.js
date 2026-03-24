import { NextResponse } from 'next/server';
import { getUsers } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const users = await getUsers();
    return NextResponse.json({ 
      success: true, 
      commit: '3358142 - Caching Disabled',
      count: users.length, 
      users 
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
