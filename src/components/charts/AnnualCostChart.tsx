'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { formatChf } from '@/lib/formatters';
import type { EnrichedComponent } from '@/types';

interface Props {
  components: EnrichedComponent[];
}

const STATUS_COLORS: Record<string, string> = {
  green: '#22c55e',
  yellow: '#eab308',
  red: '#ef4444',
};

function CustomTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: { name: string; annualSavingsChf: number } }> }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow px-3 py-2 text-sm">
      <p className="font-medium text-gray-900">{d.name}</p>
      <p className="text-blue-600">{formatChf(d.annualSavingsChf)} / Jahr</p>
    </div>
  );
}

export function AnnualCostChart({ components }: Props) {
  const data = [...components]
    .sort((a, b) => b.annualSavingsChf - a.annualSavingsChf)
    .map((c) => ({
      name: c.name.length > 16 ? c.name.slice(0, 14) + '…' : c.name,
      fullName: c.name,
      annualSavingsChf: Math.round(c.annualSavingsChf),
      statusColor: c.statusColor,
    }));

  if (data.length === 0) {
    return <div className="h-64 flex items-center justify-center text-gray-400 text-sm">Keine Daten</div>;
  }

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 5, right: 10, left: 10, bottom: 40 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-35} textAnchor="end" interval={0} />
          <YAxis
            tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
            tick={{ fontSize: 11 }}
            width={40}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="annualSavingsChf" radius={[4, 4, 0, 0]}>
            {data.map((entry, index) => (
              <Cell key={index} fill={STATUS_COLORS[entry.statusColor]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
