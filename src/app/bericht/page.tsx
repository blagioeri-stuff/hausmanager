import { prisma } from '@/lib/db';
import { enrichComponent, computeReserveSummary } from '@/lib/calculations';
import { formatChf } from '@/lib/formatters';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { PrintButton } from '@/components/PrintButton';

export const dynamic = 'force-dynamic';

const STATUS_LABEL: Record<string, string> = { green: 'Gut', yellow: 'Mittel', red: 'Kritisch' };
const STATUS_COLOR: Record<string, string> = {
  green: 'text-green-600',
  yellow: 'text-yellow-600',
  red: 'text-red-600',
};

export default async function BerichtPage() {
  const today = new Date();
  const dateStr = today.toLocaleDateString('de-CH', { dateStyle: 'long' });

  const [rawComponents, istSetting, monthlySetting, houseNameSetting, houseAddressSetting] = await Promise.all([
    prisma.homeComponent.findMany({
      orderBy: { name: 'asc' },
      include: { maintenance: { orderBy: { date: 'desc' }, take: 1 } },
    }),
    prisma.setting.findUnique({ where: { key: 'istReserveChf' } }),
    prisma.setting.findUnique({ where: { key: 'monthlyContributionChf' } }),
    prisma.setting.findUnique({ where: { key: 'houseName' } }),
    prisma.setting.findUnique({ where: { key: 'houseAddress' } }),
  ]);

  const istReserveChf = parseFloat(istSetting?.value ?? '0') || 0;
  const monthlyContribution = parseFloat(monthlySetting?.value ?? '0') || 0;
  const houseName = houseNameSetting?.value ?? 'Mein Haus';
  const houseAddress = houseAddressSetting?.value ?? '';

  const enriched = rawComponents.map((c) =>
    enrichComponent({
      ...c,
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt.toISOString(),
    })
  );

  const summary = computeReserveSummary(enriched, istReserveChf);

  const statusCounts = { green: 0, yellow: 0, red: 0 };
  for (const c of enriched) statusCounts[c.statusColor]++;

  const componentsByStatus = {
    red: enriched.filter((c) => c.statusColor === 'red').sort((a, b) => a.yearsRemaining - b.yearsRemaining),
    yellow: enriched.filter((c) => c.statusColor === 'yellow').sort((a, b) => a.yearsRemaining - b.yearsRemaining),
    green: enriched.filter((c) => c.statusColor === 'green').sort((a, b) => a.yearsRemaining - b.yearsRemaining),
  };

  return (
    <div className="max-w-4xl">
      {/* Print button — hidden in print */}
      <div className="print:hidden mb-6 flex items-center justify-between gap-4">
        <PageHeader
          title="PDF-Bericht"
          subtitle="Drucken oder als PDF speichern"
        />
        <PrintButton />
      </div>

      {/* Report content */}
      <div className="space-y-6 print:space-y-4">
        {/* Header */}
        <div className="border-b-2 border-gray-900 pb-4">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{houseName}</h1>
              {houseAddress && <p className="text-gray-500 mt-0.5">{houseAddress}</p>}
              <p className="text-sm text-gray-400 mt-1">Hausmanager — Rücklagenplanung</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Bericht vom</p>
              <p className="text-sm font-medium text-gray-900">{dateStr}</p>
            </div>
          </div>
        </div>

        {/* Summary */}
        <Card>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Zusammenfassung</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Deckungsgrad</p>
              {summary.deckungsgradPct !== null ? (
                <p className={`text-2xl font-bold ${
                  summary.deckungsgradPct >= 100 ? 'text-green-600' :
                  summary.deckungsgradPct >= 75 ? 'text-yellow-500' : 'text-red-500'
                }`}>
                  {Math.round(summary.deckungsgradPct)}%
                </p>
              ) : (
                <p className="text-2xl font-bold text-gray-300">—</p>
              )}
              <p className="text-xs text-gray-400 mt-0.5">
                IST: {formatChf(istReserveChf)}<br />
                SOLL: {formatChf(summary.totalSollReserveChf)}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Jährl. Rücklage</p>
              <p className="text-2xl font-bold text-blue-600">{formatChf(summary.totalAnnualSavingsChf)}</p>
              <p className="text-xs text-gray-400 mt-0.5">
                {formatChf(summary.totalAnnualSavingsChf / 12)} / Monat
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Komponenten</p>
              <p className="text-2xl font-bold text-gray-900">{enriched.length}</p>
              <p className="text-xs text-gray-400 mt-0.5">
                <span className="text-green-600">{statusCounts.green} gut</span> ·{' '}
                <span className="text-yellow-500">{statusCounts.yellow} mittel</span> ·{' '}
                <span className="text-red-500">{statusCounts.red} kritisch</span>
              </p>
            </div>
            {monthlyContribution > 0 && (
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Monatl. Einzahlung</p>
                <p className="text-2xl font-bold text-green-600">{formatChf(monthlyContribution)}</p>
                <p className="text-xs text-gray-400 mt-0.5">SOLL: {formatChf(summary.totalAnnualSavingsChf / 12)}</p>
              </div>
            )}
          </div>
        </Card>

        {/* Components by status */}
        {(['red', 'yellow', 'green'] as const).map((status) => {
          const items = componentsByStatus[status];
          if (items.length === 0) return null;
          return (
            <Card key={status}>
              <h2 className="text-base font-semibold text-gray-900 mb-3">
                <span className={STATUS_COLOR[status]}>{STATUS_LABEL[status]}</span>
                {' '}— {items.length} Komponenten
              </h2>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-left">
                    <th className="pb-2 font-medium text-gray-500 text-xs uppercase tracking-wider">Komponente</th>
                    <th className="pb-2 font-medium text-gray-500 text-xs uppercase tracking-wider">Baujahr</th>
                    <th className="pb-2 font-medium text-gray-500 text-xs uppercase tracking-wider">Erneuerung</th>
                    <th className="pb-2 font-medium text-gray-500 text-xs uppercase tracking-wider text-right">Jährl. Rücklage</th>
                    <th className="pb-2 font-medium text-gray-500 text-xs uppercase tracking-wider text-right">Ersatzkosten</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((c) => (
                    <tr key={c.id} className="border-b border-gray-50 last:border-0">
                      <td className="py-2 pr-4">
                        <p className="font-medium text-gray-900">{c.name}</p>
                        <p className="text-xs text-gray-400">{c.typeDef.labelDe}</p>
                      </td>
                      <td className="py-2 pr-4 text-gray-700">{c.buildYear}</td>
                      <td className="py-2 pr-4">
                        <span className="font-medium text-gray-900">{c.replacementYear}</span>
                        <span className="text-xs text-gray-400 ml-1">
                          ({c.yearsRemaining <= 0 ? 'Fällig' : `in ${c.yearsRemaining} J.`})
                        </span>
                      </td>
                      <td className="py-2 pr-4 text-right text-blue-600 font-medium">{formatChf(c.annualSavingsChf)}</td>
                      <td className="py-2 text-right text-gray-700">{formatChf(c.effectiveCostChf)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          );
        })}

        {/* Footer */}
        <div className="border-t border-gray-200 pt-4 text-center">
          <p className="text-xs text-gray-400">
            Hausmanager · Erstellt am {dateStr} · Alle Beträge in CHF
          </p>
        </div>
      </div>

    </div>
  );
}
