import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { title, url, description, category } = await req.json();
    if (!title || !url) return NextResponse.json({ error: 'Titel und URL erforderlich' }, { status: 400 });
    const link = await prisma.link.update({
      where: { id: params.id },
      data: { title, url, description: description || null, category: category || null },
    });
    return NextResponse.json(link);
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await prisma.link.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}
