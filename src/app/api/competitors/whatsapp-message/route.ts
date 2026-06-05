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

  const { competitorAnalysisId } = await request.json();
  if (!competitorAnalysisId) {
    return NextResponse.json({ error: 'competitorAnalysisId required' }, { status: 400 });
  }

  const supabase = createSupabaseAdmin();

  const { data: analysis } = await supabase
    .from('competitor_analyses')
    .select('*')
    .eq('id', competitorAnalysisId)
    .eq('user_token', userToken)
    .single();

  if (!analysis) {
    return NextResponse.json({ error: 'Analysis not found' }, { status: 404 });
  }

  const analysisData = analysis.analysis_data || {};
  const competitors = analysisData.competitors || [];
  const weaknesses: string[] = analysisData.analysis?.weaknesses || [];
  const opportunities: string[] = analysisData.analysis?.opportunities || [];
  const marketRank = analysisData.analysis?.market_rank || '?';

  const { data: lead } = await supabase
    .from('leads')
    .select('phone, name')
    .eq('id', analysis.lead_id)
    .single();

  const { data: settings } = await supabase
    .from('user_settings')
    .select('agency_name')
    .eq('user_token', userToken)
    .single();

  const agencyName = settings?.agency_name || 'our agency';

  const prompt = `Write a WhatsApp message for a digital agency reaching out to this business.

BUSINESS: ${analysis.business_name}
COMPETITIVE POSITION: Ranked #${marketRank} of ${competitors.length + 1}
KEY WEAKNESS: ${weaknesses[0] || 'behind competitors online'}
TOP OPPORTUNITY: ${opportunities[0] || 'improve digital presence'}
AGENCY: ${agencyName}

Rules:
- Under 300 characters
- Reference their competitive position WITHOUT revealing you ran analysis
  (e.g. "I noticed your competitors in ${analysis.location || 'your area'} are getting more Google reviews")
- Make it feel like you noticed something specific about them
- Soft CTA only
- No "Dear Sir/Madam" or "I hope this message finds you well"

Return ONLY the message text.`;

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
