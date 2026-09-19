import { aiGenerateJSON } from './ai-client';

export type ReplySentiment = 'interested' | 'neutral' | 'not_interested' | 'out_of_office';

export interface ReplyClassificationResult {
  sentiment: ReplySentiment;
  summary: string;
  suggestedReply: string;
  returnDate: string | null;
  confidence: number;
}

/**
 * Classifies an incoming prospect email reply using Gemini / DeepSeek.
 */
export async function classifyProspectReply(params: {
  replyText: string;
  subject?: string;
  senderEmail: string;
  recipientName?: string;
  companyName?: string;
}): Promise<ReplyClassificationResult> {
  const { replyText, subject = '', recipientName = '', companyName = '' } = params;

  // Fallback defaults if AI is unavailable or text is too short
  const fallback: ReplyClassificationResult = {
    sentiment: 'neutral',
    summary: replyText.slice(0, 100) || 'Received reply from prospect',
    suggestedReply: 'Thanks for getting back to me! What day works best for a quick 10-minute chat?',
    returnDate: null,
    confidence: 0.5,
  };

  if (!replyText || replyText.trim().length < 5) {
    return fallback;
  }

  // Quick heuristic for common out-of-office keywords before hitting AI
  const lower = (replyText + ' ' + subject).toLowerCase();
  const isOooQuick =
    lower.includes('out of office') ||
    lower.includes('away from my desk') ||
    lower.includes('automatic reply') ||
    lower.includes('on annual leave') ||
    lower.includes('maternity leave') ||
    lower.includes('paternity leave');

  const systemInstruction = `You are an elite B2B sales intelligence agent.
Your job is to analyze an incoming email response from a prospect and classify their intent accurately.

Output MUST be a single valid JSON object with EXACTLY these keys:
{
  "sentiment": "interested" | "neutral" | "not_interested" | "out_of_office",
  "summary": "1-sentence summary of the prospect's reply",
  "suggestedReply": "A concise, conversational 1-2 sentence response to move the conversation forward (or blank if not interested)",
  "returnDate": "YYYY-MM-DD or null if not applicable",
  "confidence": number between 0.0 and 1.0
}

Sentiment Definitions:
- "interested": Prospect wants pricing, asked for a phone call/demo/portfolio, asked a buying question, or showed positive engagement.
- "out_of_office": Automated vacation, medical leave, or away response. Extract return date if mentioned.
- "not_interested": Prospect said no, unsubscribed, asked to be removed, or declined services.
- "neutral": Inconclusive, generic acknowledgment, or asking who you are without rejecting.`;

  const prompt = `Analyze this incoming reply from prospect ${recipientName} at ${companyName}:
Subject: ${subject}
Email Content:
"""
${replyText.slice(0, 1500)}
"""`;

  try {
    const parsed = await aiGenerateJSON<{
      sentiment?: string;
      summary?: string;
      suggestedReply?: string;
      returnDate?: string | null;
      confidence?: number;
    }>({
      prompt,
      systemInstruction,
      temperature: 0.2,
      maxOutputTokens: 500,
    });

    return {
      sentiment: (['interested', 'neutral', 'not_interested', 'out_of_office'].includes(
        parsed.sentiment as any
      )
        ? parsed.sentiment
        : isOooQuick
        ? 'out_of_office'
        : 'neutral') as ReplySentiment,
      summary: parsed.summary || fallback.summary,
      suggestedReply: parsed.suggestedReply || fallback.suggestedReply,
      returnDate: parsed.returnDate || null,
      confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0.85,
    };
  } catch (err: any) {
    console.warn('[Reply Classifier] AI classification fallback used:', err?.message || err);
    if (isOooQuick) {
      return {
        ...fallback,
        sentiment: 'out_of_office',
        summary: 'Prospect sent an automated out-of-office reply',
      };
    }
    return fallback;
  }
}
