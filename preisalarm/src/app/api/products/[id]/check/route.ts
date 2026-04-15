import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { checkTrackedUrl } from '@/lib/scheduler';

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const urls = await prisma.trackedUrl.findMany({
    where: { productId: params.id, active: true },
  });
  if (urls.length === 0) {
    return NextResponse.json({ message: 'No active tracked URLs' });
  }
  const results: { id: string; url: string; ok: boolean; error?: string }[] = [];
  for (const u of urls) {
    try {
      await checkTrackedUrl(u.id);
      results.push({ id: u.id, url: u.url, ok: true });
    } catch (err) {
      results.push({ id: u.id, url: u.url, ok: false, error: String(err) });
    }
  }
  return NextResponse.json({ results });
}
