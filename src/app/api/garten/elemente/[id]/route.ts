import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';

const UpdateSchema = z.object({
  name: z.string().min(1).optional(),
  typeKey: z.string().min(1).optional(),
  posX: z.number().min(0).max(100).nullable().optional(),
  posY: z.number().min(0).max(100).nullable().optional(),
  sizeM2: z.number().positive().nullable().optional(),
  notes: z.string().nullable().optional(),
});

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const element = await prisma.gardenElement.findUnique({
    where: { id },
    include: { photos: true, todos: { orderBy: { createdAt: 'desc' } } },
  });
  if (!element) return NextResponse.json({ error: 'Nicht gefunden' }, { status: 404 });
  return NextResponse.json({
    ...element,
    createdAt: element.createdAt.toISOString(),
    updatedAt: element.updatedAt.toISOString(),
    photos: element.photos.map((ph) => ({ ...ph, uploadedAt: ph.uploadedAt.toISOString() })),
    todos: element.todos.map((t) => ({
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
  const element = await prisma.gardenElement.update({ where: { id }, data: parsed.data });
  return NextResponse.json({ ...element, createdAt: element.createdAt.toISOString(), updatedAt: element.updatedAt.toISOString() });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const photos = await prisma.gardenPhoto.findMany({ where: { elementId: id } });
  if (photos.length > 0) {
    const { deleteUploadedFile } = await import('@/lib/uploads');
    await Promise.all(photos.map((ph) => deleteUploadedFile(ph.storedName)));
  }
  await prisma.gardenElement.delete({ where: { id } });
  return new NextResponse(null, { status: 204 });
}
