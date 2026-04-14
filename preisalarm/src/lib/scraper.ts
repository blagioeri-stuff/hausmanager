import { chromium } from 'playwright';
import type { DetectionResult, PageData } from '@/types';
import {
  extractFromJsonLd,
  extractFromMeta,
  extractFromShopProfile,
  extractFromGenericPatterns,
  extractWithClaude,
} from './price-extractor';

const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
];

export async function scrapeWithPlaywright(url: string): Promise<PageData> {
  const browser = await chromium.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
    headless: true,
  });
  try {
    const context = await browser.newContext({
      userAgent: USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)],
      locale: 'de-CH',
      timezoneId: 'Europe/Zurich',
      extraHTTPHeaders: {
        'Accept-Language': 'de-CH,de;q=0.9,en;q=0.8',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
    });
    const page = await context.newPage();
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30_000 });
    await page.waitForTimeout(1500 + Math.random() * 1500);
    const html = await page.content();
    const title = await page.title();
    return { html, title, url: page.url() };
  } finally {
    await browser.close();
  }
}

export function normalizeUrl(url: string): string {
  try {
    const u = new URL(url);
    const trackingParams = ['utm_source','utm_medium','utm_campaign','utm_term','utm_content','ref','tag','gclid','fbclid','msclkid','mc_eid'];
    trackingParams.forEach((p) => u.searchParams.delete(p));
    return u.toString();
  } catch {
    return url;
  }
}

export async function detectPrice(
  url: string,
  options?: { cssSelector?: string; skipClaude?: boolean }
): Promise<DetectionResult> {
  const normalizedUrl = normalizeUrl(url);
  let pageData: PageData;
  try {
    pageData = await scrapeWithPlaywright(normalizedUrl);
  } catch (err) {
    return { price: null, currency: 'CHF', productName: null, availability: false, method: 'failed', error: String(err) };
  }
  const domain = (() => { try { return new URL(pageData.url).hostname.replace(/^www\./, ''); } catch { return ''; } })();

  const jsonld = extractFromJsonLd(pageData.html);
  if (jsonld?.price) return { ...jsonld, productName: jsonld.productName || pageData.title || null, method: 'jsonld', shopName: domain };

  const meta = extractFromMeta(pageData.html);
  if (meta?.price) return { ...meta, productName: pageData.title || null, method: 'meta', shopName: domain };

  if (domain) {
    const profile = await extractFromShopProfile(pageData.html, domain);
    if (profile?.price) return { ...profile, productName: pageData.title || null, method: 'profile', shopName: domain };
  }

  const generic = extractFromGenericPatterns(pageData.html);
  if (generic?.price) return { ...generic, productName: pageData.title || null, method: 'generic', shopName: domain };

  if (!options?.skipClaude) {
    const claude = await extractWithClaude(pageData.html, normalizedUrl);
    if (claude?.price) return { ...claude, productName: claude.productName || pageData.title || null, method: 'claude', shopName: domain };
  }

  return { price: null, currency: 'CHF', productName: pageData.title || null, availability: false, method: 'failed', error: 'All extraction methods failed' };
}
