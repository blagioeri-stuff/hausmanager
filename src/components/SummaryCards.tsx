import { Card } from '@/components/ui/Card';
import { formatChf } from '@/lib/formatters';
import type { ReserveSummary } from '@/types';

interface Props {
  summary: ReserveSummary;
}

export function SummaryCards({ summary }: Props) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <Card>
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Jährl. Rücklage</p>
        <p className="text-2xl font-bold text-blue-600">{formatChf(summary.totalAnnualSavingsChf)}</p>
        <p className="text-xs text-gray-400 mt-1">pro Jahr zurücklegen</p>
      </Card>

      <Card>
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Gesamtreserve</p>
        <p className="text-2xl font-bold text-gray-900">{formatChf(summary.totalReserveNeededChf)}</p>
        <p className="text-xs text-gray-400 mt-1">noch zu sparen</p>
      </Card>

      <Card>
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Komponenten</p>
        <p className="text-2xl font-bold text-gray-900">{summary.componentCount}</p>
        <p className="text-xs text-gray-400 mt-1">
          {summary.componentsDueIn10Years.length > 0
            ? `${summary.componentsDueIn10Years.length} fällig in 10 J.`
            : 'Alle gut geplant'}
        </p>
      </Card>

      <Card>
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Nächste Erneuerung</p>
        {summary.nextReplacementComponent ? (
          <>
            <p className="text-2xl font-bold text-gray-900">{summary.nextReplacementYear}</p>
            <p className="text-xs text-gray-400 mt-1 truncate">{summary.nextReplacementComponent.name}</p>
          </>
        ) : (
          <p className="text-sm text-gray-400 mt-2">—</p>
        )}
      </Card>
    </div>
  );
}
