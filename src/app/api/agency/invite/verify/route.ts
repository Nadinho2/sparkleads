import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdmin } from '@/lib/supabase';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');

  if (!token) {
    return NextResponse.json({ valid: false, error: 'No token provided' });
  }

  const supabase = createSupabaseAdmin();

  const { data: member } = await supabase
    .from('workspace_members')
    .select('id, status, workspace_id, workspaces(name)')
    .eq('invite_token', token)
    .single();

  if (!member || member.status !== 'invited') {
    return NextResponse.json({ valid: false, error: 'Invalid or expired invite' });
  }

  const workspace = member.workspaces as unknown as { name: string } | null;

  return NextResponse.json({
    valid: true,
    workspaceName: workspace?.name || 'Agency',
    memberId: member.id,
  });
}
