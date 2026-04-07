import { prisma } from '@/lib/db';
import { enrichComponent, computeReserveSummary } from '@/lib/calculations';
import { formatChf } from '@/lib/formatters';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

const STATUS_LABEL: Record<string, string> = { green: 'Gut', yellow: 'Mittel', red: 'Kritisch' };
const STATUS_COLOR: Record<string, string> = {
  green: 'bg-green-100 text-green-700',
  yellow: 'bg-yellow-100 text-yellow-700',
  red: 'bg-red-100 text-red-700',
};
const STATUS_DOT: Record<string, string> = {
  green: 'bg-green-500',
  yellow: 'bg-yellow-400',
  red: 'bg-red-500',
};

function DeckungsgradBar({ pct }: { pct: number }) {
  const capped = Math.min(pct, 100);
  const color = pct >= 100 ? 'bg-green-500' : pct >= 75 ? 'bg-yellow-400' : 'bg-red-500';
  const textColor = pct >= 100 ? 'text-green-700' : pct >= 75 ? 'text-yellow-600' : 'text-red-600';
  return (
    <div>
      <div className="flex items-end gap-3 mb-2">
        <span className={`text-4xl font-bold ${textColor}`}>{Math.round(pct)}%</span>
        <span className="text-sm text-gray-400 pb-1">Deckungsgrad</span>
      </div>
      <div className="w-full h-4 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${capped}%` }} />
      </div>
      <p className="text-xs text-gray-400 mt-1">IST-Reserve im Vergleich zur benötigten SOLL-Reserve</p>
    </div>
  );
}

