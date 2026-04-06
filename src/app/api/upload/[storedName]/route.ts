import { NextResponse } from 'next/server';
import { getUploadPath } from '@/lib/uploads';
import fs from 'fs';
import path from 'path';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ storedName: string }> }
) {
  const { storedName } = await params;

  // Security: prevent path traversal
  const safeName = path.basename(storedName);
  const filePath = getUploadPath(safeName);

  if (!fs.existsSync(filePath)) {
    return NextResponse.json({ error: 'Nicht gefunden' }, { status: 404 });
  }

  const fileBuffer = fs.readFileSync(filePath);
  const ext = safeName.split('.').pop()?.toLowerCase();
  const mimeTypes: Record<string, string> = {
    pdf: 'application/pdf',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    webp: 'image/webp',
    doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    xls: 'application/vnd.ms-excel',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    txt: 'text/plain',
    csv: 'text/csv',
    zip: 'application/zip',
  };
  const contentType = mimeTypes[ext ?? ''] ?? 'application/octet-stream';

  return new NextResponse(fileBuffer, {
    headers: {
      'Content-Type': contentType,
      'Cache-Control': 'private, max-age=3600',
    },
  });
}
