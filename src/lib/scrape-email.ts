const BLOCKED_DOMAINS = [
  'example.com',
  'placeholder',
  'sentry.io',
  'wixpress.com',
  'wordpress.com',
  'gravatar.com',
  'googleapis.com',
  'gstatic.com',
  'facebook.com',
  'twitter.com',
  'instagram.com',
  'youtube.com',
  'linkedin.com',
  'pinterest.com',
  'tiktok.com',
  'sentry.io',
  'cloudflare.com',
];

const BLOCKED_EMAIL_PATTERNS = [
  'example',
  'placeholder',
  '.png',
  '.jpg',
  '.jpeg',
  '.gif',
  '.svg',
  '.webp',
  'sentry',
  'wixpress',
  'noreply',
  'no-reply',
  'donotreply',
  'mailer-daemon',
  'postmaster',
  'abuse@',
  'admin@',
  'webmaster@',
];

function isValidEmail(email: string): boolean {
  const lower = email.toLowerCase();

  // Check basic format
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(lower)) return false;

  // Check blocked domains
  const domain = lower.split('@')[1];
  if (BLOCKED_DOMAINS.some((d) => domain === d || domain.endsWith('.' + d))) {
    return false;
  }

  // Check blocked patterns
  if (BLOCKED_EMAIL_PATTERNS.some((pattern) => lower.includes(pattern))) {
    return false;
  }

  return true;
}

function extractEmailsFromText(text: string): string[] {
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  const matches = text.match(emailRegex) || [];
  return matches.filter(isValidEmail);
}

export async function scrapeEmail(url: string): Promise<string | null> {
  try {
    // Validate URL
    const parsed = new URL(url);
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return null;
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
    });

    clearTimeout(timeout);

    if (!response.ok) {
      return null;
    }

    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('text/html') && !contentType.includes('text/plain')) {
      return null;
    }

    const html = await response.text();

    // 1. Extract from mailto: links (highest priority)
    const mailtoRegex = /mailto:([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/gi;
    const mailtoMatches = html.match(mailtoRegex) || [];
    for (const match of mailtoMatches) {
      const email = match.replace('mailto:', '').split('?')[0].trim();
      if (isValidEmail(email)) {
        return email.toLowerCase();
      }
    }

    // 2. Extract from JSON-LD structured data
    const jsonLdRegex = /<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi;
    const jsonLdMatches = html.match(jsonLdRegex) || [];
    for (const match of jsonLdMatches) {
      try {
        const jsonStr = match.replace(/<script[^>]*>/, '').replace(/<\/script>/, '');
        const data = JSON.parse(jsonStr);
        const emails = findEmailsInObject(data);
        for (const email of emails) {
          if (isValidEmail(email)) {
            return email.toLowerCase();
          }
        }
      } catch {
        // Skip invalid JSON
      }
    }

    // 3. Extract from visible text (strip HTML tags)
    const textOnly = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ');

    const textEmails = extractEmailsFromText(textOnly);
    if (textEmails.length > 0) {
      // Prefer emails from the page domain
      const domain = parsed.hostname.replace('www.', '');
      const domainMatch = textEmails.find(e => e.toLowerCase().includes(domain));
      return (domainMatch || textEmails[0]).toLowerCase();
    }

    return null;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.error(`Email scrape timeout for ${url}`);
    } else {
      console.error(`Email scrape error for ${url}:`, error);
    }
    return null;
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function findEmailsInObject(obj: any): string[] {
  const emails: string[] = [];

  if (typeof obj === 'string') {
    const found = extractEmailsFromText(obj);
    emails.push(...found);
  } else if (Array.isArray(obj)) {
    for (const item of obj) {
      emails.push(...findEmailsInObject(item));
    }
  } else if (obj && typeof obj === 'object') {
    for (const key of Object.keys(obj)) {
      if (key.toLowerCase().includes('email')) {
        const val = obj[key];
        if (typeof val === 'string' && isValidEmail(val)) {
          emails.push(val);
        }
      } else {
        emails.push(...findEmailsInObject(obj[key]));
      }
    }
  }

  return emails;
}
