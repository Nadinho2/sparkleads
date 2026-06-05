import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdmin } from '@/lib/supabase';
import { getToken } from '@/lib/auth';
import { aiGenerate } from '@/lib/ai-client';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const userToken = getToken();
  if (!userToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { proposalId } = await request.json();
  if (!proposalId) {
    return NextResponse.json({ error: 'proposalId required' }, { status: 400 });
  }

  const supabase = createSupabaseAdmin();

  const { data: proposal } = await supabase
    .from('proposals')
    .select('*, audit_reports(*)')
    .eq('id', proposalId)
    .eq('user_token', userToken)
    .single();

  if (!proposal) {
    return NextResponse.json({ error: 'Proposal not found' }, { status: 404 });
  }

  const audit = proposal.audit_reports;
  const criticalIssues = audit?.report_data?.critical_issues || [];
  const overallScore = audit?.overall_score || 0;

  const { data: lead } = await supabase
    .from('leads')
    .select('phone, name')
    .eq('id', proposal.lead_id)
    .single();

  const { data: settings } = await supabase
    .from('user_settings')
    .select('agency_name')
    .eq('user_token', userToken)
    .single();

  const agencyName = settings?.agency_name || 'our agency';

  const prompt = `Write a short WhatsApp cold outreach message for a digital agency.

BUSINESS: ${proposal.business_name}
AUDIT SCORE: ${overallScore}/100
CRITICAL ISSUES FOUND: ${criticalIssues.slice(0, 2).map((i: { issue: string }) => i.issue).join(', ') || 'digital presence issues'}
SERVICES BEING OFFERED: ${proposal.services?.map((s: { name: string }) => s.name).join(', ') || 'digital marketing services'}
AGENCY: ${agencyName}

Rules:
- Under 300 characters total
- Reference ONE specific issue found in their audit
- Sound like a real person who just noticed their website
- End with a soft CTA — not aggressive
- No "Dear Sir/Madam"
- No "I hope this message finds you well"
- Do not mention the score directly — describe the problem instead

Return ONLY the message text, nothing else.`;

  try {
    const { text: message } = await aiGenerate({
      prompt,
      temperature: 0.8,
      maxOutputTokens: 500,
    });

    return NextResponse.json({ message: message.trim(), phone: lead?.phone || null });
  } catch (err) {
    console.error('WhatsApp message generation failed:', err);
    return NextResponse.json({ error: 'Failed to generate message' }, { status: 500 });
  }
}
