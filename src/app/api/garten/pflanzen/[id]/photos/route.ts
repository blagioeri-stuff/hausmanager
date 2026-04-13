import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { ensureUploadDir, getUploadPath, deleteUploadedFile, MAX_FILE_SIZE } from '@/lib/uploads';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs/promises';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const plant = await prisma.gardenPlant.findUnique({ where: { id } });
  if (!plant) return NextResponse.json({ error: 'Pflanze nicht gefunden' }, { status: 404 });

  const formData = await request.formData();
  const file = formData.get('file') as File | null;
  const notes = formData.get('notes') as string | null;

  if (!file || file.size === 0) return NextResponse.json({ error: 'Keine Datei' }, { status: 400 });
  if (file.size > MAX_FILE_SIZE) return NextResponse.json({ error: 'Datei zu groß (max. 20 MB)' }, { status: 400 });

  await ensureUploadDir();
  const ext = file.name.split('.').pop() ?? 'bin';
  const storedName = `${uuidv4()}.${ext}`;
  const arrayBuffer = await file.arrayBuffer();
  await fs.writeFile(getUploadPath(storedName), Buffer.from(arrayBuffer));

  const photo = await prisma.gardenPhoto.create({
    data: {
      storedName,
      filename: file.name,
      mimeType: file.type,
      sizeBytes: file.size,
      notes: notes ?? null,
      plantId: id,
    },
  });
  return NextResponse.json({ ...photo, uploadedAt: photo.uploadedAt.toISOString() }, { status: 201 });
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: plantId } = await params;
  const { searchParams } = new URL(request.url);
  const photoId = searchParams.get('photoId');
  if (!photoId) return NextResponse.json({ error: 'photoId erforderlich' }, { status: 400 });

  const photo = await prisma.gardenPhoto.findFirst({ where: { id: photoId, plantId } });
  if (!photo) return NextResponse.json({ error: 'Nicht gefunden' }, { status: 404 });

  await deleteUploadedFile(photo.storedName);
  await prisma.gardenPhoto.delete({ where: { id: photoId } });
  return new NextResponse(null, { status: 204 });
}
