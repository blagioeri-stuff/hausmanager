'use client';

import Link from 'next/link';
import { StatusDot } from '@/components/ui/Badge';
import { formatChf } from '@/lib/formatters';
import type { EnrichedComponent } from '@/types';

interface Props {
  components: EnrichedComponent[];
}

const STATUS_LABEL: Record<string, string> = {
  green: 'Gut',
  yellow: 'Mittel',
  red: 'Kritisch',
};

const STATUS_BG: Record<string, string> = {
  green: 'bg-green-50 border-green-100 hover:border-green-300',
  yellow: 'bg-yellow-50 border-yellow-100 hover:border-yellow-300',
  red: 'bg-red-50 border-red-100 hover:border-red-300',
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
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
      {sorted.map((c) => (
        <Link key={c.id} href={`/komponenten/${c.id}`}>
          <div className={`border rounded-xl p-4 transition-all cursor-pointer ${STATUS_BG[c.statusColor]}`}>
            <div className="flex items-center gap-2 mb-2">
              <StatusDot color={c.statusColor} />
              <span className="text-xs font-medium text-gray-500">{STATUS_LABEL[c.statusColor]}</span>
            </div>
            <p className="text-sm font-semibold text-gray-900 leading-tight mb-1 truncate">{c.name}</p>
            <p className="text-xs text-gray-500 mb-2 truncate">{c.typeDef.labelDe}</p>
            <div className="space-y-1">
              <div className="w-full h-1.5 bg-white/60 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${
                    c.statusColor === 'green' ? 'bg-green-500' : c.statusColor === 'yellow' ? 'bg-yellow-400' : 'bg-red-500'
                  }`}
                  style={{ width: `${Math.min(c.ageRatio * 100, 100)}%` }}
                />
              </div>
              <p className="text-xs text-gray-500">
                {c.yearsRemaining <= 0 ? (
                  <span className="text-red-600 font-medium">Fällig!</span>
                ) : (
                  `Erneuerung ${c.replacementYear}`
                )}
              </p>
              <p className="text-xs font-medium text-gray-700">{formatChf(c.annualSavingsChf)}/J.</p>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
