import * as cheerio from 'cheerio';
import { prisma } from './db';
import type { PriceData } from '@/types';

// --- Helper ---

export function parsePrice(raw: string): number | null {
  if (!raw) return null;
  const cleaned = raw
    .replace(/[CHFchfEUReureéê$£\s]/gi, '')
    .replace(/'/g, '')           // Swiss thousand separator: 1'299
    .replace(/\.(?=\d{3}(?:[.,]|$))/g, '') // German thousand separator: 1.299,00
    .replace(',', '.')           // German decimal: ,99 → .99
    .replace(/[–—-]$/, '.00')    // trailing dash = .00 (CHF 299.–)
    .replace(/[^0-9.]/g, '');
  const n = parseFloat(cleaned);
  return !isNaN(n) && n > 0.5 && n < 1_000_000 ? n : null;
}

function detectCurrency(raw: string): string {
  if (/CHF/i.test(raw)) return 'CHF';
  if (/EUR|€/i.test(raw)) return 'EUR';
  if (/USD|\$/i.test(raw)) return 'USD';
  if (/GBP|£/i.test(raw)) return 'GBP';
  return 'CHF';
}

// --- Method 1: Schema.org JSON-LD ---

export function extractFromJsonLd(html: string): PriceData | null {
  const scriptRegex = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match: RegExpExecArray | null;
  while ((match = scriptRegex.exec(html)) !== null) {
    try {
      const data = JSON.parse(match[1]);
      const candidates = Array.isArray(data) ? data : [data];
      for (const item of candidates) {
        const nodes: unknown[] = item['@graph'] ? item['@graph'] : [item];
        for (const node of nodes as Record<string, unknown>[]) {
          if (node['@type'] === 'Product' || node['@type'] === 'Offer') {
            const offerRaw = node['offers'] ?? node;
            const offerObj = Array.isArray(offerRaw)
              ? (offerRaw[0] as Record<string, unknown>)
              : (offerRaw as Record<string, unknown>);
            const rawPrice = offerObj?.['price'] ?? offerObj?.['lowPrice'];
            const price = parseFloat(String(rawPrice));
            const currency = String(offerObj?.['priceCurrency'] ?? 'CHF');
            if (!isNaN(price) && price > 0) {
              const availRaw = String(offerObj?.['availability'] ?? '');
              const availability =
                !availRaw ||
                availRaw.includes('InStock') ||
                availRaw.includes('OnlineOnly') ||
                availRaw.includes('LimitedAvailability');
              return {
                price,
                currency,
                productName: String(node['name'] ?? ''),
                availability,
              };
            }
          }
        }
      }
    } catch {
      continue;
    }
  }
  return null;
}

// --- Method 2: Open Graph / Meta tags ---

export function extractFromMeta(html: string): PriceData | null {
  const $ = cheerio.load(html);
  const priceSelectors = [
    'meta[property="og:price:amount"]',
    'meta[property="product:price:amount"]',
    'meta[itemprop="price"]',
    'meta[name="twitter:data1"]',
  ];
  const currencySelectors = [
    'meta[property="og:price:currency"]',
    'meta[property="product:price:currency"]',
  ];

  let rawPrice: string | null = null;
  for (const sel of priceSelectors) {
    const content = $(sel).attr('content');
    if (content) { rawPrice = content; break; }
  }
  if (!rawPrice) return null;

  const price = parsePrice(rawPrice);
  if (!price) return null;

  let currency = 'CHF';
  for (const sel of currencySelectors) {
    const c = $(sel).attr('content');
    if (c) { currency = c; break; }
  }

  return { price, currency, availability: true };
}

// --- Method 3: Pre-configured shop profile ---

export async function extractFromShopProfile(
  html: string,
  domain: string
): Promise<PriceData | null> {
  try {
    const profile = await prisma.shopProfile.findFirst({
      where: { domain, active: true },
    });
    if (!profile) return null;

    const $ = cheerio.load(html);

    const rawPrice = $(profile.priceSelector).first().text().trim();
    const price = parsePrice(rawPrice);
    if (!price) return null;

    let currency = 'CHF';
    if (profile.currencySelector) {
      const rawCurrency = $(profile.currencySelector).first().text().trim();
      currency = detectCurrency(rawCurrency) ?? 'CHF';
    } else {
      currency = detectCurrency(rawPrice) || 'CHF';
    }

    let availability = true;
    if (profile.availabilitySelector) {
      const text = $(profile.availabilitySelector).first().text().toLowerCase();
      availability = !(
        text.includes('nicht verfügbar') ||
        text.includes('ausverkauft') ||
        text.includes('out of stock') ||
        text.includes('unavailable')
      );
    }

    return { price, currency, availability };
  } catch {
    return null;
  }
}

// --- Method 4: Generic patterns ---

export function extractFromGenericPatterns(html: string): PriceData | null {
  const $ = cheerio.load(html);

  // Candidate selectors by priority
  const candidateSelectors = [
    '[itemprop="price"]',
    '[data-price]',
    '.product-price',
    '.price--main',
    '.current-price',
    '.sale-price',
    '#priceblock_ourprice',
    '#price',
    '[class*="price"][class*="current"]',
    '[class*="price"][class*="main"]',
    '[class*="price"][class*="sale"]',
    '[class*="productPrice"]',
    '[class*="product-price"]',
    '[class*="kaufpreis"]',
    '[class*="Preis"]',
  ];

  for (const sel of candidateSelectors) {
    try {
      const el = $(sel).first();
      if (!el.length) continue;

      // Try data-price attribute first
      const dataPrice = el.attr('data-price') || el.attr('content');
      if (dataPrice) {
        const price = parsePrice(dataPrice);
        if (price) return { price, currency: detectCurrency(dataPrice), availability: true };
      }

      const text = el.text().trim();
      if (!text) continue;
      const price = parsePrice(text);
      if (price) {
        return { price, currency: detectCurrency(text), availability: true };
      }
    } catch {
      continue;
    }
  }

  // Fallback: regex scan on raw HTML for CHF/EUR amounts
  const chfMatch = html.match(/CHF\s*([0-9]{1,3}(?:['.][0-9]{3})*(?:[.,][0-9]{0,2})?(?:[–—])?)/i);
  if (chfMatch) {
    const price = parsePrice(chfMatch[1]);
    if (price) return { price, currency: 'CHF', availability: true };
  }

  const eurMatch = html.match(/(?:EUR|€)\s*([0-9]{1,3}(?:\.[0-9]{3})*(?:,[0-9]{0,2})?)/i);
  if (eurMatch) {
    const price = parsePrice(eurMatch[1]);
    if (price) return { price, currency: 'EUR', availability: true };
  }

  return null;
}

// --- Method 5: Claude AI fallback ---

export async function extractWithClaude(
  html: string,
  url: string
): Promise<PriceData | null> {
  try {
    const apiKey =
      process.env.CLAUDE_API_KEY ??
      (await prisma.setting.findUnique({ where: { key: 'claudeApiKey' } }))?.value;
    if (!apiKey) return null;

    const Anthropic = (await import('@anthropic-ai/sdk')).default;
    const client = new Anthropic({ apiKey });

    // Strip scripts/styles and truncate
    const $ = cheerio.load(html);
    $('script, style, noscript, iframe, svg').remove();
    const cleanHtml = $.html().slice(0, 8000);

    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 256,
      messages: [
        {
          role: 'user',
          content: `Extract the current product price from this HTML. URL: ${url}\n\nRespond ONLY with valid JSON:\n{"price": number_or_null, "currency": "CHF"|"EUR"|"USD"|"GBP", "available": true|false, "productName": "string or null"}\n\nIf no price is visible, return: {"price": null}\n\nHTML:\n${cleanHtml}`,
        },
      ],
    });

    const text = response.content[0].type === 'text' ? response.content[0].text : '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;

    const parsed = JSON.parse(jsonMatch[0]) as {
      price: number | null;
      currency?: string;
      available?: boolean;
      productName?: string | null;
    };

    if (parsed.price && typeof parsed.price === 'number' && parsed.price > 0) {
      return {
        price: parsed.price,
        currency: parsed.currency ?? 'CHF',
        productName: parsed.productName ?? null,
        availability: parsed.available ?? true,
      };
    }
  } catch {
    // Silent failure — Claude is a last resort
  }
  return null;
}
