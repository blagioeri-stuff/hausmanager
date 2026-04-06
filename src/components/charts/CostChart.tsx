'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { COST_CATEGORIES } from '@/components/forms/CostForm';

interface CostEntry {
  id: string;
  category: string;
  amountChf: number;
  date: string;
}

interface ChartDataPoint {
  month: string;
  [category: string]: number | string;
}

// Colors per category
const CATEGORY_COLORS: Record<string, string> = {
  reparatur: '#ef4444',
  versicherung: '#3b82f6',
  heizung_service: '#f59e0b',
  garten: '#22c55e',
  reinigung: '#a855f7',
  verwaltung: '#64748b',
  sonstiges: '#94a3b8',
};

interface CostChartProps {
  costs: CostEntry[];
}

function buildMonthlyData(costs: CostEntry[]): ChartDataPoint[] {
  const now = new Date();
  const months: ChartDataPoint[] = [];

  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const label = d.toLocaleDateString('de-CH', { month: 'short', year: '2-digit' });
    const point: ChartDataPoint = { month: label, _key: key };
    COST_CATEGORIES.forEach((cat) => { point[cat.value] = 0; });
    months.push(point);
  }

  costs.forEach((c) => {
    const d = new Date(c.date);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const point = months.find((m) => m._key === key);
    if (point) {
      point[c.category] = ((point[c.category] as number) || 0) + c.amountChf;
    }
  });

  // Remove helper key
  return months.map(({ _key: _, ...rest }) => rest as ChartDataPoint);
}

export function CostChart({ costs }: CostChartProps) {
  const data = buildMonthlyData(costs);

  // Only render bars for categories that have data
  const activeCategories = COST_CATEGORIES.filter((cat) =>
    costs.some((c) => c.category === cat.value)
  );

  if (activeCategories.length === 0) {
    return (
      <div className="flex items-center justify-center h-40 text-sm text-gray-400">
        Noch keine Kostendaten vorhanden
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
        <XAxis dataKey="month" tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${v.toLocaleString('de-CH')}`} />
        <Tooltip
          formatter={(value, name) => {
            const num = typeof value === 'number' ? value : 0;
            const cat = COST_CATEGORIES.find((c) => c.value === String(name));
            return [`CHF ${num.toLocaleString('de-CH', { minimumFractionDigits: 2 })}`, cat?.label ?? String(name)];
          }}
        />
        <Legend
          formatter={(value) => COST_CATEGORIES.find((c) => c.value === value)?.label ?? value}
        />
        {activeCategories.map((cat) => (
          <Bar
            key={cat.value}
            dataKey={cat.value}
            stackId="costs"
            fill={CATEGORY_COLORS[cat.value] ?? '#94a3b8'}
            radius={0}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}
