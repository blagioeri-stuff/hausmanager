import { prisma } from '@/lib/db';
import { enrichComponent, computeReserveSummary, buildReserveProjection } from '@/lib/calculations';
import { PageHeader } from '@/components/layout/PageHeader';
import { SummaryCards } from '@/components/SummaryCards';
import nextDynamic from 'next/dynamic';
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

    </div>
  );
}
