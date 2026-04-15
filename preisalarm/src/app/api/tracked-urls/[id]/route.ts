import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';

const UpdateSchema = z.object({
  shopName: z.string().nullable().optional(),
  currency: z.string().length(3).optional(),
  checkIntervalHours: z.number().positive().optional(),
  cssSelector: z.string().nullable().optional(),
  active: z.boolean().optional(),
});

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const url = await prisma.trackedUrl.findUnique({
    where: { id: params.id },
    include: { pricePoints: { orderBy: { timestamp: 'desc' }, take: 50 } },
  });
  if (!url) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(url);
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const body = await request.json();
  const parsed = UpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  try {
    const url = await prisma.trackedUrl.update({
      where: { id: params.id },
      data: parsed.data,
    });
    return NextResponse.json(url);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try {
    await prisma.trackedUrl.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
