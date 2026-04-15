import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';

const ProfileSchema = z.object({
  domain: z.string().min(1),
  name: z.string().min(1),
  priceSelector: z.string().min(1),
  currencySelector: z.string().nullable().optional(),
  availabilitySelector: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  active: z.boolean().optional(),
});

export async function GET() {
  const profiles = await prisma.shopProfile.findMany({ orderBy: { domain: 'asc' } });
  return NextResponse.json(profiles);
}

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = ProfileSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  try {
    const profile = await prisma.shopProfile.upsert({
      where: { domain: parsed.data.domain },
      update: parsed.data,
      create: parsed.data,
    });
    return NextResponse.json(profile, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const body = await request.json() as { id: string } & Record<string, unknown>;
  const { id, ...data } = body;
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
  const parsed = ProfileSchema.partial().safeParse(data);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  try {
    const profile = await prisma.shopProfile.update({ where: { id }, data: parsed.data });
    return NextResponse.json(profile);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
  await prisma.shopProfile.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
