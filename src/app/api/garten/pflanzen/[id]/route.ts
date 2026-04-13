import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';

const UpdateSchema = z.object({
  name: z.string().min(1).optional(),
  latinName: z.string().nullable().optional(),
  typeKey: z.string().min(1).optional(),
  locationHint: z.string().nullable().optional(),
  posX: z.number().min(0).max(100).nullable().optional(),
  posY: z.number().min(0).max(100).nullable().optional(),
  plantedYear: z.number().int().min(1800).max(new Date().getFullYear()).nullable().optional(),
  status: z.enum(['gut', 'pflege_nötig', 'krank', 'dormant']).optional(),
  winterProtection: z.boolean().optional(),
  wateringIntervalDays: z.number().int().positive().nullable().optional(),
  fertilizingWeeks: z.number().int().positive().nullable().optional(),
  pruningMonths: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
});

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const plant = await prisma.gardenPlant.findUnique({
    where: { id },
    include: {
      photos: { orderBy: { uploadedAt: 'desc' } },
      todos: { orderBy: { createdAt: 'desc' } },
    },
  });
  if (!plant) return NextResponse.json({ error: 'Nicht gefunden' }, { status: 404 });
  return NextResponse.json({
    ...plant,
    createdAt: plant.createdAt.toISOString(),
    updatedAt: plant.updatedAt.toISOString(),
    photos: plant.photos.map((ph) => ({ ...ph, uploadedAt: ph.uploadedAt.toISOString() })),
    todos: plant.todos.map((t) => ({
      ...t,
      doneAt: t.doneAt?.toISOString() ?? null,
      createdAt: t.createdAt.toISOString(),
      updatedAt: t.updatedAt.toISOString(),
    })),
  });
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json();
  const parsed = UpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const plant = await prisma.gardenPlant.update({ where: { id }, data: parsed.data });
  return NextResponse.json({ ...plant, createdAt: plant.createdAt.toISOString(), updatedAt: plant.updatedAt.toISOString() });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const photos = await prisma.gardenPhoto.findMany({ where: { plantId: id } });
  if (photos.length > 0) {
    const { deleteUploadedFile } = await import('@/lib/uploads');
    await Promise.all(photos.map((ph) => deleteUploadedFile(ph.storedName)));
  }
  await prisma.gardenPlant.delete({ where: { id } });
  return new NextResponse(null, { status: 204 });
}
