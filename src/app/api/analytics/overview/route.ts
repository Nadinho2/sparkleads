import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdmin } from '@/lib/supabase';
import { getToken } from '@/lib/auth';

export const runtime = 'nodejs';

function getStartDate(period: string): string {
  const now = new Date();
  switch (period) {
    case '7d': now.setDate(now.getDate() - 7); break;
    case '30d': now.setDate(now.getDate() - 30); break;
    case '90d': now.setDate(now.getDate() - 90); break;
    default: return '2020-01-01';
  }
  return now.toISOString();
}

function groupByDay(items: { created_at: string }[]): Record<string, number> {
  const grouped: Record<string, number> = {};
  items.forEach((item) => {
    const day = item.created_at.slice(0, 10);
    grouped[day] = (grouped[day] || 0) + 1;
  });
  return grouped;
}

export async function GET(request: NextRequest) {
  const userToken = getToken();
  if (!userToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const period = request.nextUrl.searchParams.get('period') || '30d';
  const startDate = getStartDate(period);

  const supabase = createSupabaseAdmin();

  const [
    searchesResult,
    outreachResult,
    contentResult,
    creditsResult,
    remindersResult,
    proposalsResult,
    messagesResult,
    briefsResult,
    balanceResult,
  ] = await Promise.all([
    supabase
      .from('searches')
      .select('id, query, result_count, created_at')
      .eq('user_token', userToken)
      .gte('created_at', startDate),
    supabase
      .from('outreach_messages')
      .select('id, type, status, created_at')
      .eq('user_token', userToken)
      .gte('created_at', startDate)
      .then(r => r),
    supabase
      .from('generated_content')
      .select('id, platform, content_type, created_at')
      .eq('user_token', userToken)
      .gte('created_at', startDate),
    supabase
      .from('credit_transactions')
      .select('id, type, amount, description, created_at')
      .eq('user_token', userToken)
      .gte('created_at', startDate),
    supabase
      .from('follow_up_reminders')
      .select('id, status, due_date, created_at')
      .eq('user_token', userToken),
    supabase
      .from('proposals')
      .select('id, status, created_at')
      .eq('user_token', userToken)
      .gte('created_at', startDate),
    supabase
      .from('ai_generated_messages')
      .select('id, message_type, created_at')
      .eq('user_token', userToken)
      .gte('created_at', startDate),
    supabase
      .from('creative_briefs')
      .select('id, status, created_at')
      .eq('user_token', userToken)
      .gte('created_at', startDate),
    supabase
      .from('user_credits')
      .select('balance')
      .eq('user_token', userToken)
      .single(),
  ]);

  const searches = searchesResult.data || [];
  const outreach = outreachResult.data || [];
  const content = contentResult.data || [];
  const credits = creditsResult.data || [];
  const reminders = remindersResult.data || [];
  const proposals = proposalsResult.data || [];
  const messages = messagesResult.data || [];
  const briefs = briefsResult.data || [];

  // Top search queries
  const queryCount: Record<string, number> = {};
  searches.forEach((s) => {
    if (s.query) queryCount[s.query] = (queryCount[s.query] || 0) + 1;
  });
  const topSearchQueries = Object.entries(queryCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([query, count]) => ({ query, count }));

  // Credit spend by feature
  const spendByFeature: Record<string, number> = {};
  credits.filter((t) => t.amount < 0).forEach((t) => {
    const key = t.description || 'Other';
    spendByFeature[key] = (spendByFeature[key] || 0) + Math.abs(t.amount);
  });

  // Outreach by day
  const outreachByDay = groupByDay(outreach);
  const messagesByDay = groupByDay(messages);

  // Content by platform
  const contentByPlatform: Record<string, number> = {};
  content.forEach((c) => {
    const p = c.platform || 'Other';
    contentByPlatform[p] = (contentByPlatform[p] || 0) + 1;
  });

  // Content by type
  const contentByType: Record<string, number> = {};
  content.forEach((c) => {
    const t = c.content_type || 'Other';
    contentByType[t] = (contentByType[t] || 0) + 1;
  });

  // Leads by day (from searches)
  const leadsByDay: Record<string, number> = {};
  searches.forEach((s) => {
    const day = s.created_at.slice(0, 10);
    leadsByDay[day] = (leadsByDay[day] || 0) + (s.result_count || 0);
  });

  // Credits by day
  const creditsByDay: Record<string, number> = {};
  credits.filter((t) => t.amount < 0).forEach((t) => {
    const day = t.created_at.slice(0, 10);
    creditsByDay[day] = (creditsByDay[day] || 0) + Math.abs(t.amount);
  });

  // Activity feed (combine recent from all tables)
  const activities: { type: string; description: string; time: string }[] = [];

  searches.slice(0, 5).forEach((s) => {
    activities.push({
      type: 'search',
      description: `Searched "${s.query}" — found ${s.result_count} leads`,
      time: s.created_at,
    });
  });
  outreach.slice(0, 5).forEach((o) => {
    activities.push({
      type: 'outreach',
      description: `${o.type === 'whatsapp' ? 'WhatsApp' : 'Email'} sent`,
      time: o.created_at,
    });
  });
  messages.slice(0, 5).forEach((m) => {
    activities.push({
      type: 'message',
      description: `AI message generated (${m.message_type})`,
      time: m.created_at,
    });
  });
  proposals.slice(0, 3).forEach((p) => {
    activities.push({
      type: 'proposal',
      description: `Proposal ${p.status}`,
      time: p.created_at,
    });
  });
  briefs.slice(0, 3).forEach((b) => {
    activities.push({
      type: 'brief',
      description: `Creative brief ${b.status}`,
      time: b.created_at,
    });
  });

  activities.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

  return NextResponse.json({
    leads: {
      totalSearches: searches.length,
      totalLeadsFound: searches.reduce((a, s) => a + (s.result_count || 0), 0),
      avgLeadsPerSearch: searches.length > 0
        ? Math.round(searches.reduce((a, s) => a + (s.result_count || 0), 0) / searches.length)
        : 0,
      topSearchQueries,
      leadsByDay: Object.entries(leadsByDay).map(([date, count]) => ({ date, count })),
    },
    outreach: {
      totalSent: outreach.length + messages.length,
      whatsappSent: outreach.filter((o) => o.type === 'whatsapp').length + messages.filter((m) => m.message_type === 'whatsapp').length,
      emailSent: outreach.filter((o) => o.type === 'email').length + messages.filter((m) => m.message_type === 'email').length,
      aiMessages: messages.length,
      outreachByDay: Object.entries({ ...outreachByDay, ...messagesByDay }).map(([date, count]) => ({ date, count })),
    },
    content: {
      totalGenerated: content.length,
      byPlatform: contentByPlatform,
      byType: contentByType,
    },
    credits: {
      totalSpent: Math.abs(credits.filter((t) => t.amount < 0).reduce((a, t) => a + t.amount, 0)),
      totalPurchased: credits.filter((t) => t.amount > 0).reduce((a, t) => a + t.amount, 0),
      currentBalance: balanceResult.data?.balance ?? 0,
      spendByFeature: Object.entries(spendByFeature)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8)
        .map(([feature, amount]) => ({ feature, amount })),
      spendByDay: Object.entries(creditsByDay).map(([date, amount]) => ({ date, amount })),
    },
    reminders: {
      total: reminders.length,
      pending: reminders.filter((r) => r.status === 'pending').length,
      done: reminders.filter((r) => r.status === 'done').length,
      overdue: reminders.filter(
        (r) => r.status === 'pending' && new Date(r.due_date) < new Date()
      ).length,
    },
    proposals: {
      total: proposals.length,
      sent: proposals.filter((p) => p.status === 'sent').length,
      accepted: proposals.filter((p) => p.status === 'accepted').length,
      conversionRate: proposals.length > 0
        ? Math.round((proposals.filter((p) => p.status === 'accepted').length / proposals.length) * 100)
        : 0,
    },
    briefs: {
      total: briefs.length,
      draft: briefs.filter((b) => b.status === 'draft').length,
      inProduction: briefs.filter((b) => b.status === 'in_production').length,
      completed: briefs.filter((b) => b.status === 'completed').length,
    },
    activity: activities.slice(0, 20),
  });
}
