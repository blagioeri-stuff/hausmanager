import { Card } from '@/components/ui/Card';
import { formatChf } from '@/lib/formatters';
import type { ReserveSummary } from '@/types';

interface Props {
  summary: ReserveSummary;
  monthlyContributionChf?: number;
}

function deckungsgradColor(pct: number): string {
  if (pct >= 100) return 'text-green-600';
  if (pct >= 75) return 'text-yellow-500';
  return 'text-red-500';
}

export function SummaryCards({ summary, monthlyContributionChf }: Props) {
  const { deckungsgradPct, istReserveChf, totalSollReserveChf } = summary;
  const hasIst = istReserveChf > 0;

  return (
    <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
      <Card>
        <p className="text-[10px] md:text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Jährl. Rücklage</p>
        <p className="text-lg md:text-2xl font-bold text-blue-600 truncate">{formatChf(summary.totalAnnualSavingsChf)}</p>
        <p className="text-[10px] md:text-xs text-gray-400 mt-1">
          {formatChf(summary.totalAnnualSavingsChf / 12)} / Mt.
          {monthlyContributionChf != null && monthlyContributionChf > 0 && (
            <span className="block text-green-600">IST: {formatChf(monthlyContributionChf)} / Mt.</span>
          )}
        </p>
      </Card>

      <Card>
        <p className="text-[10px] md:text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Deckungsgrad</p>
        {hasIst && deckungsgradPct !== null ? (
          <>
            <p className={`text-lg md:text-2xl font-bold ${deckungsgradColor(deckungsgradPct)}`}>
              {Math.round(deckungsgradPct)} %
            </p>
            <p className="text-[10px] md:text-xs text-gray-400 mt-1">
              IST {formatChf(istReserveChf)}
              <span className="block">SOLL {formatChf(totalSollReserveChf)}</span>
            </p>
          </>
        ) : (
          <>
            <p className="text-lg md:text-2xl font-bold text-gray-300">—</p>
            <p className="text-[10px] md:text-xs text-gray-400 mt-1">
              {totalSollReserveChf > 0
                ? `SOLL: ${formatChf(totalSollReserveChf)}`
                : 'In Einstellungen erfassen'}
            </p>
          </>
        )}
      </Card>

      <Card>
        <p className="text-[10px] md:text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Komponenten</p>
        <p className="text-lg md:text-2xl font-bold text-gray-900">{summary.componentCount}</p>
        <p className="text-[10px] md:text-xs text-gray-400 mt-1">
          {summary.componentsDueIn10Years.length > 0
            ? `${summary.componentsDueIn10Years.length} fällig in 10 J.`
            : 'Alle gut geplant'}
        </p>
      </Card>

      <Card>
        <p className="text-[10px] md:text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Nächste Erneuerung</p>
        {summary.nextReplacementComponent ? (
          <>
            <p className="text-lg md:text-2xl font-bold text-gray-900">{summary.nextReplacementYear}</p>
            <p className="text-[10px] md:text-xs text-gray-400 mt-1 truncate">{summary.nextReplacementComponent.name}</p>
          </>
        ) : (
          <p className="text-sm text-gray-400 mt-2">—</p>
        )}
      </Card>
    </div>
  );
}
