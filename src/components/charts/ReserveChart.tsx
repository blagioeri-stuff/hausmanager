'use client';

import { useState } from 'react';
import {
  ComposedChart,
  Area,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
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

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: number }) {
  if (!active || !payload?.length) return null;
  const labels: Record<string, string> = {
    runningBalance: 'Guthaben',
    expenditure: 'Ausgaben',
  };
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg px-4 py-3 text-sm">
      <p className="font-semibold text-gray-900 mb-1">{label} <span className="text-xs text-gray-400 font-normal">(klicken für Details)</span></p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color }}>
          {labels[p.name] ?? p.name}: {formatChf(p.value)}
        </p>
      ))}
    </div>
  );
}

export function ReserveChart({ data, rawComponents = [] }: Props) {
  const currentYear = new Date().getFullYear();
  const filtered = data.filter((d) => d.year <= currentYear + 30);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function handleClick(chartData: any) {
    const year = chartData?.activePayload?.[0]?.payload?.year;
    if (year) setSelectedYear(year);
  }

  const yearComponents = selectedYear
    ? rawComponents.map((c) => enrichComponentAtYear(c, selectedYear))
    : [];

  return (
    <>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={filtered} margin={{ top: 5, right: 10, left: 10, bottom: 5 }} onClick={handleClick} style={{ cursor: 'pointer' }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="year" tick={{ fontSize: 11 }} />
            <YAxis tickFormatter={formatChfK} tick={{ fontSize: 11 }} width={50} />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ fontSize: '12px' }}
              formatter={(value) =>
                value === 'runningBalance' ? 'Guthaben (laufend)' : value === 'expenditure' ? 'Ausgaben' : value
              }
            />
            <ReferenceLine x={currentYear} stroke="#6366f1" strokeDasharray="4 4" label={{ value: 'Heute', fontSize: 11, fill: '#6366f1' }} />
            <ReferenceLine y={0} stroke="#ef4444" strokeDasharray="2 2" />
            <Bar dataKey="expenditure" fill="#f87171" opacity={0.7} name="expenditure" barSize={12} />
            <Area
              type="monotone"
              dataKey="runningBalance"
              fill="#dbeafe"
              stroke="#3b82f6"
              strokeWidth={2}
              fillOpacity={0.4}
              name="runningBalance"
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
