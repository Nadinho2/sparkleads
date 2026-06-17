import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdmin } from '@/lib/supabase';

// TEMPORARY DEBUG ENDPOINT — DELETE AFTER USE
// Visit: /api/debug/invite?token=YOUR_TOKEN
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');

  if (!token) {
    return NextResponse.json({ error: 'Token required. Use ?token=xxx' }, { status: 400 });
  }

  const supabase = createSupabaseAdmin();

  // Query with invite_expires_at
  const { data: withExpiry, error: errWith } = await supabase
    .from('workspace_members')
    .select('id, status, workspace_id, role, name, email, credit_limit, created_at, invite_expires_at')
    .eq('invite_token', token);

  // Query all columns (without invite_expires_at in case column doesn't exist)
  const { data: withoutExpiry, error: errWithout } = await supabase
    .from('workspace_members')
    .select('id, status, workspace_id, role, name, email, credit_limit, created_at')
    .eq('invite_token', token);

  // Query the workspace info
  let workspaceName = null;
  let workspaceLogo = null;
  const record = withExpiry?.[0] || withoutExpiry?.[0];
  if (record?.workspace_id) {
    const { data: ws } = await supabase
      .from('workspaces')
      .select('name, logo_url')
      .eq('id', record.workspace_id)
      .single();
    workspaceName = ws?.name;
    workspaceLogo = ws?.logo_url;
  }

  // Current time for comparison
  const now = new Date();
  let expiryInfo: unknown = 'no expiry column value';
  if (withExpiry?.[0]?.invite_expires_at) {
    const expiryDate = new Date(withExpiry[0].invite_expires_at);
    expiryInfo = {
      expiresAt: expiryDate.toISOString(),
      now: now.toISOString(),
      isExpired: expiryDate < now,
      remainingMs: expiryDate.getTime() - now.getTime(),
      remainingDays: Math.round((expiryDate.getTime() - now.getTime()) / 86400000 * 10) / 10,
    };
  } else if (withoutExpiry?.[0]?.created_at) {
    const fallbackExpiry = new Date(withoutExpiry[0].created_at);
    fallbackExpiry.setDate(fallbackExpiry.getDate() + 30);
    expiryInfo = {
      note: 'No invite_expires_at set — using created_at + 30 days fallback',
      fallbackExpiry: fallbackExpiry.toISOString(),
      now: now.toISOString(),
      isExpired: fallbackExpiry < now,
      created_at: withoutExpiry[0].created_at,
    };
  }

  return NextResponse.json({
    token,
    withExpiryColumn: {
      data: withExpiry,
      error: errWith?.message || null,
      columnExists: !errWith || !errWith.message?.includes('invite_expires_at'),
    },
    withoutExpiryColumn: {
      data: withoutExpiry,
      error: errWithout?.message || null,
    },
    workspace: { name: workspaceName, logo: workspaceLogo },
    expiryInfo,
    currentTime: now.toISOString(),
    recordFound: !!record,
    record,
  });
}
