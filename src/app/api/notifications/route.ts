import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  clearAllNotifications,
} from '@/lib/notifications';

export const runtime = 'nodejs';

function getUserToken(): string | null {
  const cookieStore = cookies();
  return cookieStore.get('sparkleads_token')?.value || null;
}

export async function GET(request: NextRequest) {
  const userToken = getUserToken();
  if (!userToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));

  const result = await getNotifications(userToken, limit);
  return NextResponse.json(result);
}

export async function PATCH(request: NextRequest) {
  const userToken = getUserToken();
  if (!userToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    if (body.all) {
      await markAllNotificationsAsRead(userToken);
      return NextResponse.json({ success: true, message: 'All notifications marked as read' });
    }

    if (body.id) {
      await markNotificationAsRead(userToken, body.id);
      return NextResponse.json({ success: true, message: 'Notification marked as read' });
    }

    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  } catch {
    return NextResponse.json({ error: 'Failed to update notifications' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const userToken = getUserToken();
  if (!userToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  const all = searchParams.get('all') === 'true';

  if (all) {
    await clearAllNotifications(userToken);
    return NextResponse.json({ success: true, message: 'All notifications cleared' });
  }

  if (id) {
    await deleteNotification(userToken, id);
    return NextResponse.json({ success: true, message: 'Notification deleted' });
  }

  return NextResponse.json({ error: 'Missing id or all parameter' }, { status: 400 });
}
