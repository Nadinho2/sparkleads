import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdmin } from '@/lib/supabase';
import { getToken } from '@/lib/auth';
import { v4 as uuidv4 } from 'uuid';
import { aiGenerateJSON } from '@/lib/ai-client';
import { deductCredits } from '@/lib/credits';

export const runtime = 'nodejs';

interface LeadInput {
  id?: string;
  name: string;
  type?: string;
  address?: string;
  rating?: number | null;
  website?: string | null;
  email?: string | null;
  phone?: string | null;
}

function calculateCreditCost(leadCount: number): number {
  if (leadCount <= 1) return 2;
  if (leadCount <= 20) return 5;
  return Math.ceil(leadCount / 20) * 5;
}

function generateFallbackMessages(
  leads: LeadInput[],
  serviceDescription: string,
  tone: string,
  _messageType?: string,
  senderName?: string,
  portfolioUrl?: string,
  caseStudyMetric?: string
) {
  return leads.map((lead, index) => {
    const loc = lead.address ? `in ${lead.address.split(',')[0].trim()}` : '';
    const name = lead.name || 'there';
    const bizType = lead.type || 'operations';
    const sender = senderName?.trim() || 'Outreach Specialist';

    // Normalize service statement to avoid awkward repetition
    let serviceStatement = serviceDescription.trim().replace(/\.+$/, '');
    if (!/^(we|i|our team)\b/i.test(serviceStatement)) {
      serviceStatement = `We specialize in ${serviceStatement}`;
    }

    // Normalize proof metric statement to avoid duplicate subject phrases
    let rawProof = (caseStudyMetric?.trim() || 'reclaimed 15+ hours per week, eliminated costly human errors in data handling, and reduced operational overhead by significant margins').replace(/\.+$/, '');
    let proofStatement = rawProof;
    if (!/^(recent clients|clients|our clients|teams|we)\b/i.test(rawProof)) {
      proofStatement = `Recent clients have ${rawProof}`;
    }

    const proofLink = portfolioUrl?.trim() ? `\n\nYou can see examples of my work here: ${portfolioUrl.trim()}` : '';

    let hook = '';
    let workflowNoun = `${bizType.toLowerCase()} workflow`;
    if (!lead.website) {
      hook = `noticed ${name} doesn't have an active website or direct online booking setup yet`;
      workflowNoun = 'client booking and online workflow';
    } else if (lead.rating && lead.rating < 4.0) {
      hook = `noticed your Google profile rating is currently ${lead.rating}★`;
      workflowNoun = 'customer retention and review workflow';
    } else {
      hook = `came across ${name} while looking into top ${bizType.toLowerCase()} services ${loc}`;
      workflowNoun = `${bizType.toLowerCase()} operations`;
    }

    const cleanSubjectNiche = workflowNoun.replace(/\s+(operations|workflow)\s+(operations|workflow)$/i, ' $1');
    const emailSubject = `quick question regarding ${name} ${cleanSubjectNiche}`;

    const whatsapp = tone === 'bold'
      ? `Hi ${name}! ${hook}. ${serviceStatement}. ${proofStatement}. Would you be open to a quick 2-min walkthrough showing how this works for your ${workflowNoun}? ${portfolioUrl ? portfolioUrl.trim() : ''}`
      : `Hey ${name}! ${hook}. ${serviceStatement}. ${proofStatement}. Would you be open to a quick 2-minute walkthrough tailored to your workflow?`;

    const emailBody = `Hi ${name},\n\nI was looking into ${bizType.toLowerCase()} providers ${loc} and ${hook}.\n\n${serviceStatement}. ${proofStatement}, directly increasing their overall ROI.${proofLink}\n\nWould you be open to a quick 2-minute walkthrough showing how this could work specifically for your ${workflowNoun}? I can share a practical example relevant to your workflow.\n\nBest regards,\n${sender}`;

    return {
      lead_index: index,
      whatsapp_message: whatsapp.slice(0, 300),
      email_subject: emailSubject,
      email_body: emailBody,
      personalization_hook: hook,
    };
  });
}

