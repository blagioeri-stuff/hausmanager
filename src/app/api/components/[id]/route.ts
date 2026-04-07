import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { COMPONENT_TYPES } from '@/lib/component-types';
import { enrichComponent } from '@/lib/calculations';

const UpdateSchema = z.object({
  name: z.string().min(1).optional(),
  typeKey: z
    .string()
    .refine((k) => k in COMPONENT_TYPES, { message: 'Unbekannter Typ' })
    .optional(),
  buildYear: z.number().int().min(1900).max(new Date().getFullYear()).optional(),
  customCostChf: z.number().positive().nullable().optional(),
  customLifetimeYrs: z.number().int().positive().nullable().optional(),
  plannedRenovationYear: z.number().int().min(1900).nullable().optional(),
  plannedRenovationCostChf: z.number().positive().nullable().optional(),
  notes: z.string().nullable().optional(),
  renovationPlanned: z.boolean().optional(),
  maintenanceIntervalMonths: z.number().int().positive().nullable().optional(),
});

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const component = await prisma.homeComponent.findUnique({ where: { id } });
  if (!component) return NextResponse.json({ error: 'Nicht gefunden' }, { status: 404 });

  const enriched = enrichComponent({
    ...component,
    createdAt: component.createdAt.toISOString(),
    updatedAt: component.updatedAt.toISOString(),
  });
  return NextResponse.json(enriched);
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json();
  const parsed = UpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  let component;
  try {
    component = await prisma.homeComponent.update({
      where: { id },
      data: parsed.data,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('Prisma update error:', message);
    return NextResponse.json({ error: `DB: ${message}` }, { status: 500 });
  }

  const enriched = enrichComponent({
    ...component,
    createdAt: component.createdAt.toISOString(),
    updatedAt: component.updatedAt.toISOString(),
  });
  return NextResponse.json(enriched);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  // Documents' storedNames need to be cleaned up
  const docs = await prisma.document.findMany({ where: { componentId: id } });
  if (docs.length > 0) {
    const { deleteUploadedFile } = await import('@/lib/uploads');
    await Promise.all(docs.map((d) => deleteUploadedFile(d.storedName)));
  }
  await prisma.homeComponent.delete({ where: { id } });
  return new NextResponse(null, { status: 204 });
}
