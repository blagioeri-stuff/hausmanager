import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { deleteUploadedFile } from '@/lib/uploads';

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string; dId: string }> }
) {
  const { dId } = await params;
  const doc = await prisma.document.findUnique({ where: { id: dId } });
  if (!doc) return NextResponse.json({ error: 'Nicht gefunden' }, { status: 404 });

  await deleteUploadedFile(doc.storedName);
  await prisma.document.delete({ where: { id: dId } });
  return new NextResponse(null, { status: 204 });
}
