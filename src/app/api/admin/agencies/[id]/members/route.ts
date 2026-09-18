import { NextRequest, NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/admin-auth';
import { createSupabaseAdmin } from '@/lib/supabase';

export const runtime = 'nodejs';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!verifyAdmin(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const workspaceId = params.id;
  const supabase = createSupabaseAdmin();

  try {
    const { data: members, error } = await supabase
      .from('workspace_members')
      .select('id, workspace_id, user_token, email, name, role, credit_limit, credits_used, status, joined_at, created_at')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, members: members || [] });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!verifyAdmin(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const workspaceId = params.id;
  let body: Record<string, any>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const member_id = body.member_id || body.memberId;
  let role = body.role;
  if (role === 'admin') role = 'manager';
  const status = body.status;
  const credit_limit = body.credit_limit !== undefined ? body.credit_limit : body.creditLimit;

  if (!member_id) {
    return NextResponse.json({ error: 'member_id is required' }, { status: 400 });
  }

  const supabase = createSupabaseAdmin();

  const updates: Record<string, unknown> = {};
  if (role !== undefined && ['owner', 'manager', 'member'].includes(role)) updates.role = role;
  if (status !== undefined && ['active', 'invited', 'suspended'].includes(status)) updates.status = status;
  if (credit_limit !== undefined) updates.credit_limit = Number(credit_limit);

  const { data, error } = await supabase
    .from('workspace_members')
    .update(updates)
    .eq('id', member_id)
    .eq('workspace_id', workspaceId)
    .select('*')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, member: data });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!verifyAdmin(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const workspaceId = params.id;
  const { searchParams } = new URL(request.url);
  const memberId = searchParams.get('memberId');

  if (!memberId) {
    return NextResponse.json({ error: 'memberId is required' }, { status: 400 });
  }

  const supabase = createSupabaseAdmin();
  const { error } = await supabase
    .from('workspace_members')
    .delete()
    .eq('id', memberId)
    .eq('workspace_id', workspaceId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
