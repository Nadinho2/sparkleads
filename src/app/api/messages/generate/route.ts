import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdmin } from '@/lib/supabase';
import { getToken } from '@/lib/auth';
import { v4 as uuidv4 } from 'uuid';

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

function geminiTextFromResponse(data: unknown): string {
  const d = data as { candidates?: { content?: { parts?: { text?: string }[] } }[] };
  const parts = d?.candidates?.[0]?.content?.parts;
  if (!Array.isArray(parts)) return '';
  return parts.map((p) => p?.text || '').join('').trim();
}

function calculateCreditCost(leadCount: number): number {
  if (leadCount <= 1) return 2;
  if (leadCount <= 20) return 5;
  return Math.ceil(leadCount / 20) * 5;
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

  // Check credits
  const { data: credits } = await supabase
    .from('user_credits')
    .select('balance')
    .eq('user_token', userToken)
    .single();

  if (!credits || credits.balance < creditCost) {
    return NextResponse.json(
      { error: 'Insufficient credits', required: creditCost, balance: credits?.balance ?? 0 },
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
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'AI service not configured' }, { status: 500 });
    }

    const aiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          systemInstruction: {
            parts: [{
              text: `You write personalized cold outreach messages. Every message must feel handcrafted for that specific business. Reference their actual business details. Never use generic templates or corporate language.`,
            }],
          },
          generationConfig: {
            temperature: 0.8,
            maxOutputTokens: 8192,
            responseMimeType: 'application/json',
          },
        }),
      }
    );

    if (!aiResponse.ok) {
      throw new Error(`Gemini API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const text = geminiTextFromResponse(aiData);
    if (text) {
      messages = JSON.parse(text);
    }
  } catch (err) {
    console.error('AI message generation failed:', err);
    return NextResponse.json({ error: 'AI generation failed. Please try again.' }, { status: 500 });
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

  // Save generated messages
  const messageRecords = result
    .filter((r) => r.leadId)
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
    await supabase.rpc('increment_template_count', { template_id: savedTemplateId }).catch(() => {
      // RPC might not exist, update manually
      supabase
        .from('ai_message_templates')
        .update({ generated_count: supabase.rpc ? undefined : 1 })
        .eq('id', savedTemplateId)
        .catch(() => {});
    });
  }

  // Deduct credits
  const newBalance = credits.balance - creditCost;
  await supabase
    .from('user_credits')
    .update({ balance: newBalance, updated_at: new Date().toISOString() })
    .eq('user_token', userToken);

  await supabase.from('credit_transactions').insert({
    user_token: userToken,
    type: 'usage',
    amount: -creditCost,
    description: `AI messages for ${leads.length} lead${leads.length > 1 ? 's' : ''}`,
    balance_after: newBalance,
  });

  return NextResponse.json({
    success: true,
    messages: result,
    creditsUsed: creditCost,
  });
}
