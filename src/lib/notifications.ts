import { createSupabaseAdmin } from './supabase';
import { v4 as uuidv4 } from 'uuid';

export type NotificationType = 'system' | 'referral' | 'payout' | 'subscription' | 'credit';

export interface AppNotification {
  id: string;
  user_token: string;
  title: string;
  message: string;
  type: NotificationType;
  link?: string | null;
  read: boolean;
  created_at: string;
}

/**
 * Creates an in-app notification for a given user.
 * Supports dedicated 'notifications' table with automatic fallback to 'workspace_activity'.
 */
export async function createNotification(
  userToken: string,
  data: {
    title: string;
    message: string;
    type?: NotificationType;
    link?: string;
  }
): Promise<boolean> {
  if (!userToken) return false;

  const supabase = createSupabaseAdmin();
  const type = data.type || 'system';
  const id = uuidv4();
  const now = new Date().toISOString();

  // Try inserting into dedicated 'notifications' table first
  const { error: directError } = await supabase.from('notifications').insert({
    id,
    user_token: userToken,
    title: data.title,
    message: data.message,
    type,
    link: data.link || null,
    read: false,
    created_at: now,
  });

  if (!directError) {
    return true;
  }

  // Fallback to storing in 'workspace_activity' table
  const { error: fallbackError } = await supabase.from('workspace_activity').insert({
    id,
    workspace_id: null,
    user_token: userToken,
    member_name: 'SparkLeads System',
    action: 'notification',
    resource_type: type,
    resource_id: id,
    metadata: {
      title: data.title,
      message: data.message,
      type,
      link: data.link || null,
      read: false,
    },
    created_at: now,
  });

  if (fallbackError) {
    console.error('Failed to create notification:', fallbackError);
    return false;
  }

  return true;
}

/**
 * Retrieves in-app notifications for a user.
 */
export async function getNotifications(
  userToken: string,
  limit = 30
): Promise<{ notifications: AppNotification[]; unreadCount: number }> {
  if (!userToken) return { notifications: [], unreadCount: 0 };

  const supabase = createSupabaseAdmin();

  // Try 'notifications' table
  const { data: directRows, error: directError } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_token', userToken)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (!directError && directRows) {
    const notifications: AppNotification[] = directRows.map((r) => ({
      id: r.id,
      user_token: r.user_token,
      title: r.title,
      message: r.message,
      type: (r.type as NotificationType) || 'system',
      link: r.link,
      read: Boolean(r.read),
      created_at: r.created_at,
    }));
    const unreadCount = notifications.filter((n) => !n.read).length;
    return { notifications, unreadCount };
  }

  // Fallback to 'workspace_activity'
  const { data: activityRows, error: activityError } = await supabase
    .from('workspace_activity')
    .select('*')
    .eq('user_token', userToken)
    .eq('action', 'notification')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (activityError || !activityRows) {
    return { notifications: [], unreadCount: 0 };
  }

  const notifications: AppNotification[] = activityRows.map((row) => {
    const meta = (row.metadata as Record<string, unknown>) || {};
    return {
      id: row.id,
      user_token: row.user_token,
      title: (meta.title as string) || 'Notification',
      message: (meta.message as string) || '',
      type: (meta.type as NotificationType) || (row.resource_type as NotificationType) || 'system',
      link: (meta.link as string) || null,
      read: Boolean(meta.read),
      created_at: row.created_at,
    };
  });

  const unreadCount = notifications.filter((n) => !n.read).length;
  return { notifications, unreadCount };
}

/**
 * Marks a single notification as read.
 */
export async function markNotificationAsRead(userToken: string, id: string): Promise<boolean> {
  const supabase = createSupabaseAdmin();

  // Try direct table
  const { error: directError } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('id', id)
    .eq('user_token', userToken);

  if (!directError) return true;

  // Try activity table
  const { data: row } = await supabase
    .from('workspace_activity')
    .select('metadata')
    .eq('id', id)
    .eq('user_token', userToken)
    .single();

  if (row) {
    const meta = (row.metadata as Record<string, unknown>) || {};
    await supabase
      .from('workspace_activity')
      .update({
        metadata: { ...meta, read: true },
      })
      .eq('id', id);
    return true;
  }

  return false;
}

/**
 * Marks all notifications as read for a user.
 */
export async function markAllNotificationsAsRead(userToken: string): Promise<boolean> {
  const supabase = createSupabaseAdmin();

  // Direct table
  await supabase
    .from('notifications')
    .update({ read: true })
    .eq('user_token', userToken)
    .eq('read', false);

  // Activity table
  const { data: rows } = await supabase
    .from('workspace_activity')
    .select('id, metadata')
    .eq('user_token', userToken)
    .eq('action', 'notification');

  if (rows && rows.length > 0) {
    for (const row of rows) {
      const meta = (row.metadata as Record<string, unknown>) || {};
      if (!meta.read) {
        await supabase
          .from('workspace_activity')
          .update({
            metadata: { ...meta, read: true },
          })
          .eq('id', row.id);
      }
    }
  }

  return true;
}

/**
 * Deletes a single notification.
 */
export async function deleteNotification(userToken: string, id: string): Promise<boolean> {
  const supabase = createSupabaseAdmin();

  await supabase.from('notifications').delete().eq('id', id).eq('user_token', userToken);
  await supabase.from('workspace_activity').delete().eq('id', id).eq('user_token', userToken);

  return true;
}

/**
 * Clears all notifications for a user.
 */
export async function clearAllNotifications(userToken: string): Promise<boolean> {
  const supabase = createSupabaseAdmin();

  await supabase.from('notifications').delete().eq('user_token', userToken);
  await supabase
    .from('workspace_activity')
    .delete()
    .eq('user_token', userToken)
    .eq('action', 'notification');

  return true;
}
