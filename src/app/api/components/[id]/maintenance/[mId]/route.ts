import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';

const UpdateSchema = z.object({
  date: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  costChf: z.number().nonnegative().nullable().optional(),
  serviceProvider: z.string().nullable().optional(),
});

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string; mId: string }> }
) {
  const { mId } = await params;
  const body = await request.json();
  const parsed = UpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const entry = await prisma.maintenanceEntry.update({
    where: { id: mId },
    data: {
      ...parsed.data,
      date: parsed.data.date ? new Date(parsed.data.date) : undefined,
    },
  });

  return NextResponse.json({
    ...entry,
    date: entry.date.toISOString(),
    createdAt: entry.createdAt.toISOString(),
  });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string; mId: string }> }
) {
  const { mId } = await params;
  await prisma.maintenanceEntry.delete({ where: { id: mId } });
  return new NextResponse(null, { status: 204 });
}
