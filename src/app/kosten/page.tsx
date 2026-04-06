import { prisma } from '@/lib/db';
import Link from 'next/link';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { KostenClient } from './KostenClient';

export const dynamic = 'force-dynamic';

export default async function KostenPage() {
  const costs = await prisma.cost.findMany({
    include: { component: { select: { id: true, name: true } } },
    orderBy: { date: 'desc' },
  });

  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 1);

  const einmaligThisYear = costs
    .filter((c) => c.type === 'einmalig' && new Date(c.date) >= startOfYear)
    .reduce((s, c) => s + c.amountChf, 0);

  const wiederkehrendJaehrlich = costs
    .filter((c) => c.type === 'wiederkehrend')
    .reduce((s, c) => {
      const factor = c.recurrence === 'monatlich' ? 12 : c.recurrence === 'vierteljährlich' ? 4 : 1;
      return s + c.amountChf * factor;
    }, 0);

  const summaryCards = [
    { label: 'Einmalige Kosten (dieses Jahr)', value: einmaligThisYear, color: 'text-red-600' },
    { label: 'Wiederkehrende Kosten (jährlich)', value: wiederkehrendJaehrlich, color: 'text-blue-600' },
    { label: 'Positionen gesamt', value: costs.length, isCount: true, color: 'text-gray-700' },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Kosten"
        subtitle="Einmalige und wiederkehrende Hauskosten verwalten"
        action={
          <Link href="/kosten/neu">
            <Button>+ Neue Kosten</Button>
          </Link>
        }
      />

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {summaryCards.map((card) => (
          <Card key={card.label}>
            <p className="text-xs text-gray-500 mb-1">{card.label}</p>
            <p className={`text-2xl font-bold ${card.color}`}>
              {card.isCount
                ? card.value
                : `CHF ${(card.value as number).toLocaleString('de-CH', { minimumFractionDigits: 2 })}`}
            </p>
          </Card>
        ))}
      </div>

      <KostenClient costs={costs as Parameters<typeof KostenClient>[0]['costs']} />
    </div>
  );
}
