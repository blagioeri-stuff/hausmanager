'use client';

import { useState } from 'react';
import Link from 'next/link';
import { formatChf } from '@/lib/formatters';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { DeleteComponentButton } from '@/components/DeleteComponentButton';
import { COMPONENT_TYPES } from '@/lib/component-types';
import type { EnrichedComponent } from '@/types';

type SortKey = 'name' | 'typeKey' | 'buildYear' | 'replacementYear' | 'yearsRemaining' | 'annualSavingsChf' | 'statusColor';
type SortDir = 'asc' | 'desc';

const STATUS_LABEL: Record<string, string> = {
  green: 'Gut',
  yellow: 'Mittel',
  red: 'Kritisch',
};

const STATUS_ORDER: Record<string, number> = { red: 0, yellow: 1, green: 2 };

function sortComponents(components: EnrichedComponent[], key: SortKey, dir: SortDir) {
  return [...components].sort((a, b) => {
    let av: string | number = a[key] as string | number;
    let bv: string | number = b[key] as string | number;
    if (key === 'statusColor') {
      av = STATUS_ORDER[a.statusColor] ?? 99;
      bv = STATUS_ORDER[b.statusColor] ?? 99;
    } else if (key === 'typeKey') {
      av = COMPONENT_TYPES[a.typeKey]?.labelDe ?? a.typeKey;
      bv = COMPONENT_TYPES[b.typeKey]?.labelDe ?? b.typeKey;
    }
    if (av < bv) return dir === 'asc' ? -1 : 1;
    if (av > bv) return dir === 'asc' ? 1 : -1;
    return 0;
  });
}

function SortIcon({ active, dir }: { active: boolean; dir: SortDir }) {
  if (!active) return (
    <svg className="h-3 w-3 text-gray-300 inline ml-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M7 15l5 5 5-5M7 9l5-5 5 5" />
    </svg>
  );
  return dir === 'asc' ? (
    <svg className="h-3 w-3 text-blue-500 inline ml-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M7 15l5 5 5-5" />
    </svg>
  ) : (
    <svg className="h-3 w-3 text-blue-500 inline ml-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M7 9l5-5 5 5" />
    </svg>
  );
}

interface Props {
  components: EnrichedComponent[];
}

export function KomponentenTable({ components }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>('statusColor');
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  }

  const sorted = sortComponents(components, sortKey, sortDir);

  function Th({ label, colKey, align = 'left' }: { label: string; colKey: SortKey; align?: 'left' | 'right' | 'center' }) {
    const active = sortKey === colKey;
    return (
      <th
        className={`px-4 py-3 font-medium text-gray-500 cursor-pointer select-none hover:text-gray-700 whitespace-nowrap text-${align}`}
        onClick={() => handleSort(colKey)}
      >
        {label}
        <SortIcon active={active} dir={sortDir} />
      </th>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 border-b border-gray-100">
          <tr>
            <Th label="Bezeichnung" colKey="name" />
            <Th label="Typ" colKey="typeKey" />
            <Th label="Baujahr" colKey="buildYear" align="right" />
            <Th label="Erneuerung" colKey="replacementYear" align="right" />
            <Th label="Verbleibend" colKey="yearsRemaining" align="right" />
            <Th label="Jährl. Rücklage" colKey="annualSavingsChf" align="right" />
            <Th label="Status" colKey="statusColor" align="center" />
            <th className="px-4 py-3 text-right font-medium text-gray-500">Aktionen</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {sorted.map((c) => (
            <tr key={c.id} className="hover:bg-gray-50 transition-colors">
              <td className="px-4 py-3">
                <Link href={`/komponenten/${c.id}`} className="font-medium text-gray-900 hover:text-blue-600">
                  {c.name}
                </Link>
              </td>
              <td className="px-4 py-3 text-gray-500">
                {COMPONENT_TYPES[c.typeKey]?.labelDe ?? c.typeKey}
              </td>
              <td className="px-4 py-3 text-right text-gray-700">{c.buildYear}</td>
              <td className="px-4 py-3 text-right text-gray-700">{c.replacementYear}</td>
              <td className="px-4 py-3 text-right">
                <span className={c.yearsRemaining <= 0 ? 'text-red-600 font-medium' : c.yearsRemaining <= 5 ? 'text-yellow-600 font-medium' : 'text-gray-700'}>
                  {c.yearsRemaining <= 0 ? 'Fällig!' : `${c.yearsRemaining} J.`}
                </span>
              </td>
              <td className="px-4 py-3 text-right">
                <span className="font-medium text-gray-900">{formatChf(c.annualSavingsChf)}</span>
                <span className="block text-xs text-gray-400">{formatChf(c.annualSavingsChf / 12)} / Mt.</span>
              </td>
              <td className="px-4 py-3 text-center">
                <Badge color={c.statusColor}>{STATUS_LABEL[c.statusColor]}</Badge>
              </td>
              <td className="px-4 py-3 text-right">
                <div className="flex gap-1 justify-end">
                  <Link href={`/komponenten/${c.id}/bearbeiten`} title="Bearbeiten">
                    <Button variant="ghost" size="sm" className="p-1.5">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                    </Button>
                  </Link>
                  <DeleteComponentButton id={c.id} name={c.name} />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
