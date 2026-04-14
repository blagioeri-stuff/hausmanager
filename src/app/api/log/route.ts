import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const level = searchParams.get('level');
  const category = searchParams.get('category');
  const days = parseInt(searchParams.get('days') ?? '7', 10);
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '200', 10), 500);

  const since = new Date();
  since.setDate(since.getDate() - (days || 7));

  const logs = await prisma.systemLog.findMany({
    where: {
      ...(level ? { level } : {}),
      ...(category ? { category } : {}),
      createdAt: { gte: since },
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });

  return NextResponse.json(
    logs.map((l) => ({ ...l, createdAt: l.createdAt.toISOString() }))
  );
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const olderThanDays = parseInt(searchParams.get('olderThan') ?? '30', 10);
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - olderThanDays);

  const { count } = await prisma.systemLog.deleteMany({
    where: { createdAt: { lt: cutoff } },
  });

  return NextResponse.json({ deleted: count });
}
