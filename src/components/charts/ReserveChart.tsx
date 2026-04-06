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
import { enrichComponentAtYear, getExpenditureComponentsForYear } from '@/lib/calculations';

interface Props {
  data: ReserveProjectionRow[];
  rawComponents?: RawComponent[];
  selectedYear?: number | null;
  onYearSelect?: (year: number) => void;
}

function formatChfK(value: number) {
  if (Math.abs(value) >= 1000) return `${(value / 1000).toFixed(0)}k`;
  return `${value}`;
}

function formatChf(n: number) {
  return new Intl.NumberFormat('de-CH', { style: 'currency', currency: 'CHF', maximumFractionDigits: 0 }).format(n);
}

const SERIES_LABELS: Record<string, string> = {
  istBalance: 'IST-Rücklagen',
  sollBalance: 'SOLL-Rücklagen',
  expenditurePlanned: 'Ausgaben (geplant)',
  expenditureCalculated: 'Ausgaben (berechnet)',
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

  const expenditureRaw = label ? getExpenditureComponentsForYear(rawComponents, label) : [];
  const expenditureEnriched = expenditureRaw.map((c) => enrichComponentAtYear(c, label!));

  // Merge the two expenditure series into one tooltip entry
  const mergedPayload: Array<{ name: string; value: number; color: string }> = [];
  let expenditureTotal = 0;
  for (const p of payload) {
    if (p.name === 'expenditurePlanned' || p.name === 'expenditureCalculated') {
      expenditureTotal += p.value;
    } else {
      mergedPayload.push(p);
    }
  }
  if (expenditureTotal > 0) {
    mergedPayload.unshift({ name: 'expenditure', value: expenditureTotal, color: '#ef4444' });
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg px-4 py-3 text-sm min-w-[200px]">
      <p className="font-semibold text-gray-900 mb-1">
        {label}{' '}
        <span className="text-xs text-gray-400 font-normal">(klicken für Details)</span>
      </p>
      {mergedPayload.map((p) => (
        <div key={p.name}>
          <p style={{ color: p.color }}>
            {SERIES_LABELS[p.name] ?? p.name}: {formatChf(p.value)}
          </p>
          {p.name === 'expenditure' && expenditureEnriched.length > 0 && (
            <ul className="mt-0.5 ml-2 space-y-0.5">
              {expenditureEnriched.map((c) => {
                const isPlanned = c.plannedRenovationYear !== null ||
                  rawComponents.find(r => r.id === c.id)?.plannedRenovationYear !== null;
                return (
                  <li key={c.id} className="text-xs text-gray-500">
                    → {c.name} ({formatChf(c.effectiveCostChf)}){isPlanned ? '' : ' *'}
                  </li>
                );
              })}
              {expenditureEnriched.some(c => rawComponents.find(r => r.id === c.id)?.plannedRenovationYear === null) && (
                <li className="text-xs text-gray-400 mt-1">* = berechnetes Datum</li>
              )}
            </ul>
          )}
        </div>
      ))}
    </div>
  );
}

export function ReserveChart({ data, rawComponents = [], selectedYear, onYearSelect }: Props) {
  const currentYear = new Date().getFullYear();
  const filtered = data.filter((d) => d.year <= currentYear + 15);
  const [visible, setVisible] = useState<Record<VisibleKey, boolean>>({
    istBalance: true,
    sollBalance: true,
    expenditure: true,
  });

  // Compute Y-axis domain from actual data to avoid excessive negative space
  const allValues = filtered.flatMap((d) => [d.istBalance, d.sollBalance]);
  const dataMin = Math.min(0, ...allValues);
  const dataMax = Math.max(...allValues, ...filtered.map(d => d.expenditure));
  const yMin = dataMin < 0 ? Math.floor(dataMin / 10000) * 10000 : 0;
  const yMax = Math.ceil(dataMax / 10000) * 10000;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function handleClick(chartData: any) {
    const year = chartData?.activeLabel;
    if (year && onYearSelect) onYearSelect(Number(year));
  }

  function toggle(key: VisibleKey) {
    setVisible((prev) => ({ ...prev, [key]: !prev[key] }));
  }

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
            <YAxis
              tickFormatter={formatChfK}
              tick={{ fontSize: 11 }}
              width={50}
              domain={[yMin, yMax]}
            />
            <Tooltip content={<CustomTooltip rawComponents={rawComponents} />} />
            <ReferenceLine
              x={currentYear}
              stroke="#6366f1"
              strokeDasharray="4 4"
              label={{ value: 'Heute', fontSize: 11, fill: '#6366f1' }}
            />
            {selectedYear && selectedYear !== currentYear && (
              <ReferenceLine x={selectedYear} stroke="#6366f1" strokeWidth={2} />
            )}
            <ReferenceLine y={0} stroke="#ef4444" strokeDasharray="2 2" />
            {/* Stacked expenditure bars: planned (bottom, solid red) + calculated (top, light red) */}
            <Bar
              dataKey="expenditurePlanned"
              stackId="exp"
              fill="#ef4444"
              opacity={0.85}
              name="expenditurePlanned"
              barSize={12}
              hide={!visible.expenditure}
            />
            <Bar
              dataKey="expenditureCalculated"
              stackId="exp"
              fill="#fca5a5"
              opacity={0.85}
              name="expenditureCalculated"
              barSize={12}
              hide={!visible.expenditure}
            />
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
    </>
  );
}
