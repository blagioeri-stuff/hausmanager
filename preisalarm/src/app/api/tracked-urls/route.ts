import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { normalizeUrl } from '@/lib/scraper';

const CreateSchema = z.object({
  productId: z.string().min(1),
  url: z.string().url(),
  shopName: z.string().optional(),
  currency: z.string().length(3).optional(),
  checkIntervalHours: z.number().positive().optional(),
  cssSelector: z.string().optional(),
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const productId = searchParams.get('productId') ?? undefined;
  const urls = await prisma.trackedUrl.findMany({
    where: productId ? { productId } : undefined,
    orderBy: { createdAt: 'desc' },
    include: {
      pricePoints: { orderBy: { timestamp: 'desc' }, take: 1 },
    },
  });
  return NextResponse.json(urls);
}

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = CreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const normalized = normalizeUrl(parsed.data.url);
  const domain = (() => {
    try { return new URL(normalized).hostname.replace(/^www\./, ''); } catch { return null; }
  })();
  try {
    const url = await prisma.trackedUrl.create({
      data: {
        productId: parsed.data.productId,
        url: normalized,
        shopName: parsed.data.shopName ?? domain ?? null,
        shopDomain: domain,
        currency: parsed.data.currency ?? 'CHF',
        checkIntervalHours: parsed.data.checkIntervalHours ?? 12,
        cssSelector: parsed.data.cssSelector ?? null,
      },
    });
    return NextResponse.json(url, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
