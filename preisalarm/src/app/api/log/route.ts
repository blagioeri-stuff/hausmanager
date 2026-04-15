import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const level = searchParams.get('level') ?? undefined;
  const category = searchParams.get('category') ?? undefined;
  const days = parseInt(searchParams.get('days') ?? '7', 10);
  const limit = parseInt(searchParams.get('limit') ?? '500', 10);

  const since = new Date(Date.now() - days * 86_400_000);
  const logs = await prisma.sysLog.findMany({
    where: {
      ...(level ? { level } : {}),
      ...(category ? { category } : {}),
      createdAt: { gte: since },
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
  return NextResponse.json(logs);
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const olderThanDays = parseInt(searchParams.get('olderThan') ?? '30', 10);
  const cutoff = new Date(Date.now() - olderThanDays * 86_400_000);
  const { count } = await prisma.sysLog.deleteMany({ where: { createdAt: { lt: cutoff } } });
  return NextResponse.json({ deleted: count });
}
