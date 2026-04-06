'use client';

import { useState } from 'react';
import {
  ComposedChart,
  Area,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import type { ReserveProjectionRow, RawComponent } from '@/types';
import { enrichComponentAtYear } from '@/lib/calculations';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';

interface Props {
  data: ReserveProjectionRow[];
  rawComponents?: RawComponent[];
}

function formatChfK(value: number) {
  if (Math.abs(value) >= 1000) return `${(value / 1000).toFixed(0)}k`;
  return `${value}`;
}

function formatChf(n: number) {
  return new Intl.NumberFormat('de-CH', { style: 'currency', currency: 'CHF', maximumFractionDigits: 0 }).format(n);
}

const STATUS_LABEL: Record<string, string> = { green: 'Gut', yellow: 'Mittel', red: 'Kritisch' };

const SERIES_LABELS: Record<string, string> = {
  istBalance: 'IST-Rücklagen',
  sollBalance: 'SOLL-Rücklagen',
  expenditure: 'Ausgaben',
};

type VisibleKey = 'istBalance' | 'sollBalance' | 'expenditure';

const SERIES_CONFIG: { key: VisibleKey; label: string; activeColor: string; dotColor: string }[] = [
  { key: 'istBalance', label: 'IST-Rücklagen', activeColor: '#16a34a', dotColor: '#bbf7d0' },
  { key: 'sollBalance', label: 'SOLL-Rücklagen', activeColor: '#f59e0b', dotColor: '#fef3c7' },
  { key: 'expenditure', label: 'Ausgaben', activeColor: '#ef4444', dotColor: '#fee2e2' },
];

function CustomTooltip({
  active,
  payload,
  label,
  rawComponents,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: number;
  rawComponents: RawComponent[];
}) {
  if (!active || !payload?.length) return null;

  const expendureComponents = label
    ? rawComponents
        .map((c) => enrichComponentAtYear(c, label))
        .filter((c) => c.replacementYear === label)
    : [];

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg px-4 py-3 text-sm min-w-[200px]">
      <p className="font-semibold text-gray-900 mb-1">
        {label}{' '}
        <span className="text-xs text-gray-400 font-normal">(klicken für Details)</span>
      </p>
      {payload.map((p) => (
        <div key={p.name}>
          <p style={{ color: p.color }}>
            {SERIES_LABELS[p.name] ?? p.name}: {formatChf(p.value)}
          </p>
          {p.name === 'expenditure' && expendureComponents.length > 0 && (
            <ul className="mt-0.5 ml-2 space-y-0.5">
              {expendureComponents.map((c) => (
                <li key={c.id} className="text-xs text-gray-500">
                  → {c.name} ({formatChf(c.effectiveCostChf)})
                </li>
              ))}
            </ul>
          )}
        </div>
      ))}
    </div>
  );
}

export function ReserveChart({ data, rawComponents = [] }: Props) {
  const currentYear = new Date().getFullYear();
  const filtered = data.filter((d) => d.year <= currentYear + 15);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [visible, setVisible] = useState<Record<VisibleKey, boolean>>({
    istBalance: true,
    sollBalance: true,
    expenditure: true,
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function handleClick(chartData: any) {
    const year = chartData?.activeLabel;
    if (year) setSelectedYear(Number(year));
  }

  function toggle(key: VisibleKey) {
    setVisible((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  const yearComponents = selectedYear
    ? rawComponents.map((c) => enrichComponentAtYear(c, selectedYear))
    : [];

  return (
    <>
      {/* Toggle pills */}
      <div className="flex flex-wrap gap-2 mb-3">
        {SERIES_CONFIG.map(({ key, label, activeColor, dotColor }) => (
          <button
            key={key}
            onClick={() => toggle(key)}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border transition-colors"
            style={
              visible[key]
                ? { backgroundColor: dotColor, borderColor: activeColor, color: activeColor }
                : { backgroundColor: '#f3f4f6', borderColor: '#d1d5db', color: '#9ca3af' }
            }
          >
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: visible[key] ? activeColor : '#d1d5db' }}
            />
            {label}
          </button>
        ))}
      </div>

      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={filtered}
            margin={{ top: 5, right: 10, left: 10, bottom: 5 }}
            onClick={handleClick}
            style={{ cursor: 'pointer' }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="year" tick={{ fontSize: 11 }} />
            <YAxis tickFormatter={formatChfK} tick={{ fontSize: 11 }} width={50} />
            <Tooltip content={<CustomTooltip rawComponents={rawComponents} />} />
            <ReferenceLine
              x={currentYear}
              stroke="#6366f1"
              strokeDasharray="4 4"
              label={{ value: 'Heute', fontSize: 11, fill: '#6366f1' }}
            />
            <ReferenceLine y={0} stroke="#ef4444" strokeDasharray="2 2" />
            <Bar dataKey="expenditure" fill="#f87171" opacity={0.7} name="expenditure" barSize={12} hide={!visible.expenditure} />
            <Area
              type="monotone"
              dataKey="istBalance"
              fill="#bbf7d0"
              stroke="#16a34a"
              strokeWidth={2}
              fillOpacity={0.35}
              name="istBalance"
              hide={!visible.istBalance}
            />
            <Line
              type="monotone"
              dataKey="sollBalance"
              stroke="#f59e0b"
              strokeWidth={2}
              strokeDasharray="6 3"
              dot={false}
              name="sollBalance"
              hide={!visible.sollBalance}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <Modal
        open={selectedYear !== null}
        onClose={() => setSelectedYear(null)}
        title={`Komponentenstatus ${selectedYear}`}
      >
        {selectedYear && (
          <div className="space-y-3">
            <p className="text-xs text-gray-500">Zustand aller Komponenten im Jahr {selectedYear}</p>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-400 border-b border-gray-100">
                  <th className="pb-2 font-medium">Komponente</th>
                  <th className="pb-2 font-medium text-right">Alter</th>
                  <th className="pb-2 font-medium text-right">SOLL-Reserve</th>
                  <th className="pb-2 font-medium text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {yearComponents
                  .sort((a, b) => {
                    const order = { red: 0, yellow: 1, green: 2 };
                    return order[a.statusColor] - order[b.statusColor];
                  })
                  .map((c) => (
                    <tr key={c.id}>
                      <td className="py-2">
                        <p className="font-medium text-gray-900">{c.name}</p>
                        <p className="text-xs text-gray-400">{c.typeDef.labelDe}</p>
                      </td>
                      <td className="py-2 text-right text-gray-700">
                        {c.ageYears} J.
                        {c.replacementYear === selectedYear && (
                          <span className="block text-xs text-red-500 font-medium">Erneuerung!</span>
                        )}
                      </td>
                      <td className="py-2 text-right text-amber-600 font-medium">
                        {formatChf(c.sollReserveChf)}
                      </td>
                      <td className="py-2 text-center">
                        <Badge color={c.statusColor}>{STATUS_LABEL[c.statusColor]}</Badge>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </Modal>
    </>
  );
}