export async function POST(request: NextRequest) {
  const userToken = getToken();
  if (!userToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: {
    leads?: LeadInput[];
    serviceDescription?: string;
    tone?: string;
    messageType?: string;
    senderName?: string;
    portfolioUrl?: string;
    caseStudyMetric?: string;
    templateId?: string;
    saveAsTemplate?: boolean;
    templateName?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const {
    leads,
    serviceDescription,
    tone,
    messageType,
    senderName,
    portfolioUrl,
    caseStudyMetric,
    templateId,
    saveAsTemplate,
    templateName,
  } = body;

  if (!leads || leads.length === 0) {
    return NextResponse.json({ error: 'Select at least one lead' }, { status: 400 });
  }
  if (!serviceDescription?.trim()) {
    return NextResponse.json({ error: 'Service description is required' }, { status: 400 });
  }

  const creditCost = calculateCreditCost(leads.length);
  const supabase = createSupabaseAdmin();

  // Check and deduct credits
  const creditResult = await deductCredits(userToken, creditCost, `AI messages for ${leads.length} leads`);
  if (!creditResult.success) {
    return NextResponse.json(
      { error: creditResult.error, required: creditResult.required, balance: creditResult.balance },
      { status: 403 }
    );
  }

  // Build prompt
  const leadsList = leads.map((lead, i) => `
${i + 1}. Name: ${lead.name}
   Type: ${lead.type || 'business'}
   Location: ${lead.address || 'Unknown'}
   Rating: ${lead.rating ? lead.rating + ' stars' : 'Not rated'}
   Has website: ${lead.website ? 'Yes' : 'No'}
   Has email: ${lead.email ? 'Yes' : 'No'}
   Phone: ${lead.phone || 'Unknown'}`).join('');

  const prompt = `You are an elite B2B cold outreach specialist known for writing high-converting, human, and low-friction emails and messages that decision-makers actually reply to.

SENDER CONTEXT:
- Sender Name: ${senderName?.trim() || 'The Founder / Lead Specialist'}
- What the Sender Offers: ${serviceDescription.trim()}
${portfolioUrl?.trim() ? `- Portfolio / Live Work Link: ${portfolioUrl.trim()}` : ''}
${caseStudyMetric?.trim() ? `- Key Proof / Case Study Metric: ${caseStudyMetric.trim()}` : ''}
- Tone: ${tone || 'friendly'}
- Message Type: ${messageType || 'email'}

COLD EMAIL FORMULA (Follow this exact winning structure for every single email):
1. SPECIFIC OBSERVATION / WORKFLOW HOOK:
   - Identify the business's operational workflow (e.g. freight operations, patient scheduling, customer bookings, dispatch, salon walk-ins, property management).
   - Reference something specific about each business (name, city, niche, or rating).
   - NEVER use "I hope this message finds you well" or "Dear Sir/Madam".
   - Sound like an observant peer, not a generic robot.

2. QUANTIFIABLE SOCIAL PROOF & ROI:
   - Mention concrete, tangible business results ${caseStudyMetric?.trim() ? `such as "${caseStudyMetric.trim()}"` : `(e.g., "Recent clients have seen 15+ hours per week reclaimed, eliminated costly human errors in data handling, reduced operational overhead by significant margins, and improved response times which directly increased their ROI")`}.
   - Never use empty buzzwords like "supercharge your growth" or "take your business to the next level".

3. PROOF ASSET / PORTFOLIO DROP:
   ${portfolioUrl?.trim()
     ? `- Seamlessly include the live proof link: "You can see examples of my work here: ${portfolioUrl.trim()}"`
     : '- Mention that you can share a practical example or 1-page breakdown tailored to their workflow.'}

4. LOW-FRICTION 2-MINUTE CTA:
   - Do NOT ask for a 30-minute call, zoom meeting, or pitch.
   - Use a low-friction micro-commitment:
     "Would you be open to a quick 2-minute walkthrough showing how this could work specifically for your [operations/workflow]? I can share a practical example relevant to your workflow."

5. HUMAN SIGN-OFF:
   - Always sign off with:
     Best regards,
     ${senderName?.trim() || 'Chibueze Amuchie'}

6. EMAIL LENGTH & DELIVERABILITY:
   - Keep email under 120-160 words.
   - Use natural lowercase or conversational subject lines (e.g., "quick question regarding {business_name}", "{business_name} operations", "2-min idea for {business_name}"). Avoid exclamation marks and spam words.

WHATSAPP RULES (if generating WhatsApp):
- Under 280 characters.
- Conversational and personal.
${portfolioUrl?.trim() ? `- Include ${portfolioUrl.trim()} if natural.` : ''}

TARGET BUSINESSES:
${leadsList}

Return ONLY a valid JSON array:
[
  {
    "lead_index": 0,
    "whatsapp_message": "Conversational WhatsApp message under 280 chars",
    "email_subject": "Low-key conversational subject line",
    "email_body": "Personalized high-converting email using the exact formula above with \\n line breaks",
    "personalization_hook": "Specific operational detail used"
  }
]

Generate exactly ${leads.length} messages, one per business.`;

  let messages: {
    lead_index: number;
    whatsapp_message: string;
    email_subject: string;
    email_body: string;
    personalization_hook: string;
  }[] = [];

  try {
    messages = await aiGenerateJSON<typeof messages>({
      prompt,
      systemInstruction: 'You write elite, high-converting cold outreach messages. Every email must feel handcrafted, provide tangible social proof, and offer a low-friction 2-minute walkthrough. Return ONLY valid JSON.',
      temperature: 0.7,
      maxOutputTokens: 8192,
    });
  } catch (err) {
    console.warn('AI provider unavailable, utilizing fallback generation engine:', err);
    messages = generateFallbackMessages(
      leads,
      serviceDescription.trim(),
      tone || 'friendly',
      messageType || 'email',
      senderName,
      portfolioUrl,
      caseStudyMetric
    );
  }

  // Map messages back to leads
  const result = messages.map((msg, i) => ({
    leadId: leads[i]?.id || null,
    leadName: leads[i]?.name || 'Unknown',
    leadType: leads[i]?.type || '',
    leadAddress: leads[i]?.address || '',
    leadRating: leads[i]?.rating || null,
    whatsappMessage: msg.whatsapp_message || '',
    emailSubject: msg.email_subject || '',
    emailBody: msg.email_body || '',
    personalizationHook: msg.personalization_hook || '',
  }));

  // Save template if requested
  let savedTemplateId = templateId || null;
  if (saveAsTemplate && templateName?.trim()) {
    const templateData: Record<string, unknown> = {
      id: uuidv4(),
      user_token: userToken,
      name: templateName.trim(),
      service_description: serviceDescription.trim(),
      tone: tone || 'friendly',
      message_type: messageType || 'email',
    };
    if (senderName) templateData.sender_name = senderName.trim();
    if (portfolioUrl) templateData.portfolio_url = portfolioUrl.trim();
    if (caseStudyMetric) templateData.case_study_metric = caseStudyMetric.trim();

    let { data: tmpl, error: tmplError } = await supabase
      .from('ai_message_templates')
      .insert(templateData)
      .select('id')
      .single();

    // Gracefully retry without extended columns if table has not been migrated yet
    if (tmplError && (senderName || portfolioUrl || caseStudyMetric)) {
      delete templateData.sender_name;
      delete templateData.portfolio_url;
      delete templateData.case_study_metric;
      const retry = await supabase
        .from('ai_message_templates')
        .insert(templateData)
        .select('id')
        .single();
      tmpl = retry.data;
    }

    if (tmpl) savedTemplateId = tmpl.id;
  }

  // Save generated messages (skip manual leads that don't exist in DB)
  const messageRecords = result
    .filter((r) => r.leadId && !String(r.leadId).startsWith('manual-'))
    .map((r) => ({
      id: uuidv4(),
      user_token: userToken,
      template_id: savedTemplateId,
      lead_id: r.leadId,
      message_type: messageType || 'email',
      subject: r.emailSubject || null,
      body: messageType === 'whatsapp' ? r.whatsappMessage : r.emailBody,
      used: false,
      sent: false,
    }));

  if (messageRecords.length > 0) {
    await supabase.from('ai_generated_messages').insert(messageRecords);
  }

  // Update template usage count
  if (savedTemplateId) {
    try {
      const { data: tmpl } = await supabase
        .from('ai_message_templates')
        .select('generated_count')
        .eq('id', savedTemplateId)
        .single();
      if (tmpl) {
        await supabase
          .from('ai_message_templates')
          .update({ generated_count: (tmpl.generated_count || 0) + 1 })
          .eq('id', savedTemplateId);
      }
    } catch { /* ignore */ }
  }

  return NextResponse.json({
    success: true,
    messages: result,
    creditsUsed: creditCost,
  });
}