export default async function DashboardKIPage() {
  const currentYear = new Date().getFullYear();
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

  const [rawComponents, istSetting, monthlySetting, recurringCosts] = await Promise.all([
    prisma.homeComponent.findMany({
      orderBy: { name: 'asc' },
      include: {
        maintenance: { orderBy: { date: 'desc' }, take: 1 },
      },
    }),
    prisma.setting.findUnique({ where: { key: 'istReserveChf' } }),
    prisma.setting.findUnique({ where: { key: 'monthlyContributionChf' } }),
    prisma.cost.findMany({ where: { type: 'wiederkehrend' } }),
  ]);

  const istReserveChf = parseFloat(istSetting?.value ?? '0') || 0;
  const monthlyContribution = parseFloat(monthlySetting?.value ?? '0') || 0;

  const enriched = rawComponents.map((c) =>
    enrichComponent({
      ...c,
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt.toISOString(),
    })
  );

  const summary = computeReserveSummary(enriched, istReserveChf);

  // Status counts
  const statusCounts = { green: 0, yellow: 0, red: 0 };
  for (const c of enriched) statusCounts[c.statusColor]++;

  // Next due components (within 15 years, sorted by yearsRemaining)
  const nextDue = enriched
    .filter((c) => c.yearsRemaining <= 15)
    .sort((a, b) => a.yearsRemaining - b.yearsRemaining)
    .slice(0, 5);

  // Wartungserinnerungen: components that haven't been maintained within their interval
  // Components with maintenanceIntervalMonths set are always checked;
  // components without use 12-month fallback but only if yellow/red
  const wartungsErinnerungen = rawComponents
    .filter((c) => {
      const intervalMonths = c.maintenanceIntervalMonths ?? 12;
      const thresholdDate = new Date();
      thresholdDate.setMonth(thresholdDate.getMonth() - intervalMonths);
      // Without a custom interval, only warn for yellow/red components
      if (!c.maintenanceIntervalMonths) {
        const enriched_c = enriched.find((e) => e.id === c.id);
        if (!enriched_c || enriched_c.statusColor === 'green') return false;
      }
      if (c.maintenance.length === 0) return true;
      const lastMaintenance = new Date(c.maintenance[0].date);
      return lastMaintenance < thresholdDate;
    })
    .slice(0, 5);

  // Annual recurring costs
  const annualRecurringCosts = recurringCosts.reduce((sum, c) => {
    if (c.recurrence === 'monatlich') return sum + c.amountChf * 12;
    if (c.recurrence === 'vierteljährlich') return sum + c.amountChf * 4;
    return sum + c.amountChf; // jährlich or unknown
  }, 0);

  const totalAnnualCosts = summary.totalAnnualSavingsChf + annualRecurringCosts;
  const hasIst = istReserveChf > 0;

  return (
    <div className="max-w-4xl space-y-6">
      <PageHeader
        title="KI-Dashboard"
        subtitle="Vereinfachte Übersicht — wichtigste Kennzahlen auf einen Blick"
        action={
          <Link href="/dashboard" className="text-sm text-gray-500 hover:text-blue-600">
            → Zum klassischen Dashboard
          </Link>
        }
      />

      {/* Top KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Deckungsgrad */}
        <Card className="sm:col-span-2">
          {hasIst && summary.deckungsgradPct !== null ? (
            <DeckungsgradBar pct={summary.deckungsgradPct} />
          ) : (
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Deckungsgrad</p>
              <p className="text-4xl font-bold text-gray-200">—</p>
              <p className="text-xs text-gray-400 mt-2">
                IST-Reserve in{' '}
                <Link href="/einstellungen" className="text-blue-600 hover:underline">
                  Einstellungen
                </Link>{' '}
                erfassen
              </p>
            </div>
          )}
        </Card>

        {/* Status Ampel */}
        <Card>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">Komponentenstatus</p>
          <div className="space-y-2">
            {(['green', 'yellow', 'red'] as const).map((s) => (
              <div key={s} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-2.5 h-2.5 rounded-full ${STATUS_DOT[s]}`} />
                  <span className="text-sm text-gray-600">{STATUS_LABEL[s]}</span>
                </div>
                <span className="text-sm font-semibold text-gray-900">{statusCounts[s]}</span>
              </div>
            ))}
            <div className="pt-1 border-t border-gray-100">
              <p className="text-xs text-gray-400">{enriched.length} Komponenten total</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Kosten-Übersicht */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Rücklagen / Jahr</p>
          <p className="text-2xl font-bold text-blue-600">{formatChf(summary.totalAnnualSavingsChf)}</p>
          <p className="text-xs text-gray-400 mt-1">{formatChf(summary.totalAnnualSavingsChf / 12)} / Monat</p>
        </Card>
        <Card>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Wiederkehr. Kosten / Jahr</p>
          <p className="text-2xl font-bold text-orange-500">{formatChf(annualRecurringCosts)}</p>
          <p className="text-xs text-gray-400 mt-1">{recurringCosts.length} Positionen</p>
        </Card>
        <Card>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Gesamtkosten / Jahr</p>
          <p className="text-2xl font-bold text-gray-900">{formatChf(totalAnnualCosts)}</p>
          <p className="text-xs text-gray-400 mt-1">{formatChf(totalAnnualCosts / 12)} / Monat</p>
        </Card>
      </div>

      {/* Nächste fällige Komponenten */}
      {nextDue.length > 0 && (
        <Card>
          <h2 className="text-base font-semibold text-gray-900 mb-3">Nächste Erneuerungen</h2>
          <div className="space-y-2">
            {nextDue.map((c) => (
              <Link
                key={c.id}
                href={`/komponenten/${c.id}`}
                className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-gray-50 transition-colors -mx-1"
              >
                <div className="flex items-center gap-3">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLOR[c.statusColor]}`}>
                    {STATUS_LABEL[c.statusColor]}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{c.name}</p>
                    <p className="text-xs text-gray-400">{c.typeDef.labelDe}</p>
                  </div>
                </div>
                <div className="text-right shrink-0 ml-4">
                  <p className="text-sm font-semibold text-gray-900">{c.replacementYear}</p>
                  <p className="text-xs text-gray-400">
                    {c.yearsRemaining <= 0 ? 'Fällig!' : `in ${c.yearsRemaining} J.`}
                  </p>
                </div>
              </Link>
            ))}
          </div>
          {enriched.filter((c) => c.yearsRemaining <= 15).length > 5 && (
            <div className="mt-2 pt-2 border-t border-gray-100">
              <Link href="/komponenten" className="text-xs text-blue-600 hover:underline">
                Alle {enriched.filter((c) => c.yearsRemaining <= 15).length} Komponenten ansehen →
              </Link>
            </div>
          )}
        </Card>
      )}

      {/* Wartungserinnerungen */}
      {wartungsErinnerungen.length > 0 && (
        <Card>
          <div className="flex items-center gap-2 mb-3">
            <svg className="h-4 w-4 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <h2 className="text-base font-semibold text-gray-900">Wartungserinnerungen</h2>
          </div>
          <p className="text-xs text-gray-400 mb-3">
            Komponenten, die ihr Wartungsintervall überschritten haben oder noch nie gewartet wurden.
          </p>
          <div className="space-y-2">
            {wartungsErinnerungen.map((c) => {
              const lastDate = c.maintenance[0]?.date;
              const enriched_c = enriched.find((e) => e.id === c.id)!;
              return (
                <Link
                  key={c.id}
                  href={`/komponenten/${c.id}`}
                  className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-amber-50 transition-colors -mx-1 border border-transparent hover:border-amber-100"
                >
                  <div className="flex items-center gap-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLOR[enriched_c.statusColor]}`}>
                      {STATUS_LABEL[enriched_c.statusColor]}
                    </span>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{c.name}</p>
                      <p className="text-xs text-gray-400">
                        {lastDate
                          ? `Letzte Wartung: ${new Date(lastDate).toLocaleDateString('de-CH', { dateStyle: 'medium' })}`
                          : 'Noch keine Wartung erfasst'}
                        {c.maintenanceIntervalMonths && (
                          <span className="ml-1 text-amber-500">(alle {c.maintenanceIntervalMonths} Mt.)</span>
                        )}
                      </p>
                    </div>
                  </div>
                  <svg className="h-4 w-4 text-gray-300 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              );
            })}
          </div>
        </Card>
      )}

      {/* Monatliche Einzahlung */}
      {monthlyContribution > 0 && (
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Monatliche Einzahlung (IST)</p>
              <p className="text-xl font-bold text-green-600">{formatChf(monthlyContribution)} / Monat</p>
              <p className="text-xs text-gray-400 mt-1">
                SOLL: {formatChf(summary.totalAnnualSavingsChf / 12)} / Monat ·{' '}
                {monthlyContribution >= summary.totalAnnualSavingsChf / 12 ? (
                  <span className="text-green-600">Überschuss {formatChf(monthlyContribution - summary.totalAnnualSavingsChf / 12)} / Mt.</span>
                ) : (
                  <span className="text-red-500">Fehlbetrag {formatChf(summary.totalAnnualSavingsChf / 12 - monthlyContribution)} / Mt.</span>
                )}
              </p>
            </div>
            <Link href="/einstellungen" className="text-xs text-gray-400 hover:text-blue-600">
              Bearbeiten
            </Link>
          </div>
        </Card>
      )}

      {enriched.length === 0 && (
        <Card>
          <div className="text-center py-12">
            <p className="text-gray-400 mb-3">Noch keine Komponenten erfasst.</p>
            <Link href="/komponenten/neu" className="text-sm text-blue-600 hover:underline">
              + Erste Komponente erfassen
            </Link>
          </div>
        </Card>
      )}
    </div>
  );
}
