import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const format = searchParams.get('format') ?? 'json';

  const components = await prisma.homeComponent.findMany({
    include: { maintenance: true, documents: true },
    orderBy: { createdAt: 'asc' },
  });

  if (format === 'csv') {
    // Two-section CSV: components then maintenance entries
    const lines: string[] = [];
    lines.push('id,name,typeKey,buildYear,customCostChf,customLifetimeYrs,notes,createdAt');
    for (const c of components) {
      lines.push([c.id, c.name, c.typeKey, c.buildYear, c.customCostChf ?? '', c.customLifetimeYrs ?? '', `"${(c.notes ?? '').replace(/"/g, '""')}"`, c.createdAt.toISOString()].join(','));
    }
    lines.push('');
    lines.push('componentId,componentName,date,description,costChf,serviceProvider');
    for (const c of components) {
      for (const m of c.maintenance) {
        lines.push([c.id, `"${c.name.replace(/"/g, '""')}"`, m.date.toISOString().slice(0, 10), `"${m.description.replace(/"/g, '""')}"`, m.costChf ?? '', `"${(m.serviceProvider ?? '').replace(/"/g, '""')}"`].join(','));
      }
    }
    return new NextResponse(lines.join('\n'), {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="hausmanager-export-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  }

  // JSON export
  const json = JSON.stringify({ exportedAt: new Date().toISOString(), components }, null, 2);
  return new NextResponse(json, {
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="hausmanager-export-${new Date().toISOString().slice(0, 10)}.json"`,
    },
  });
}
