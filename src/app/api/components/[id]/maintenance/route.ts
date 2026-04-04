import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';

const CreateSchema = z.object({
  date: z.string().min(1),
  description: z.string().min(1),
  costChf: z.number().nonnegative().nullable().optional(),
  serviceProvider: z.string().nullable().optional(),
});

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const entries = await prisma.maintenanceEntry.findMany({
    where: { componentId: id },
    orderBy: { date: 'desc' },
  });
  return NextResponse.json(
    entries.map((e) => ({
      ...e,
      date: e.date.toISOString(),
      createdAt: e.createdAt.toISOString(),
    }))
  );
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json();
  const parsed = CreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const entry = await prisma.maintenanceEntry.create({
    data: {
      componentId: id,
      date: new Date(parsed.data.date),
      description: parsed.data.description,
      costChf: parsed.data.costChf ?? null,
      serviceProvider: parsed.data.serviceProvider ?? null,
    },
  });

  return NextResponse.json(
    { ...entry, date: entry.date.toISOString(), createdAt: entry.createdAt.toISOString() },
    { status: 201 }
  );
}
