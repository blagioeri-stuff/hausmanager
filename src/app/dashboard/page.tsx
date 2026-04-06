import { prisma } from '@/lib/db';
import { enrichComponent, computeReserveSummary, buildReserveProjection } from '@/lib/calculations';
import { PageHeader } from '@/components/layout/PageHeader';
import { SummaryCards } from '@/components/SummaryCards';
import nextDynamic from 'next/dynamic';
import { Card, CardTitle } from '@/components/ui/Card';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';

export const dynamic = 'force-dynamic';

const DashboardCharts = nextDynamic(
  () => import('@/components/DashboardCharts').then((m) => m.DashboardCharts),
  { ssr: false }
);

export default async function DashboardPage() {
  const [raw, istSetting, monthlySetting] = await Promise.all([
    prisma.homeComponent.findMany({ orderBy: { createdAt: 'desc' } }),
    prisma.setting.findUnique({ where: { key: 'istReserveChf' } }),
    prisma.setting.findUnique({ where: { key: 'monthlyContributionChf' } }),
  ]);

  const istReserveChf = parseFloat(istSetting?.value ?? '0') || 0;
  const annualContribution = (parseFloat(monthlySetting?.value ?? '0') || 0) * 12;

  const rawComponents = raw.map((c) => ({
    ...c,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
  }));
  const enriched = rawComponents.map((c) => enrichComponent(c));

  const summary = computeReserveSummary(enriched, istReserveChf);
  const projection = buildReserveProjection(enriched, 15, istReserveChf, annualContribution);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Dashboard"
        subtitle="Übersicht Ihrer Hauskomponenten und Rücklagenplanung"
        action={
          <Link href="/komponenten/neu">
            <Button>+ Komponente</Button>
          </Link>
        }
      />

      <SummaryCards summary={summary} monthlyContributionChf={parseFloat(monthlySetting?.value ?? '0') || 0} />

      <DashboardCharts
        rawComponents={rawComponents}
        projection={projection}
        enriched={enriched}
      />

      {summary.componentsDueIn10Years.length > 0 && (
        <Card>
          <div className="mb-4">
            <CardTitle>Fällig in den nächsten 10 Jahren</CardTitle>
          </div>
          <div className="space-y-2">
            {summary.componentsDueIn10Years.map((c) => (
              <Link key={c.id} href={`/komponenten/${c.id}`}>
                <div className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-gray-50 transition-colors">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{c.name}</p>
                    <p className="text-xs text-gray-400">{c.typeDef.labelDe}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-900">{c.replacementYear}</p>
                    <p className="text-xs text-gray-400">
                      {c.yearsRemaining <= 0 ? 'Fällig!' : `in ${c.yearsRemaining} J.`}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
