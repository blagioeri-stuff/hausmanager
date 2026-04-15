import { NextResponse } from 'next/server';
import { z } from 'zod';
import { detectPrice } from '@/lib/scraper';
import { writeLog } from '@/lib/log';

const Schema = z.object({
  url: z.string().url(),
  cssSelector: z.string().optional(),
  skipClaude: z.boolean().optional(),
});

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = Schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  await writeLog('info', 'scraper', `Manual detect: ${parsed.data.url}`);
  try {
    const result = await detectPrice(parsed.data.url, {
      cssSelector: parsed.data.cssSelector,
      skipClaude: parsed.data.skipClaude,
    });
    return NextResponse.json(result);
  } catch (err) {
    await writeLog('error', 'scraper', `Detect failed: ${parsed.data.url}`, String(err));
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
