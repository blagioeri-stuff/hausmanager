import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';

const CreateSchema = z.object({
  name: z.string().min(1),
  typeKey: z.string().min(1),
  posX: z.number().min(0).max(100).nullable().optional(),
  posY: z.number().min(0).max(100).nullable().optional(),
  sizeM2: z.number().positive().nullable().optional(),
  notes: z.string().nullable().optional(),
});

export async function GET() {
  const elements = await prisma.gardenElement.findMany({
    orderBy: { name: 'asc' },
    include: { photos: true, todos: { where: { done: false } } },
  });
  return NextResponse.json(
    elements.map((e) => ({
      ...e,
      createdAt: e.createdAt.toISOString(),
      updatedAt: e.updatedAt.toISOString(),
      photos: e.photos.map((ph) => ({ ...ph, uploadedAt: ph.uploadedAt.toISOString() })),
      todos: e.todos.map((t) => ({
        ...t,
        doneAt: t.doneAt?.toISOString() ?? null,
        createdAt: t.createdAt.toISOString(),
        updatedAt: t.updatedAt.toISOString(),
      })),
    }))
  );
}

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = CreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const element = await prisma.gardenElement.create({
    data: {
      name: parsed.data.name,
      typeKey: parsed.data.typeKey,
      posX: parsed.data.posX ?? null,
      posY: parsed.data.posY ?? null,
      sizeM2: parsed.data.sizeM2 ?? null,
      notes: parsed.data.notes ?? null,
    },
  });
  return NextResponse.json(
    { ...element, createdAt: element.createdAt.toISOString(), updatedAt: element.updatedAt.toISOString() },
    { status: 201 }
  );
}
