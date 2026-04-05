import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { z } from 'zod';

const UpdateSchema = z.record(z.string(), z.string());

export async function GET() {
  const settings = await prisma.setting.findMany();
  const map = Object.fromEntries(settings.map((s) => [s.key, s.value]));
  return NextResponse.json(map);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = UpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Ungültige Daten' }, { status: 400 });
  }

  const ops = Object.entries(parsed.data).map(([key, value]) =>
    prisma.setting.upsert({ where: { key }, update: { value }, create: { key, value } })
  );
  await prisma.$transaction(ops);
  return NextResponse.json({ ok: true });
}
