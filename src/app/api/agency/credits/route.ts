import { NextRequest, NextResponse } from 'next/server';
import { getToken } from '@/lib/auth';
import { createSupabaseAdmin } from '@/lib/supabase';
import { getWorkspaceId } from '@/lib/agency-auth';

export const runtime = 'nodejs';

export async function GET() {
  const token = getToken();
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const workspaceId = getWorkspaceId();
  if (!workspaceId) return NextResponse.json({ error: 'No workspace' }, { status: 400 });

  const supabase = createSupabaseAdmin();

  const { data: workspace } = await supabase
    .from('workspaces')
    .select('monthly_credits, credits_remaining')
    .eq('id', workspaceId)
    .single();

  const { data: members } = await supabase
    .from('workspace_members')
    .select('name, credit_limit, credits_used')
    .eq('workspace_id', workspaceId)
    .eq('status', 'active');

  return NextResponse.json({
    total: workspace?.monthly_credits || 0,
    used: (workspace?.monthly_credits || 0) - (workspace?.credits_remaining || 0),
    remaining: workspace?.credits_remaining || 0,
    memberBreakdown: (members || []).map((m) => ({
      name: m.name,
      used: m.credits_used,
      limit: m.credit_limit,
    })),
  });
}

export async function POST(request: NextRequest) {
  const token = getToken();
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const workspaceId = getWorkspaceId();
  if (!workspaceId) return NextResponse.json({ error: 'No workspace' }, { status: 400 });

  const body = await request.json();
  const { memberToken, limit } = body as { memberToken: string; limit: number };

  const supabase = createSupabaseAdmin();

  const { error } = await supabase
    .from('workspace_members')
    .update({ credit_limit: limit })
    .eq('workspace_id', workspaceId)
    .eq('user_token', memberToken);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
