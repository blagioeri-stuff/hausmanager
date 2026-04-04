'use client';

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
import type { ReserveProjectionRow } from '@/types';

interface Props {
  data: ReserveProjectionRow[];
}

function formatChfK(value: number) {
  if (Math.abs(value) >= 1000) return `${(value / 1000).toFixed(0)}k`;
  return `${value}`;
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: number }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg px-4 py-3 text-sm">
      <p className="font-semibold text-gray-900 mb-2">{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color }}>
          {p.name}: CHF {p.value.toLocaleString('de-CH')}
        </p>
      ))}
    </div>
  );
}

export function ReserveChart({ data }: Props) {
  const currentYear = new Date().getFullYear();
  // Show only next 30 years
  const filtered = data.filter((d) => d.year <= currentYear + 30);

  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={filtered} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="year" tick={{ fontSize: 11 }} />
          <YAxis tickFormatter={formatChfK} tick={{ fontSize: 11 }} width={50} />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ fontSize: '12px' }}
            formatter={(value) =>
              value === 'accumulated' ? 'Angesparte Reserve' : value === 'expenditure' ? 'Ausgaben' : value
            }
          />
          <ReferenceLine x={currentYear} stroke="#6366f1" strokeDasharray="4 4" label={{ value: 'Heute', fontSize: 11, fill: '#6366f1' }} />
          <Area
            type="monotone"
            dataKey="accumulated"
            fill="#dbeafe"
            stroke="#3b82f6"
            strokeWidth={2}
            fillOpacity={0.6}
            name="accumulated"
          />
          <Bar dataKey="expenditure" fill="#f87171" opacity={0.8} name="expenditure" barSize={12} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
