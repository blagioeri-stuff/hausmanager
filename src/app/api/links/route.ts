import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  const links = await prisma.link.findMany({ orderBy: { createdAt: 'desc' } });
  return NextResponse.json(links);
}

export async function POST(req: NextRequest) {
  try {
    const { title, url, description, category } = await req.json();
    if (!title || !url) return NextResponse.json({ error: 'Titel und URL erforderlich' }, { status: 400 });
    const link = await prisma.link.create({
      data: { title, url, description: description || null, category: category || null },
    });
    return NextResponse.json(link, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}
