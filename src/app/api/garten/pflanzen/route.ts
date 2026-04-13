import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';

const CreateSchema = z.object({
  name: z.string().min(1),
  latinName: z.string().nullable().optional(),
  typeKey: z.string().min(1),
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

export async function GET() {
  const plants = await prisma.gardenPlant.findMany({
    orderBy: { name: 'asc' },
    include: { photos: true, todos: { where: { done: false } } },
  });
  return NextResponse.json(
    plants.map((p) => ({
      ...p,
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
      photos: p.photos.map((ph) => ({ ...ph, uploadedAt: ph.uploadedAt.toISOString() })),
      todos: p.todos.map((t) => ({
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
  const plant = await prisma.gardenPlant.create({
    data: {
      name: parsed.data.name,
      latinName: parsed.data.latinName ?? null,
      typeKey: parsed.data.typeKey,
      locationHint: parsed.data.locationHint ?? null,
      posX: parsed.data.posX ?? null,
      posY: parsed.data.posY ?? null,
      plantedYear: parsed.data.plantedYear ?? null,
      status: parsed.data.status ?? 'gut',
      winterProtection: parsed.data.winterProtection ?? false,
      wateringIntervalDays: parsed.data.wateringIntervalDays ?? null,
      fertilizingWeeks: parsed.data.fertilizingWeeks ?? null,
      pruningMonths: parsed.data.pruningMonths ?? null,
      notes: parsed.data.notes ?? null,
    },
  });
  return NextResponse.json(
    { ...plant, createdAt: plant.createdAt.toISOString(), updatedAt: plant.updatedAt.toISOString() },
    { status: 201 }
  );
}
