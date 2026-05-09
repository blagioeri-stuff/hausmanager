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
  buildYear: z.preprocess(
    (val) => (typeof val === 'string' ? Number(val) : val),
    z.number().int().min(1900).max(new Date().getFullYear()).optional()
  ),
  customCostChf: z.preprocess(
    (val) => (val === '' || val === null || val === undefined ? null : Number(val)),
    z.nullable(z.number().positive()).optional()
  ),
  customLifetimeYrs: z.preprocess(
    (val) => (val === '' || val === null || val === undefined ? null : Number(val)),
    z.nullable(z.number().int().positive()).optional()
  ),
  plannedRenovationYear: z.preprocess(
    (val) => (val === '' || val === null || val === undefined ? null : Number(val)),
    z.nullable(z.number().int().min(1900)).optional()
  ),
  plannedRenovationCostChf: z.preprocess(
    (val) => (val === '' || val === null || val === undefined ? null : Number(val)),
    z.nullable(z.number().positive()).optional()
  ),
  notes: z.string().nullable().optional(),
  renovationPlanned: z.boolean().optional(),
  maintenanceIntervalMonths: z.preprocess(
    (val) => (val === '' || val === null || val === undefined ? null : Number(val)),
    z.nullable(z.number().int().positive()).optional()
  ),
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
