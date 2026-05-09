import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { COMPONENT_TYPES } from '@/lib/component-types';
import { enrichComponent } from '@/lib/calculations';

const CreateSchema = z.object({
  name: z.string().min(1),
  typeKey: z.string().refine((k) => k in COMPONENT_TYPES, { message: 'Unbekannter Typ' }),
  buildYear: z.preprocess(
    (val) => (typeof val === 'string' ? Number(val) : val),
    z.number().int().min(1900).max(new Date().getFullYear())
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

export async function GET() {
  const components = await prisma.homeComponent.findMany({
    orderBy: { createdAt: 'desc' },
  });
  const enriched = components.map((c) =>
    enrichComponent({ ...c, createdAt: c.createdAt.toISOString(), updatedAt: c.updatedAt.toISOString() })
  );
  return NextResponse.json(enriched);
}

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = CreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  let component;
  try {
    component = await prisma.homeComponent.create({
      data: {
        name: parsed.data.name,
        typeKey: parsed.data.typeKey,
        buildYear: parsed.data.buildYear,
        customCostChf: parsed.data.customCostChf ?? null,
        customLifetimeYrs: parsed.data.customLifetimeYrs ?? null,
        plannedRenovationYear: parsed.data.plannedRenovationYear ?? null,
        plannedRenovationCostChf: parsed.data.plannedRenovationCostChf ?? null,
        notes: parsed.data.notes ?? null,
        renovationPlanned: parsed.data.renovationPlanned ?? true,
        maintenanceIntervalMonths: parsed.data.maintenanceIntervalMonths ?? null,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('Prisma create error:', message);
    return NextResponse.json({ error: `DB: ${message}` }, { status: 500 });
  }

  const enriched = enrichComponent({
    ...component,
    createdAt: component.createdAt.toISOString(),
    updatedAt: component.updatedAt.toISOString(),
  });
  return NextResponse.json(enriched, { status: 201 });
}
