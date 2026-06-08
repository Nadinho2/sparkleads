import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdmin } from '@/lib/supabase';
import { getToken } from '@/lib/auth';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const userToken = getToken();
  if (!userToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type'); // filter by service type
  const limit = parseInt(searchParams.get('limit') || '50', 10);
  const offset = parseInt(searchParams.get('offset') || '0', 10);

  const supabase = createSupabaseAdmin();

  const items: Array<{
    id: string;
    type: string;
    title: string;
    subtitle?: string;
    credits: number;
    created_at: string;
    link?: string;
  }> = [];

  // Only fetch the types requested, or all if no filter
  const types = type ? [type] : ['search', 'grade', 'gbp', 'report', 'competitor', 'proposal', 'ad', 'message', 'content', 'brief'];

  const fetches = types.map(async (t) => {
    switch (t) {
      case 'search': {
        const { data } = await supabase
          .from('searches')
          .select('id, query, result_count, created_at')
          .eq('user_token', userToken)
          .order('created_at', { ascending: false })
          .limit(100);
        return (data || []).map((r) => ({
          id: r.id,
          type: 'search',
          title: r.query,
          subtitle: `${r.result_count} results`,
          credits: 1,
          created_at: r.created_at,
          link: `/history/${r.id}`,
        }));
      }
      case 'grade': {
        const { data } = await supabase
          .from('website_grades')
          .select('id, url, overall_score, created_at')
          .eq('user_token', userToken)
          .order('created_at', { ascending: false })
          .limit(100);
        return (data || []).map((r) => ({
          id: r.id,
          type: 'grade',
          title: r.url,
          subtitle: `Score: ${r.overall_score}/100`,
          credits: 2,
          created_at: r.created_at,
          link: `/audit/grade`,
        }));
      }
      case 'gbp': {
        const { data } = await supabase
          .from('gbp_audits')
          .select('id, business_name, location, overall_score, created_at')
          .eq('user_token', userToken)
          .order('created_at', { ascending: false })
          .limit(100);
        return (data || []).map((r) => ({
          id: r.id,
          type: 'gbp',
          title: r.business_name,
          subtitle: `GBP Audit — ${r.overall_score}/100`,
          credits: 3,
          created_at: r.created_at,
          link: `/audit/gbp`,
        }));
      }
      case 'report': {
        const { data } = await supabase
          .from('audit_reports')
          .select('id, business_name, overall_score, created_at')
          .eq('user_token', userToken)
          .order('created_at', { ascending: false })
          .limit(100);
        return (data || []).map((r) => ({
          id: r.id,
          type: 'report',
          title: r.business_name,
          subtitle: `Full Audit — ${r.overall_score}/100`,
          credits: 5,
          created_at: r.created_at,
          link: `/audit/report`,
        }));
      }
      case 'competitor': {
        const { data } = await supabase
          .from('competitor_analyses')
          .select('id, business_name, created_at')
          .eq('user_token', userToken)
          .order('created_at', { ascending: false })
          .limit(100);
        return (data || []).map((r) => ({
          id: r.id,
          type: 'competitor',
          title: r.business_name,
          subtitle: 'Competitor Analysis',
          credits: 4,
          created_at: r.created_at,
          link: `/audit/competitors`,
        }));
      }
      case 'proposal': {
        const { data } = await supabase
          .from('proposals')
          .select('id, business_name, status, created_at')
          .eq('user_token', userToken)
          .order('created_at', { ascending: false })
          .limit(100);
        return (data || []).map((r) => ({
          id: r.id,
          type: 'proposal',
          title: r.business_name,
          subtitle: `Proposal — ${r.status}`,
          credits: 5,
          created_at: r.created_at,
          link: `/proposals/${r.id}`,
        }));
      }
      case 'ad': {
        const { data } = await supabase
          .from('ad_plans')
          .select('id, business_name, created_at')
          .eq('user_token', userToken)
          .order('created_at', { ascending: false })
          .limit(100);
        return (data || []).map((r) => ({
          id: r.id,
          type: 'ad',
          title: r.business_name,
          subtitle: 'Ad Plan',
          credits: 5,
          created_at: r.created_at,
          link: `/ads/${r.id}`,
        }));
      }
      case 'message': {
        const { data } = await supabase
          .from('ai_message_templates')
          .select('id, lead_name, channel, created_at')
          .eq('user_token', userToken)
          .order('created_at', { ascending: false })
          .limit(100);
        return (data || []).map((r) => ({
          id: r.id,
          type: 'message',
          title: r.lead_name || 'AI Message',
          subtitle: `${r.channel} message`,
          credits: 1,
          created_at: r.created_at,
          link: `/messages`,
        }));
      }
      case 'content': {
        const { data } = await supabase
          .from('generated_content')
          .select('id, platform, content_type, created_at')
          .eq('user_token', userToken)
          .order('created_at', { ascending: false })
          .limit(100);
        return (data || []).map((r) => ({
          id: r.id,
          type: 'content',
          title: `${r.platform} ${r.content_type}`,
          subtitle: 'Content Generated',
          credits: 1,
          created_at: r.created_at,
          link: `/content`,
        }));
      }
      case 'brief': {
        const { data } = await supabase
          .from('creative_briefs')
          .select('id, business_name, created_at')
          .eq('user_token', userToken)
          .order('created_at', { ascending: false })
          .limit(100);
        return (data || []).map((r) => ({
          id: r.id,
          type: 'brief',
          title: r.business_name,
          subtitle: 'Creative Brief',
          credits: 5,
          created_at: r.created_at,
          link: `/briefs/${r.id}`,
        }));
      }
      default:
        return [];
    }
  });

  const results = await Promise.all(fetches);
  for (const batch of results) {
    items.push(...batch);
  }

  // Sort all items by created_at descending
  items.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  // Paginate
  const paginated = items.slice(offset, offset + limit);

  return NextResponse.json({
    items: paginated,
    total: items.length,
    hasMore: offset + limit < items.length,
  });
}
