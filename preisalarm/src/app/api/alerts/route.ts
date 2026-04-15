import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';

const CreateSchema = z.object({
  productId: z.string().min(1),
  targetPrice: z.number().positive(),
  currency: z.string().length(3).optional(),
  notifyEmail: z.boolean().optional(),
  notifyTelegram: z.boolean().optional(),
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const productId = searchParams.get('productId') ?? undefined;
  const alerts = await prisma.alert.findMany({
    where: productId ? { productId } : undefined,
    orderBy: { createdAt: 'desc' },
    include: { product: { select: { name: true } } },
  });
  return NextResponse.json(alerts);
}

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = CreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  try {
    const alert = await prisma.alert.create({
      data: {
        productId: parsed.data.productId,
        targetPrice: parsed.data.targetPrice,
        currency: parsed.data.currency ?? 'CHF',
        notifyEmail: parsed.data.notifyEmail ?? true,
        notifyTelegram: parsed.data.notifyTelegram ?? true,
      },
    });
    return NextResponse.json(alert, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
  try {
    await prisma.alert.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
