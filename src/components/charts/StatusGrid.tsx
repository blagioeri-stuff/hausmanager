'use client';

import Link from 'next/link';
import { Badge } from '@/components/ui/Badge';
import { formatChf } from '@/lib/formatters';
import type { EnrichedComponent } from '@/types';

interface Props {
  components: EnrichedComponent[];
}

function statusLabel(c: EnrichedComponent): string {
  if (c.yearsRemaining <= 0) return 'Lebensdauer erreicht';
  if (c.yearsRemaining <= 10) return `In ${c.yearsRemaining} J. fällig`;
  return `Erneuerung ${c.replacementYear}`;
}

const BAR_COLOR: Record<string, string> = {
  green: 'bg-green-500',
  yellow: 'bg-yellow-400',
  red: 'bg-red-500',
};

export function StatusGrid({ components }: Props) {
  if (components.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400">
        <p>Noch keine Komponenten erfasst.</p>
        <Link href="/komponenten/neu" className="text-blue-500 hover:underline text-sm mt-2 inline-block">
          Erste Komponente hinzufügen →
        </Link>
      </div>
    );
  }

  const sorted = [...components].sort((a, b) => {
    const order = { red: 0, yellow: 1, green: 2 };
    return order[a.statusColor] - order[b.statusColor];
  });

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs text-gray-400 border-b border-gray-100">
            <th className="pb-2 font-medium">Komponente</th>
            <th className="pb-2 font-medium hidden sm:table-cell">Typ</th>
            <th className="pb-2 font-medium">Lebensdauer</th>
            <th className="pb-2 font-medium text-right">Erneuerung</th>
            <th className="pb-2 font-medium text-right hidden md:table-cell">CHF/Jahr</th>
            <th className="pb-2 font-medium text-center">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {sorted.map((c) => {
            const pct = Math.min(Math.round(c.ageRatio * 100), 100);
            return (
              <tr key={c.id} className="hover:bg-gray-50 transition-colors group">
                <td className="py-2.5 pr-4">
                  <Link href={`/komponenten/${c.id}`} className="font-medium text-gray-900 hover:text-blue-600 group-hover:text-blue-600">
                    {c.name}
                  </Link>
                </td>
                <td className="py-2.5 pr-4 text-gray-500 hidden sm:table-cell whitespace-nowrap">
                  {c.typeDef.labelDe}
                </td>
                <td className="py-2.5 pr-4 min-w-[120px]">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${BAR_COLOR[c.statusColor]}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-400 w-8 text-right">{pct}%</span>
                  </div>
                </td>
                <td className="py-2.5 pr-4 text-right whitespace-nowrap">
                  <span className="text-xs text-gray-400">Zuletzt: {c.buildYear}</span>
                  <br />
                  {c.yearsRemaining <= 0 ? (
                    <span className="text-red-600 font-medium text-xs">Fällig!</span>
                  ) : c.plannedRenovationYear !== null ? (
                    <span className="text-gray-900 text-sm font-medium">{c.replacementYear} <span className="text-xs text-gray-400">({c.yearsRemaining} J.)</span></span>
                  ) : (
                    <span className="text-gray-400 text-sm italic">{c.replacementYear} <span className="text-xs">({c.yearsRemaining} J.)</span></span>
                  )}
                </td>
                <td className="py-2.5 pr-4 text-right hidden md:table-cell whitespace-nowrap">
                  <span className="font-medium text-gray-900">{formatChf(c.annualSavingsChf)}</span>
                  <span className="block text-xs text-gray-400">{formatChf(c.annualSavingsChf / 12)}/Mt.</span>
                </td>
                <td className="py-2.5 text-center">
                  <Badge color={c.statusColor}>{statusLabel(c)}</Badge>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
