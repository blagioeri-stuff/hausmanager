import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { ensureUploadDir, getUploadPath, ALLOWED_MIME_TYPES, MAX_FILE_SIZE } from '@/lib/uploads';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs/promises';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');
    const componentId = searchParams.get('componentId');

    const docs = await prisma.houseDocument.findMany({
      where: {
        ...(category ? { category } : {}),
        ...(componentId ? { componentId } : {}),
      },
      include: { component: { select: { id: true, name: true } } },
      orderBy: { uploadedAt: 'desc' },
    });

    return NextResponse.json(docs);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get('content-type') ?? '';

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const file = formData.get('file') as File | null;
      const category = formData.get('category') as string;
      const title = formData.get('title') as string;
      const description = (formData.get('description') as string) || null;
      const componentId = (formData.get('componentId') as string) || null;

      if (!category || !title) {
        return NextResponse.json({ error: 'Pflichtfelder fehlen' }, { status: 400 });
      }

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

      const doc = await prisma.houseDocument.create({
        data: {
          category,
          title,
          description,
          filename: file.name,
          storedName,
          mimeType: file.type,
          sizeBytes: file.size,
          componentId: componentId || null,
        },
        include: { component: { select: { id: true, name: true } } },
      });

      return NextResponse.json(doc, { status: 201 });
    }

    // JSON body for external URL
    const body = await req.json();
    const { category, title, description, externalUrl, componentId } = body;

    if (!category || !title || !externalUrl) {
      return NextResponse.json({ error: 'Pflichtfelder fehlen' }, { status: 400 });
    }

    const doc = await prisma.houseDocument.create({
      data: {
        category,
        title,
        description: description || null,
        externalUrl,
        componentId: componentId || null,
      },
      include: { component: { select: { id: true, name: true } } },
    });

    return NextResponse.json(doc, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
