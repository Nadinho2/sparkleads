import puppeteer from 'puppeteer';

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
];

function isValidEmail(email: string): boolean {
  const lower = email.toLowerCase();
  return !BLOCKED_DOMAINS.some((domain) => lower.includes(domain));
}

export async function scrapeEmail(url: string): Promise<string | null> {
  let browser;
  try {
    browser = await puppeteer.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
      headless: true,
      timeout: 10000,
    });

    const page = await browser.newPage();

    await page.setRequestInterception(true);
    page.on('request', (req) => {
      if (['image', 'stylesheet', 'font', 'media'].includes(req.resourceType())) {
        req.abort();
      } else {
        req.continue();
      }
    });

    await page.goto(url, {
      waitUntil: 'domcontentloaded',
      timeout: 8000,
    });

    const email = await page.evaluate(() => {
      const mailtoLinks = Array.from(document.querySelectorAll('a[href^="mailto:"]'));
      if (mailtoLinks.length > 0) {
        return mailtoLinks[0].getAttribute('href')?.replace('mailto:', '').split('?')[0] || null;
      }

      const bodyText = document.body.innerText;
      const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
      const matches = bodyText.match(emailRegex);
      if (matches) {
        const filtered = matches.filter(e =>
          !e.includes('example') &&
          !e.includes('placeholder') &&
          !e.includes('.png') &&
          !e.includes('.jpg') &&
          !e.includes('sentry') &&
          !e.includes('wixpress')
        );
        return filtered[0] || null;
      }

      return null;
    });

    await browser.close();

    if (email && isValidEmail(email)) {
      return email;
    }

    return null;
  } catch (error) {
    if (browser) {
      try { await browser.close(); } catch { /* ignore */ }
    }
    console.error('Email scrape error:', error);
    return null;
  }
}
