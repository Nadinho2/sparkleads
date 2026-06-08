import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdmin } from '@/lib/supabase';
import { getToken } from '@/lib/auth';
import { v4 as uuidv4 } from 'uuid';
import { aiGenerateJSON } from '@/lib/ai-client';

export const runtime = 'nodejs';

const CREDIT_COST = 10;



interface ReportContent {
  executive_summary: string;
  health_status: string;
  critical_issues: { issue: string; impact: string; urgency: string }[];
  improvement_areas: { area: string; current: string; target: string }[];
  working_well: string[];
  action_plan: { step: number; action: string; timeline: string; expected_outcome: string }[];
  roi_justification: string;
  closing_pitch: string;
}

async function runInternalApi(path: string, body: Record<string, unknown>, cookie: string) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const res = await fetch(`${baseUrl}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: `sparkleads_token=${cookie}`,
    },
    body: JSON.stringify(body),
  });
  return res.json();
}

export async function POST(request: NextRequest) {
  const userToken = getToken();
  if (!userToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: {
    businessName?: string;
    websiteUrl?: string;
    location?: string;
    phone?: string;
    leadId?: string;
    websiteGradeId?: string;
    gbpAuditId?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { businessName, websiteUrl, location, phone, leadId, websiteGradeId, gbpAuditId } = body;

  if (!businessName?.trim()) {
    return NextResponse.json({ error: 'Business name is required' }, { status: 400 });
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

  // Load or run website grade
  let websiteGrade: Record<string, unknown> | null = null;
  let websiteGradeIdToSave: string | null = null;

  if (websiteGradeId) {
    const { data } = await supabase
      .from('website_grades')
      .select('*')
      .eq('id', websiteGradeId)
      .eq('user_token', userToken)
      .single();
    if (data) {
      websiteGrade = data;
      websiteGradeIdToSave = data.id;
    }
  } else if (websiteUrl) {
    try {
      const gradeResult = await runInternalApi(
        '/api/audit/grade-website',
        { url: websiteUrl, businessName: businessName.trim() },
        userToken
      );
      if (gradeResult.success) {
        websiteGrade = gradeResult;
        websiteGradeIdToSave = gradeResult.gradeId || null;
      }
    } catch (err) {
      console.error('Website grade failed:', err);
    }
  }

  // Load or run GBP audit
  let gbpAudit: Record<string, unknown> | null = null;
  let gbpAuditIdToSave: string | null = null;

  if (gbpAuditId) {
    const { data } = await supabase
      .from('gbp_audits')
      .select('*')
      .eq('id', gbpAuditId)
      .eq('user_token', userToken)
      .single();
    if (data) {
      gbpAudit = data;
      gbpAuditIdToSave = data.id;
    }
  } else {
    try {
      const gbpResult = await runInternalApi(
        '/api/audit/gbp',
        { businessName: businessName.trim(), location: location?.trim() },
        userToken
      );
      if (gbpResult.success) {
        gbpAudit = gbpResult;
        gbpAuditIdToSave = gbpResult.auditId || null;
      }
    } catch (err) {
      console.error('GBP audit failed:', err);
    }
  }

  // Calculate overall score
  const websiteScore = (websiteGrade?.overallScore as number) || 0;
  const gbpScore = (gbpAudit?.overallScore as number) || 0;
  const hasWebsite = !!websiteGrade;
  const overallScore = hasWebsite
    ? Math.round(websiteScore * 0.5 + gbpScore * 0.5)
    : gbpScore;

  // Generate AI report
  let reportContent: ReportContent | null = null;

  try {
    const prompt = `Generate a professional digital audit report for "${businessName}".

WEBSITE AUDIT:
Score: ${websiteGrade?.overallScore || 'No website'}/100
Checks: ${JSON.stringify(websiteGrade?.breakdown || {})}

GOOGLE BUSINESS PROFILE:
Score: ${gbpAudit?.overallScore || 0}/100
Checks: ${JSON.stringify(gbpAudit?.breakdown || {})}

Generate a professional report that:
1. Executive summary (what we found, overall health)
2. Critical issues (score 0-30) that need immediate attention
3. Improvement areas (score 31-69) to optimize
4. What's working well (score 70-100) to maintain
5. Priority action plan (top 5 actions in order)
6. ROI justification (why fixing this matters in business terms)
7. Closing pitch (subtle — position the agency as the solution)

Tone: Professional, data-driven, consultative.
Write as if from a professional digital marketing agency.
Use specific numbers and findings from the audit data.

Return JSON with this exact format:
{
  "executive_summary": "2-3 paragraph professional summary",
  "health_status": "Critical | Needs Improvement | Good | Excellent",
  "critical_issues": [
    { "issue": "Issue title", "impact": "Business impact description", "urgency": "Immediate" }
  ],
  "improvement_areas": [
    { "area": "Area name", "current": "Current state", "target": "Target state" }
  ],
  "working_well": ["Item 1", "Item 2"],
  "action_plan": [
    { "step": 1, "action": "What to do", "timeline": "When", "expected_outcome": "Result" }
  ],
  "roi_justification": "Why this matters to the bottom line",
  "closing_pitch": "Professional closing paragraph"
}
Only return the JSON object, no other text.`;

    reportContent = await aiGenerateJSON<ReportContent>({
      prompt,
      systemInstruction: 'You are a professional digital marketing consultant generating audit reports. Return ONLY valid JSON.',
      temperature: 0.5,
      maxOutputTokens: 8192,
    });
  } catch (err) {
    console.error('AI report generation failed:', err);
  }

  // Fallback report
  if (!reportContent) {
    const hasIssues = websiteScore < 70 || gbpScore < 70;
    reportContent = {
      executive_summary: `We conducted a comprehensive digital presence audit for ${businessName}. ${hasWebsite ? `The website scored ${websiteScore}/100.` : 'No website was found.'} The Google Business Profile scored ${gbpScore}/100. ${hasIssues ? 'Several critical areas need attention to improve online visibility and customer acquisition.' : 'The digital presence is in good shape with some opportunities for optimization.'}`,
      health_status: overallScore >= 80 ? 'Excellent' : overallScore >= 60 ? 'Good' : overallScore >= 40 ? 'Needs Improvement' : 'Critical',
      critical_issues: [],
      improvement_areas: [],
      working_well: [],
      action_plan: [
        { step: 1, action: 'Optimize Google Business Profile', timeline: 'Week 1-2', expected_outcome: 'Improved local search visibility' },
        { step: 2, action: 'Collect customer reviews', timeline: 'Week 2-4', expected_outcome: 'Higher trust and rankings' },
        { step: 3, action: 'Improve website performance', timeline: 'Month 2', expected_outcome: 'Better user experience' },
        { step: 4, action: 'Add professional photos', timeline: 'Month 2', expected_outcome: '42% more direction requests' },
        { step: 5, action: 'Monitor and iterate', timeline: 'Ongoing', expected_outcome: 'Sustained growth' },
      ],
      roi_justification: `Improving your digital presence directly impacts revenue. Businesses with optimized Google profiles get 7x more clicks, and websites that load in under 3 seconds retain 53% more visitors.`,
      closing_pitch: `A strong digital presence is no longer optional — it's essential. We recommend addressing the critical issues immediately and working through the action plan over the next 90 days.`,
    };
  }

  // Save report
  const reportId = uuidv4();
  await supabase.from('audit_reports').insert({
    id: reportId,
    user_token: userToken,
    lead_id: leadId || null,
    business_name: businessName.trim(),
    location: location?.trim() || null,
    website_grade_id: websiteGradeIdToSave,
    gbp_audit_id: gbpAuditIdToSave,
    overall_score: overallScore,
    report_data: {
      website_grade: websiteGrade,
      gbp_audit: gbpAudit,
      report_content: reportContent,
      phone,
      website_url: websiteUrl,
      generated_at: new Date().toISOString(),
    },
  });

  return NextResponse.json({
    success: true,
    reportId,
    overallScore,
    websiteScore,
    gbpScore,
    report: reportContent,
    websiteGrade,
    gbpAudit,
  });
}
