import { prisma } from '@/lib/db';
import { enrichComponent, computeReserveSummary, buildReserveProjection } from '@/lib/calculations';
import { PageHeader } from '@/components/layout/PageHeader';
import { SummaryCards } from '@/components/SummaryCards';
import { StatusGrid } from '@/components/charts/StatusGrid';
import nextDynamic from 'next/dynamic';
import { Card, CardTitle } from '@/components/ui/Card';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';

export const dynamic = 'force-dynamic';

const ReserveChart = nextDynamic(() => import('@/components/charts/ReserveChart').then(m => m.ReserveChart), { ssr: false });
const AnnualCostChart = nextDynamic(() => import('@/components/charts/AnnualCostChart').then(m => m.AnnualCostChart), { ssr: false });

export default async function DashboardPage() {
  const raw = await prisma.homeComponent.findMany({ orderBy: { createdAt: 'desc' } });
  const rawComponents = raw.map((c) => ({
    ...c,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
  }));
  const enriched = rawComponents.map(enrichComponent);

  const summary = computeReserveSummary(enriched);
  const projection = buildReserveProjection(enriched);

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

      <SummaryCards summary={summary} />

      <Card>
        <div className="mb-4">
          <CardTitle>Komponentenstatus</CardTitle>
          <p className="text-xs text-gray-400 mt-1">Ampeldarstellung — Klick auf Kachel für Details</p>
        </div>
        <StatusGrid components={enriched} />
      </Card>

      {enriched.length > 0 && (
        <div className="space-y-6">
          <Card>
            <div className="mb-4">
              <CardTitle>Reserve-Projektion (30 Jahre)</CardTitle>
              <p className="text-xs text-gray-400 mt-1">Blau = Guthaben · Rot = Ausgaben · Klick auf Jahr für Details</p>
            </div>
            <ReserveChart data={projection} rawComponents={rawComponents} />
          </Card>

          <Card>
            <div className="mb-4">
              <CardTitle>Jährliche Rücklage pro Komponente</CardTitle>
              <p className="text-xs text-gray-400 mt-1">Farbe = Status (grün/gelb/rot)</p>
            </div>
            <AnnualCostChart components={enriched} />
          </Card>
        </div>
      )}

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
