import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');
    const category = searchParams.get('category');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const componentId = searchParams.get('componentId');

    const costs = await prisma.cost.findMany({
      where: {
        ...(type ? { type } : {}),
        ...(category ? { category } : {}),
        ...(componentId ? { componentId } : {}),
        ...(dateFrom || dateTo
          ? {
              date: {
                ...(dateFrom ? { gte: new Date(dateFrom) } : {}),
                ...(dateTo ? { lte: new Date(dateTo) } : {}),
              },
            }
          : {}),
      },
      include: { component: { select: { id: true, name: true } } },
      orderBy: { date: 'desc' },
    });

    return NextResponse.json(costs);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type, category, description, amountChf, date, recurrence, componentId, notes } = body;

    if (!type || !category || !description || amountChf == null || !date) {
      return NextResponse.json({ error: 'Pflichtfelder fehlen' }, { status: 400 });
    }

    const cost = await prisma.cost.create({
      data: {
        type,
        category,
        description,
        amountChf: parseFloat(amountChf),
        date: new Date(date),
        recurrence: recurrence || null,
        componentId: componentId || null,
        notes: notes || null,
      },
      include: { component: { select: { id: true, name: true } } },
    });

    return NextResponse.json(cost, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
