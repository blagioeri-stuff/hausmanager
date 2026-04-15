import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';

const CreateSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  imageUrl: z.string().url().optional().or(z.literal('')),
  notes: z.string().optional(),
});

export async function GET() {
  const products = await prisma.product.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      trackedUrls: {
        where: { active: true },
        orderBy: { lastPrice: 'asc' },
      },
      alerts: { where: { active: true } },
    },
  });
  return NextResponse.json(products);
}

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = CreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  try {
    const product = await prisma.product.create({
      data: {
        name: parsed.data.name,
        description: parsed.data.description ?? null,
        imageUrl: parsed.data.imageUrl || null,
        notes: parsed.data.notes ?? null,
      },
    });
    return NextResponse.json(product, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
