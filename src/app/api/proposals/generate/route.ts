import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdmin } from '@/lib/supabase';
import { getToken } from '@/lib/auth';
import { v4 as uuidv4 } from 'uuid';
import { aiGenerateJSON } from '@/lib/ai-client';

export const runtime = 'nodejs';

const CREDIT_COST = 5;



export async function POST(request: NextRequest) {
  const userToken = getToken();
  if (!userToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: {
    businessName?: string;
    auditReportId?: string;
    selectedServices?: string[];
    pricing?: { service: string; price: number; currency: string }[];
    agencyName?: string;
    agencyContact?: string;
    timeline?: string;
    customMessage?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { businessName, auditReportId, selectedServices, pricing, agencyName, agencyContact, timeline, customMessage } = body;

  if (!businessName?.trim()) {
    return NextResponse.json({ error: 'Business name is required' }, { status: 400 });
  }
  if (!selectedServices || selectedServices.length === 0) {
    return NextResponse.json({ error: 'Select at least one service' }, { status: 400 });
  }
  if (!agencyName?.trim()) {
    return NextResponse.json({ error: 'Agency name is required' }, { status: 400 });
  }

  const supabase = createSupabaseAdmin();

  // Check credits
  const { data: credits } = await supabase
    .from('user_credits')
    .select('balance')
    .eq('user_token', userToken)
    .single();

  if (!credits || credits.balance < CREDIT_COST) {
    return NextResponse.json(
      { error: 'Insufficient credits', required: CREDIT_COST, balance: credits?.balance ?? 0 },
      { status: 403 }
    );
  }

  // Load audit report if provided
  let auditData = null;
  if (auditReportId) {
    const { data } = await supabase
      .from('audit_reports')
      .select('*')
      .eq('id', auditReportId)
      .eq('user_token', userToken)
      .single();
    if (data) auditData = data;
  }

  // Format pricing for prompt
  const pricingText = (pricing || [])
    .map((p) => `- ${p.service}: ${p.currency} ${p.price.toLocaleString()}`)
    .join('\n');

  const totalPrice = (pricing || []).reduce((sum, p) => sum + p.price, 0);
  const currency = pricing?.[0]?.currency || 'NGN';

  // Generate proposal with AI
  let proposalContent: Record<string, unknown> | null = null;

  try {
    const prompt = `Generate a professional agency proposal for "${businessName}".

AGENCY: ${agencyName}
CONTACT: ${agencyContact || 'Not provided'}

AUDIT FINDINGS (what we found about their business):
${auditData ? JSON.stringify(auditData.report_data, null, 2) : 'No audit data — use a general approach for a local business looking to improve their digital presence.'}

SERVICES BEING OFFERED:
${selectedServices.join(', ')}

PRICING:
${pricingText}

TOTAL INVESTMENT: ${currency} ${totalPrice.toLocaleString()}

TIMELINE: ${timeline || 'To be discussed'}
CUSTOM MESSAGE: ${customMessage || 'None'}

Write a compelling, professional proposal that:
1. Opens with their specific problem (from audit findings if available)
2. Positions the agency as the expert solution
3. Clearly lists each service with value explanation
4. Presents the investment professionally
5. Includes a clear next steps section
6. Has a compelling closing

Tone: Professional, confident, results-focused.
DO NOT sound desperate or pushy.
DO sound like a premium agency that knows their value.

Return JSON with this exact format:
{
  "subject_line": "Proposal email subject line",
  "opening": "Personalized opening paragraph about their situation",
  "problem_statement": "What we found and why it matters to their business",
  "solution_overview": "How we solve it — 2-3 compelling sentences",
  "services": [
    {
      "name": "Service name",
      "description": "What this service includes in detail",
      "value_prop": "Why they specifically need this",
      "deliverables": ["deliverable 1", "deliverable 2", "deliverable 3"]
    }
  ],
  "timeline_overview": "Project timeline narrative explaining phases",
  "why_us": ["Reason 1 to choose this agency", "Reason 2", "Reason 3"],
  "next_steps": ["Step 1: What they do", "Step 2: What happens next", "Step 3: How we get started"],
  "closing": "Compelling closing paragraph with clear call to action",
  "ps_line": "Optional P.S. line for urgency or extra value"
}
Only return the JSON object, no other text.`;

    proposalContent = await aiGenerateJSON<Record<string, unknown>>({
      prompt,
      systemInstruction: 'You are a premium digital marketing agency. Write professional proposals that win clients. Return ONLY valid JSON.',
      temperature: 0.7,
      maxOutputTokens: 8192,
    });
  } catch (err) {
    console.error('AI proposal generation failed:', err);
  }

  // Fallback
  if (!proposalContent) {
    proposalContent = {
      subject_line: `Digital Marketing Proposal for ${businessName}`,
      opening: `We have prepared a comprehensive digital marketing proposal for ${businessName} to help grow your online presence and attract more customers.`,
      problem_statement: auditData
        ? 'Based on our audit, there are several key areas where your digital presence can be significantly improved.'
        : 'Every business today needs a strong digital presence to compete and grow. We have identified opportunities for improvement.',
      solution_overview: `Our team at ${agencyName} will implement a tailored digital marketing strategy designed specifically for ${businessName}. We focus on measurable results and transparent communication throughout the process.`,
      services: selectedServices.map((s) => ({
        name: s,
        description: `Professional ${s.toLowerCase()} service tailored for your business.`,
        value_prop: `This will help ${businessName} reach more customers and grow revenue.`,
        deliverables: ['Strategy document', 'Implementation', 'Monthly reporting'],
      })),
      timeline_overview: `We propose a ${timeline || 'phased'} approach to ensure quality delivery and measurable progress at each stage.`,
      why_us: [
        `${agencyName} has a proven track record of delivering results for local businesses.`,
        'We provide transparent reporting and regular communication.',
        'Our strategies are data-driven and tailored to your specific market.',
      ],
      next_steps: [
        'Schedule a discovery call to discuss your goals in detail',
        'Review and approve the proposal',
        'Sign the agreement and begin the onboarding process',
      ],
      closing: `We are excited about the opportunity to work with ${businessName}. Let us help you unlock your full digital potential. Contact us to get started.`,
      ps_line: `P.S. Businesses that act quickly on digital improvements see results faster. Let us schedule a call this week to discuss the next steps.`,
    };
  }

  // Save proposal
  const proposalId = uuidv4();
  await supabase.from('proposals').insert({
    id: proposalId,
    user_token: userToken,
    audit_report_id: auditReportId || null,
    business_name: businessName.trim(),
    services: selectedServices,
    pricing: pricing || [],
    proposal_data: {
      ...proposalContent,
      agency_name: agencyName,
      agency_contact: agencyContact,
      timeline,
      custom_message: customMessage,
      total_price: totalPrice,
      currency,
      audit_data: auditData?.report_data || null,
    },
    status: 'draft',
  });

  return NextResponse.json({
    success: true,
    proposalId,
    proposal: proposalContent,
    pricing,
    totalPrice,
    currency,
  });
}
