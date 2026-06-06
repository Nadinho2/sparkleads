import { cookies } from 'next/headers';
import { createSupabaseAdmin } from '@/lib/supabase';

const WORKSPACE_COOKIE = 'sparkleads_workspace';

export function getWorkspaceId(): string | null {
  const cookieStore = cookies();
  return cookieStore.get(WORKSPACE_COOKIE)?.value ?? null;
}

export function getAccountType(): 'individual' | 'agency' {
  return getWorkspaceId() ? 'agency' : 'individual';
}

export function setWorkspaceCookie(workspaceId: string | null) {
  return {
    name: WORKSPACE_COOKIE,
    value: workspaceId || '',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    maxAge: workspaceId ? 30 * 24 * 60 * 60 : 0,
    path: '/',
  };
}

export interface WorkspaceInfo {
  id: string;
  name: string;
  slug: string;
  owner_token: string;
  plan: string;
  status: string;
  monthly_credits: number;
  credits_remaining: number;
  seats_limit: number;
  logo_url: string | null;
  brand_color: string;
}

export interface WorkspaceMemberInfo {
  id: string;
  workspace_id: string;
  user_token: string;
  email: string;
  name: string;
  role: 'owner' | 'manager' | 'member';
  credit_limit: number;
  credits_used: number;
  status: string;
}

export async function getWorkspaceForUser(userToken: string): Promise<{
  workspace: WorkspaceInfo | null;
  member: WorkspaceMemberInfo | null;
}> {
  const supabase = createSupabaseAdmin();

  const { data: member } = await supabase
    .from('workspace_members')
    .select('*, workspaces(*)')
    .eq('user_token', userToken)
    .eq('status', 'active')
    .limit(1)
    .single();

  if (!member || !member.workspaces) {
    return { workspace: null, member: null };
  }

  return {
    workspace: member.workspaces as unknown as WorkspaceInfo,
    member: {
      id: member.id,
      workspace_id: member.workspace_id,
      user_token: member.user_token,
      email: member.email,
      name: member.name,
      role: member.role,
      credit_limit: member.credit_limit,
      credits_used: member.credits_used,
      status: member.status,
    },
  };
}

export async function getWorkspaceById(workspaceId: string): Promise<WorkspaceInfo | null> {
  const supabase = createSupabaseAdmin();
  const { data } = await supabase
    .from('workspaces')
    .select('*')
    .eq('id', workspaceId)
    .single();
  return (data as unknown as WorkspaceInfo) || null;
}

export async function getWorkspaceMember(
  workspaceId: string,
  userToken: string
): Promise<WorkspaceMemberInfo | null> {
  const supabase = createSupabaseAdmin();
  const { data } = await supabase
    .from('workspace_members')
    .select('*')
    .eq('workspace_id', workspaceId)
    .eq('user_token', userToken)
    .single();
  return (data as unknown as WorkspaceMemberInfo) || null;
}
