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
  _messageType?: string
) {
  return leads.map((lead, index) => {
    const loc = lead.address ? `in ${lead.address.split(',')[0].trim()}` : '';
    const name = lead.name || 'there';
    const bizType = lead.type || 'business';

    let hook = '';
    let painPoint = '';
    if (!lead.website) {
      hook = `noticed that ${name} doesn't have an active website yet`;
      painPoint = `Most potential clients looking for ${bizType}s ${loc} search online first — having a modern site with direct booking/contact brings a steady flow of customers.`;
    } else if (lead.rating && lead.rating < 4.0) {
      hook = `noticed your Google profile rating is currently ${lead.rating}★`;
      painPoint = `A quick reputation boost with automated customer reviews can push your profile past 4.5★ and help you dominate local search rankings.`;
    } else {
      hook = `came across ${name} while searching top ${bizType} services ${loc}`;
      painPoint = `Your business has great potential to capture more clients online with a tailored digital presence.`;
    }

    const whatsapp = tone === 'bold'
      ? `Hi ${name}! ${hook}. ${serviceDescription}. We can have this live and delivering results in 5 days. Are you free for a quick 5-min chat?`
      : tone === 'professional'
      ? `Hello Team ${name}, I ${hook}. ${serviceDescription}. I would welcome the opportunity to share a brief proposal. Would you be open to a short call this week?`
      : `Hey ${name}! Hope things are going well ${loc}. I ${hook} and wanted to reach out. ${serviceDescription}. Would love to help you grow. Can I send over a quick preview?`;

    const emailSubject = !lead.website
      ? `Quick idea for ${name}'s website & online booking`
      : `Growth opportunity for ${name} ${loc}`;

    const emailBody = `Hi ${name},\n\nI was looking into ${bizType}s ${loc} and ${hook}.\n\n${painPoint}\n\n${serviceDescription}\n\nI would love to put together a complimentary quick mockup for ${name}. Would you be open to taking a look later this week?\n\nBest regards,\nOutreach Team`;

    return {
      lead_index: index,
      whatsapp_message: whatsapp.slice(0, 320),
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
    templateId?: string;
    saveAsTemplate?: boolean;
    templateName?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { leads, serviceDescription, tone, messageType, templateId, saveAsTemplate, templateName } = body;

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

  const prompt = `You are a cold outreach specialist.
Write personalized outreach messages for each business below.

THE AGENCY/SERVICE:
${serviceDescription.trim()}

TONE: ${tone || 'friendly'}
MESSAGE TYPE: ${messageType || 'whatsapp'}

IMPORTANT RULES:
- Each message must be unique — not a template
- Reference something specific about each business (their name, location, business type, rating if low)
- For businesses with NO website: mention that specifically as the pain point your service solves
- For businesses with LOW RATING (under 4.0): reference online reputation as the angle
- For businesses with NO EMAIL: make WhatsApp the only CTA
- Keep WhatsApp messages under 300 characters
- Keep email messages under 200 words
- Sound like a real person, not a robot
- Never use "I hope this message finds you well"
- Never use "Dear Sir/Madam"
- Open with something that shows you noticed THEM specifically

BUSINESSES:
${leadsList}

Return ONLY valid JSON array:
[
  {
    "lead_index": 0,
    "whatsapp_message": "Short personalized WhatsApp message under 300 chars",
    "email_subject": "Specific subject line",
    "email_body": "Personalized email body with line breaks using \\n",
    "personalization_hook": "What specific detail was used to personalize this"
  }
]

Generate exactly ${leads.length} messages, one per business.
Each must be genuinely different based on that business's specific details.`;

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
      systemInstruction: 'You write personalized cold outreach messages. Every message must feel handcrafted for that specific business. Return ONLY valid JSON.',
      temperature: 0.8,
      maxOutputTokens: 8192,
    });
  } catch (err) {
    console.warn('AI provider unavailable, utilizing fallback generation engine:', err);
    messages = generateFallbackMessages(
      leads,
      serviceDescription.trim(),
      tone || 'friendly',
      messageType || 'whatsapp'
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
    const { data: tmpl } = await supabase
      .from('ai_message_templates')
      .insert({
        id: uuidv4(),
        user_token: userToken,
        name: templateName.trim(),
        service_description: serviceDescription.trim(),
        tone: tone || 'friendly',
        message_type: messageType || 'whatsapp',
      })
      .select('id')
      .single();
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
      message_type: messageType || 'whatsapp',
      subject: r.emailSubject || null,
      body: messageType === 'email' ? r.emailBody : r.whatsappMessage,
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
