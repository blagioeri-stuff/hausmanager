import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const cost = await prisma.cost.findUnique({
      where: { id: params.id },
      include: { component: { select: { id: true, name: true } } },
    });
    if (!cost) return NextResponse.json({ error: 'Nicht gefunden' }, { status: 404 });
    return NextResponse.json(cost);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const { type, category, description, amountChf, date, recurrence, componentId, notes } = body;

    if (!type || !category || !description || amountChf == null || !date) {
      return NextResponse.json({ error: 'Pflichtfelder fehlen' }, { status: 400 });
    }

    const cost = await prisma.cost.update({
      where: { id: params.id },
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

    return NextResponse.json(cost);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await prisma.cost.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
