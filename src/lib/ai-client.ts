/**
 * Shared AI client — routes to DeepSeek (preferred) or Gemini (fallback).
 *
 * Set DEEPSEEK_API_KEY in .env.local to use DeepSeek.
 * Set GEMINI_API_KEY in .env.local to use Gemini.
 * If both are set, DeepSeek wins.
 */

export type AIProvider = 'deepseek' | 'gemini';

export interface AIGenerateOptions {
  prompt: string;
  systemInstruction?: string;
  temperature?: number;
  maxOutputTokens?: number;
  jsonMode?: boolean;
  maxRetries?: number;
}

export interface AIResponse {
  text: string;
  provider: AIProvider;
}

function getProvider(): { provider: AIProvider; apiKey: string } | null {
  const deepseekKey = process.env.DEEPSEEK_API_KEY;
  if (deepseekKey) return { provider: 'deepseek', apiKey: deepseekKey };

  const geminiKey = process.env.GEMINI_API_KEY;
  if (geminiKey) return { provider: 'gemini', apiKey: geminiKey };

  return null;
}

function extractGeminiText(data: unknown): string {
  const d = data as { candidates?: { content?: { parts?: { text?: string }[] } }[] };
  const parts = d?.candidates?.[0]?.content?.parts;
  if (!Array.isArray(parts)) return '';
  return parts.map((p) => p?.text || '').join('').trim();
}

async function callDeepSeek(
  apiKey: string,
  opts: AIGenerateOptions
): Promise<string> {
  const messages: { role: string; content: string }[] = [];
  if (opts.systemInstruction) {
    messages.push({ role: 'system', content: opts.systemInstruction });
  }
  messages.push({ role: 'user', content: opts.prompt });

  const body: Record<string, unknown> = {
    model: 'deepseek-chat',
    messages,
    temperature: opts.temperature ?? 0.7,
    max_tokens: opts.maxOutputTokens ?? 8192,
  };

  if (opts.jsonMode) {
    body.response_format = { type: 'json_object' };
  }

  const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errBody = await response.text().catch(() => '');
    throw new Error(`DeepSeek API error: ${response.status} - ${errBody.slice(0, 200)}`);
  }

  const data = await response.json();
  const text = data?.choices?.[0]?.message?.content || '';
  return text.trim();
}

async function callGemini(
  apiKey: string,
  opts: AIGenerateOptions
): Promise<string> {
  const contents: { role: string; parts: { text: string }[] }[] = [
    { role: 'user', parts: [{ text: opts.prompt }] },
  ];

  const body: Record<string, unknown> = {
    contents,
    generationConfig: {
      temperature: opts.temperature ?? 0.7,
      maxOutputTokens: opts.maxOutputTokens ?? 8192,
      ...(opts.jsonMode ? { responseMimeType: 'application/json' } : {}),
    },
  };

  if (opts.systemInstruction) {
    body.systemInstruction = { parts: [{ text: opts.systemInstruction }] };
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }
  );

  if (!response.ok) {
    const errBody = await response.text().catch(() => '');
    throw new Error(`Gemini API error: ${response.status} - ${errBody.slice(0, 200)}`);
  }

  const data = await response.json();
  return extractGeminiText(data);
}

/**
 * Generate text/JSON from the best available AI provider.
 * Retries on 429/503 with exponential backoff.
 */
export async function aiGenerate(opts: AIGenerateOptions): Promise<AIResponse> {
  const config = getProvider();
  if (!config) {
    throw new Error('No AI API key configured. Set DEEPSEEK_API_KEY or GEMINI_API_KEY in .env.local');
  }

  const maxRetries = opts.maxRetries ?? 3;
  let lastError = '';

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    if (attempt > 0) {
      await new Promise((r) => setTimeout(r, attempt * 2000 + Math.random() * 1000));
    }

    try {
      const text = config.provider === 'deepseek'
        ? await callDeepSeek(config.apiKey, opts)
        : await callGemini(config.apiKey, opts);

      if (!text) throw new Error('AI returned empty response');
      return { text, provider: config.provider };
    } catch (err) {
      lastError = err instanceof Error ? err.message : String(err);
      console.error(`AI attempt ${attempt + 1} (${config.provider}) failed:`, lastError.slice(0, 200));

      // Only retry on rate limit / server errors
      if (!lastError.includes('429') && !lastError.includes('503') && !lastError.includes('500')) break;
    }
  }

  throw new Error(lastError || 'AI service temporarily unavailable');
}

/**
 * Convenience: generate and parse JSON in one call.
 */
export async function aiGenerateJSON<T = unknown>(opts: AIGenerateOptions): Promise<T> {
  const { text } = await aiGenerate({ ...opts, jsonMode: true });

  // Try to extract JSON from response (some models wrap in markdown code blocks)
  let jsonStr = text;
  const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) {
    jsonStr = jsonMatch[1].trim();
  }

  return JSON.parse(jsonStr) as T;
}

/** Check which provider is active (for logging/display) */
export function getActiveProvider(): AIProvider | null {
  return getProvider()?.provider ?? null;
}
