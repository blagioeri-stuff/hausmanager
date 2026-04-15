import { NextResponse } from 'next/server';
import { checkTrackedUrl } from '@/lib/scheduler';

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  try {
    await checkTrackedUrl(params.id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
