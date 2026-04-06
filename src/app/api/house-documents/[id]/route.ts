import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { deleteUploadedFile } from '@/lib/uploads';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const doc = await prisma.houseDocument.findUnique({
      where: { id: params.id },
      include: { component: { select: { id: true, name: true } } },
    });
    if (!doc) return NextResponse.json({ error: 'Nicht gefunden' }, { status: 404 });
    return NextResponse.json(doc);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const { category, title, description, externalUrl, componentId } = body;

    if (!category || !title) {
      return NextResponse.json({ error: 'Pflichtfelder fehlen' }, { status: 400 });
    }

    const doc = await prisma.houseDocument.update({
      where: { id: params.id },
      data: {
        category,
        title,
        description: description || null,
        externalUrl: externalUrl || null,
        componentId: componentId || null,
      },
      include: { component: { select: { id: true, name: true } } },
    });

    return NextResponse.json(doc);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const doc = await prisma.houseDocument.findUnique({ where: { id: params.id } });
    if (!doc) return NextResponse.json({ error: 'Nicht gefunden' }, { status: 404 });

    if (doc.storedName) {
      await deleteUploadedFile(doc.storedName);
    }

    await prisma.houseDocument.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
