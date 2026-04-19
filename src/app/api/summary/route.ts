import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { enrichComponent, computeReserveSummary, buildReserveProjection } from '@/lib/calculations';

export const dynamic = 'force-dynamic';

export async function GET() {
  const components = await prisma.homeComponent.findMany({
    orderBy: { createdAt: 'desc' },
  });

  const enriched = components.map((c) =>
    enrichComponent({
      ...c,
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt.toISOString(),
    })
  );

  const summary = computeReserveSummary(enriched);
  const projection = buildReserveProjection(enriched);

  return NextResponse.json({ summary, projection, components: enriched });
}
