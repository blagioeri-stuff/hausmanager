'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Badge } from '@/components/ui/Badge';
import { formatChf } from '@/lib/formatters';
import { COMPONENT_TYPE_LIST } from '@/lib/component-types';
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

const STATUS_LABEL: Record<string, string> = {
  green: 'Gut',
  yellow: 'Mittel',
  red: 'Kritisch',
};

type StatusFilter = 'green' | 'yellow' | 'red';
type DueFilter = 5 | 10 | 15;
type RenovationType = 'planned' | 'calculated';

export function StatusGrid({ components }: Props) {
  const [statusFilters, setStatusFilters] = useState<Set<StatusFilter>>(new Set());
  const [typeFilters, setTypeFilters] = useState<Set<string>>(new Set());
  const [dueFilter, setDueFilter] = useState<DueFilter | null>(null);
  const [renovationFilter, setRenovationFilter] = useState<RenovationType | null>(null);

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

  // Alphabetical sort — consistent across all year views
  const sorted = [...components].sort((a, b) => a.name.localeCompare(b.name, 'de'));

  // Apply filters
  const filtered = sorted.filter((c) => {
    if (statusFilters.size > 0 && !statusFilters.has(c.statusColor as StatusFilter)) return false;
    if (typeFilters.size > 0 && !typeFilters.has(c.typeKey)) return false;
    if (dueFilter !== null && c.yearsRemaining > dueFilter) return false;
    if (renovationFilter === 'planned' && c.plannedRenovationYear === null) return false;
    if (renovationFilter === 'calculated' && c.plannedRenovationYear !== null) return false;
    return true;
  });

  const hasActiveFilters = statusFilters.size > 0 || typeFilters.size > 0 || dueFilter !== null || renovationFilter !== null;

  function toggleStatus(s: StatusFilter) {
    setStatusFilters((prev) => {
      const next = new Set(prev);
      next.has(s) ? next.delete(s) : next.add(s);
      return next;
    });
  }

  function toggleType(t: string) {
    setTypeFilters((prev) => {
      const next = new Set(prev);
      next.has(t) ? next.delete(t) : next.add(t);
      return next;
    });
  }

  function resetFilters() {
    setStatusFilters(new Set());
    setTypeFilters(new Set());
    setDueFilter(null);
    setRenovationFilter(null);
  }

  const chipBase = 'px-2.5 py-1 rounded-full text-xs font-medium border transition-colors cursor-pointer select-none';
  const chipActive = (color: string) => `bg-${color}-50 border-${color}-300 text-${color}-700`;
  const chipInactive = 'bg-gray-50 border-gray-200 text-gray-500 hover:border-gray-300';

  return (
    <div>
      {/* Filter bar */}
      <div className="flex flex-wrap gap-x-6 gap-y-2 mb-3 text-xs">
        {/* Status */}
        <div className="flex items-center gap-1.5">
          <span className="text-gray-400 font-medium mr-0.5">Status:</span>
          {(['green', 'yellow', 'red'] as StatusFilter[]).map((s) => (
            <button
              key={s}
              onClick={() => toggleStatus(s)}
              className={`${chipBase} ${statusFilters.has(s) ? chipActive(s === 'green' ? 'green' : s === 'yellow' ? 'yellow' : 'red') : chipInactive}`}
            >
              {STATUS_LABEL[s]}
            </button>
          ))}
        </div>

        {/* Fälligkeit */}
        <div className="flex items-center gap-1.5">
          <span className="text-gray-400 font-medium mr-0.5">Fällig in:</span>
          {([5, 10, 15] as DueFilter[]).map((y) => (
            <button
              key={y}
              onClick={() => setDueFilter(dueFilter === y ? null : y)}
              className={`${chipBase} ${dueFilter === y ? 'bg-blue-50 border-blue-300 text-blue-700' : chipInactive}`}
            >
              ≤{y} J.
            </button>
          ))}
        </div>

        {/* Erneuerungsart */}
        <div className="flex items-center gap-1.5">
          <span className="text-gray-400 font-medium mr-0.5">Art:</span>
          <button
            onClick={() => setRenovationFilter(renovationFilter === 'planned' ? null : 'planned')}
            className={`${chipBase} ${renovationFilter === 'planned' ? 'bg-gray-100 border-gray-400 text-gray-800' : chipInactive}`}
          >
            Geplant
          </button>
          <button
            onClick={() => setRenovationFilter(renovationFilter === 'calculated' ? null : 'calculated')}
            className={`${chipBase} ${renovationFilter === 'calculated' ? 'bg-gray-100 border-gray-400 text-gray-800 italic' : chipInactive}`}
          >
            Berechnet
          </button>
        </div>

        {/* Typ dropdown */}
        <div className="flex items-center gap-1.5">
          <span className="text-gray-400 font-medium mr-0.5">Typ:</span>
          <select
            multiple
            value={Array.from(typeFilters)}
            onChange={(e) => {
              const selected = new Set(Array.from(e.target.selectedOptions, (o) => o.value));
              setTypeFilters(selected);
            }}
            className="text-xs border border-gray-200 rounded px-1.5 py-0.5 text-gray-600 max-h-24"
            size={1}
            style={{ height: '26px' }}
          >
            {COMPONENT_TYPE_LIST.map((t) => (
              <option key={t.key} value={t.key}>{t.labelDe}</option>
            ))}
          </select>
          {typeFilters.size > 0 && (
            <span className="text-xs text-blue-600">{typeFilters.size} gewählt</span>
          )}
        </div>

        {/* Reset */}
        {hasActiveFilters && (
          <button
            onClick={resetFilters}
            className="text-xs text-gray-400 hover:text-gray-600 underline"
          >
            Filter zurücksetzen
          </button>
        )}
      </div>

      {/* Result count + CHF sum */}
      <div className="flex items-center justify-between mb-2">
        {hasActiveFilters ? (
          <p className="text-xs text-gray-400">
            {filtered.length} von {components.length} Komponenten
          </p>
        ) : <span />}
        <p className="text-xs text-gray-500">
          Summe:{' '}
          <span className="font-semibold text-blue-700">
            {formatChf(filtered.reduce((s, c) => s + c.annualSavingsChf, 0))} / Jahr
          </span>
          <span className="text-gray-400 ml-1">
            ({formatChf(filtered.reduce((s, c) => s + c.annualSavingsChf, 0) / 12)} / Mt.)
          </span>
        </p>
      </div>

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
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-gray-400 text-sm">
                  Keine Komponenten entsprechen den aktiven Filtern.
                </td>
              </tr>
            ) : (
              filtered.map((c) => {
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
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
