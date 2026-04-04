import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { ensureUploadDir, getUploadPath, ALLOWED_MIME_TYPES, MAX_FILE_SIZE } from '@/lib/uploads';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs/promises';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const docs = await prisma.document.findMany({
    where: { componentId: id },
    orderBy: { uploadedAt: 'desc' },
  });
  return NextResponse.json(
    docs.map((d) => ({ ...d, uploadedAt: d.uploadedAt.toISOString() }))
  );
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: 'Ungültige Anfrage' }, { status: 400 });
  }

  const file = formData.get('file') as File | null;
  if (!file || file.size === 0) {
    return NextResponse.json({ error: 'Keine Datei erhalten' }, { status: 400 });
  }

  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return NextResponse.json({ error: 'Dateityp nicht erlaubt (nur PDF, Bilder)' }, { status: 400 });
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: 'Datei zu groß (max. 20 MB)' }, { status: 400 });
  }

  await ensureUploadDir();

  const ext = file.name.split('.').pop() ?? 'bin';
  const storedName = `${uuidv4()}.${ext}`;
  const filePath = getUploadPath(storedName);

  const arrayBuffer = await file.arrayBuffer();
  await fs.writeFile(filePath, Buffer.from(arrayBuffer));

  const doc = await prisma.document.create({
    data: {
      componentId: id,
      filename: file.name,
      storedName,
      mimeType: file.type,
      sizeBytes: file.size,
    },
  });

  return NextResponse.json(
    { ...doc, uploadedAt: doc.uploadedAt.toISOString() },
    { status: 201 }
  );
}
