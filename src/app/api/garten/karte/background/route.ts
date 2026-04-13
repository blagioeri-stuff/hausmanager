import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const UPLOADS_DIR = path.join(process.cwd(), 'public', 'uploads');
const META_PATH = path.join(process.cwd(), 'data', 'garden-map-bg.json');

interface BgMeta { url: string; storedName: string }

function readMeta(): BgMeta | null {
  try {
    if (!fs.existsSync(META_PATH)) return null;
    return JSON.parse(fs.readFileSync(META_PATH, 'utf-8'));
  } catch {
    return null;
  }
}

function ensureDir(p: string) {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
}

export async function GET() {
  const meta = readMeta();
  if (!meta) return NextResponse.json({ url: null });
  if (!fs.existsSync(path.join(UPLOADS_DIR, meta.storedName))) return NextResponse.json({ url: null });
  return NextResponse.json({ url: meta.url });
}

export async function POST(req: Request) {
  const formData = await req.formData();
  const file = formData.get('file') as File | null;
  if (!file) return NextResponse.json({ error: 'Keine Datei' }, { status: 400 });
  if (!file.type.startsWith('image/')) {
    return NextResponse.json({ error: 'Nur Bilddateien erlaubt' }, { status: 400 });
  }

  // Delete old file
  const old = readMeta();
  if (old) {
    const oldPath = path.join(UPLOADS_DIR, old.storedName);
    if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
  }

  ensureDir(UPLOADS_DIR);
  ensureDir(path.dirname(META_PATH));

  const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg';
  const storedName = `garden-map-bg-${Date.now()}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  fs.writeFileSync(path.join(UPLOADS_DIR, storedName), buffer);

  const url = `/uploads/${storedName}`;
  fs.writeFileSync(META_PATH, JSON.stringify({ url, storedName }));

  return NextResponse.json({ url });
}

export async function DELETE() {
  const meta = readMeta();
  if (meta) {
    const filePath = path.join(UPLOADS_DIR, meta.storedName);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    if (fs.existsSync(META_PATH)) fs.unlinkSync(META_PATH);
  }
  return NextResponse.json({ ok: true });
}
