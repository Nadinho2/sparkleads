import { NextRequest, NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/admin-auth';
import { createSupabaseAdmin } from '@/lib/supabase';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  if (!verifyAdmin(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q')?.trim().toLowerCase() || '';

  const supabase = createSupabaseAdmin();

  try {
    let query = supabase
      .from('workspaces')
      .select('*')
      .order('created_at', { ascending: false });

    if (q) {
      query = query.or(`name.ilike.%${q}%,slug.ilike.%${q}%`);
    }

    const { data: workspaces, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const ownerTokens = (workspaces || []).map((w) => w.owner_token).filter(Boolean);
    const workspaceIds = (workspaces || []).map((w) => w.id).filter(Boolean);

    // Fetch owners' emails and members count
    const [ownersRes, membersRes] = await Promise.all([
      ownerTokens.length > 0
        ? supabase.from('activations').select('user_token, email').in('user_token', ownerTokens)
        : { data: [] },
      workspaceIds.length > 0
        ? supabase.from('workspace_members').select('workspace_id, id, status, role')
        : { data: [] },
    ]);

    const ownersMap = new Map((ownersRes.data || []).map((o) => [o.user_token, o.email]));
    const membersByWorkspace = new Map<string, { total: number; active: number }>();

    for (const m of membersRes.data || []) {
      const entry = membersByWorkspace.get(m.workspace_id) || { total: 0, active: 0 };
      entry.total += 1;
      if (m.status === 'active') entry.active += 1;
      membersByWorkspace.set(m.workspace_id, entry);
    }

    const enrichedWorkspaces = (workspaces || []).map((ws) => {
      const ownerEmail = ownersMap.get(ws.owner_token) || 'Unknown';
      const membersInfo = membersByWorkspace.get(ws.id) || { total: 0, active: 0 };

      return {
        id: ws.id,
        name: ws.name,
        slug: ws.slug,
        ownerToken: ws.owner_token,
        ownerEmail,
        plan: ws.plan,
        status: ws.status,
        monthlyCredits: ws.monthly_credits,
        creditsRemaining: ws.credits_remaining,
        seatsLimit: ws.seats_limit,
        logoUrl: ws.logo_url,
        brandColor: ws.brand_color,
        currentPeriodEnd: ws.current_period_end,
        createdAt: ws.created_at,
        membersCount: membersInfo.total,
        activeMembersCount: membersInfo.active,
      };
    });

    return NextResponse.json({
      success: true,
      workspaces: enrichedWorkspaces,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (!verifyAdmin(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const supabase = createSupabaseAdmin();
  const action = body.action;

  // Handle creation of a new agency workspace
  if (action === 'create' || (!body.workspace_id && !body.workspaceId && (body.ownerToken || body.owner_token || body.ownerEmail || body.email))) {
    let ownerToken = body.ownerToken || body.owner_token;
    const ownerEmail = body.ownerEmail || body.email;

    if (!ownerToken && ownerEmail) {
      const { data: actList } = await supabase
        .from('activations')
        .select('user_token, email, plan')
        .ilike('email', ownerEmail.trim());
      if (actList && actList.length > 0) {
        ownerToken = actList[0].user_token;
      }
    }

    if (!ownerToken) {
      return NextResponse.json({ error: 'Valid owner token or user email is required' }, { status: 400 });
    }

    const wsName = (body.name || 'Agency Workspace').trim();
    const baseSlug = wsName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'agency';
    const slug = `${baseSlug}-${Date.now().toString(36)}`;
    
    // Normalize plan to allowed check constraint ('starter' | 'growth' | 'pro')
    let plan = body.plan || 'starter';
    if (plan.startsWith('agency_')) plan = plan.replace('agency_', '');
    if (!['starter', 'growth', 'pro'].includes(plan)) plan = 'starter';

    const monthlyCredits = Number(body.monthly_credits || body.monthlyCredits || 500);
    const creditsRemaining = Number(body.credits_remaining || body.creditsRemaining || 500);
    const seatsLimit = Number(body.seats_limit || body.seatsLimit || 3);

    const { data: newWs, error: createError } = await supabase
      .from('workspaces')
      .insert({
        name: wsName,
        slug,
        owner_token: ownerToken,
        plan,
        status: 'active',
        monthly_credits: monthlyCredits,
        credits_remaining: creditsRemaining,
        seats_limit: seatsLimit,
      })
      .select('*')
      .single();

    if (createError) {
      return NextResponse.json({ error: createError.message }, { status: 500 });
    }

    // Also register the owner as workspace member
    await supabase.from('workspace_members').upsert({
      workspace_id: newWs.id,
      user_token: ownerToken,
      email: ownerEmail || null,
      name: body.ownerName || 'Agency Owner',
      role: 'owner',
      status: 'active',
      joined_at: new Date().toISOString(),
    }, { onConflict: 'workspace_id,user_token' });

    return NextResponse.json({ success: true, workspace: newWs });
  }

  // Handle update of existing workspace
  const workspace_id = body.workspace_id || body.workspaceId;

  if (!workspace_id) {
    return NextResponse.json({ error: 'workspace_id is required' }, { status: 400 });
  }

  const updates: Record<string, unknown> = {};
  if (body.name !== undefined) updates.name = body.name.trim();
  
  if (body.plan !== undefined) {
    let plan = body.plan;
    if (typeof plan === 'string' && plan.startsWith('agency_')) plan = plan.replace('agency_', '');
    if (['starter', 'growth', 'pro'].includes(plan)) updates.plan = plan;
  }
  
  if (body.status !== undefined) {
    let status = body.status;
    if (status === 'suspended') status = 'past_due';
    if (['active', 'cancelled', 'past_due'].includes(status)) updates.status = status;
  }
  
  if (body.monthly_credits !== undefined || body.monthlyCredits !== undefined) {
    updates.monthly_credits = Number(body.monthly_credits || body.monthlyCredits);
  }
  
  if (body.seats_limit !== undefined || body.seatsLimit !== undefined) {
    updates.seats_limit = Number(body.seats_limit || body.seatsLimit);
  }

  if (body.credits_remaining !== undefined || body.creditsRemaining !== undefined) {
    updates.credits_remaining = Number(body.credits_remaining || body.creditsRemaining);
  }

  if (body.addCredits && !isNaN(Number(body.addCredits))) {
    const { data: currentWs } = await supabase
      .from('workspaces')
      .select('credits_remaining')
      .eq('id', workspace_id)
      .single();
    const curr = Number(currentWs?.credits_remaining || 0);
    updates.credits_remaining = Math.max(0, curr + Number(body.addCredits));
  }

  const { data, error } = await supabase
    .from('workspaces')
    .update(updates)
    .eq('id', workspace_id)
    .select('*')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, workspace: data });
}
