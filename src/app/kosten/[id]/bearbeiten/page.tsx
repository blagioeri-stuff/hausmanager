import { prisma } from '@/lib/db';
import { notFound } from 'next/navigation';
import { KostenBearbeitenClient } from './KostenBearbeitenClient';

export const dynamic = 'force-dynamic';

export default async function KostenBearbeitenPage({ params }: { params: { id: string } }) {
  const cost = await prisma.cost.findUnique({ where: { id: params.id } });
  if (!cost) notFound();

  return (
    <KostenBearbeitenClient
      cost={{
        ...cost,
        date: cost.date.toISOString().split('T')[0],
        type: cost.type as 'einmalig' | 'wiederkehrend',
      }}
    />
  );
}
