import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(
  request: Request,
  { params }: { params: { trackedUrlId: string } }
) {
  const { searchParams } = new URL(request.url);
  const from = searchParams.get('from');
  const to = searchParams.get('to');
  const points = await prisma.pricePoint.findMany({
    where: {
      trackedUrlId: params.trackedUrlId,
      ...(from || to
        ? {
            timestamp: {
              ...(from ? { gte: new Date(from) } : {}),
              ...(to ? { lte: new Date(to) } : {}),
            },
          }
        : {}),
    },
    orderBy: { timestamp: 'asc' },
  });
  return NextResponse.json(points);
}
