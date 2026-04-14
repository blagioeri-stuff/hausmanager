'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  ResponsiveContainer,
} from 'recharts';

interface PricePoint {
  timestamp: string;
  price: number;
  currency: string;
  available: boolean;
}

interface ShopSeries {
  trackedUrlId: string;
  shopName: string;
  currency: string;
  points: PricePoint[];
}

interface Props {
  series: ShopSeries[];
  alertTargetPrice?: number;
  currency?: string;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

function formatDate(ts: string) {
  return new Date(ts).toLocaleDateString('de-CH', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}

export function PriceHistoryChart({ series, alertTargetPrice, currency = 'CHF' }: Props) {
  if (!series.length || series.every((s) => s.points.length === 0)) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-8 text-center text-gray-400">
        <p className="text-3xl mb-2">📊</p>
        <p>Noch keine Preisdaten. Der erste Check läuft bald.</p>
      </div>
    );
  }

  // Merge all timestamps into unified dataset
  const allTimestamps = Array.from(
    new Set(series.flatMap((s) => s.points.map((p) => p.timestamp)))
  ).sort();

  const chartData = allTimestamps.map((ts) => {
    const entry: Record<string, string | number | null> = { timestamp: ts };
    for (const s of series) {
      const pt = s.points.find((p) => p.timestamp === ts);
      entry[s.shopName] = pt?.available ? pt.price : null;
    }
    return entry;
  });

  const allPrices = series.flatMap((s) => s.points.map((p) => p.price)).filter(Boolean);
  const minPrice = Math.min(...allPrices);
  const maxPrice = Math.max(...allPrices);
  const yMin = Math.floor(minPrice * 0.95);
  const yMax = Math.ceil(maxPrice * 1.05);

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis
          dataKey="timestamp"
          tickFormatter={(v) => new Date(v as string).toLocaleDateString('de-CH', { day: '2-digit', month: '2-digit' })}
          tick={{ fontSize: 11 }}
          minTickGap={40}
        />
        <YAxis
          domain={[yMin, yMax]}
          tickFormatter={(v) => `${currency} ${(v as number).toFixed(0)}`}
          tick={{ fontSize: 11 }}
          width={80}
        />
        <Tooltip
          formatter={(value, name) => [
            typeof value === 'number' ? `${currency} ${value.toFixed(2)}` : String(value),
            name,
          ]}
          labelFormatter={(label) => formatDate(label as string)}
        />
        <Legend />
        {alertTargetPrice && (
          <ReferenceLine
            y={alertTargetPrice}
            stroke="#ef4444"
            strokeDasharray="6 3"
            label={{ value: `Ziel: ${currency} ${alertTargetPrice.toFixed(2)}`, fill: '#ef4444', fontSize: 11 }}
          />
        )}
        {series.map((s, i) => (
          <Line
            key={s.trackedUrlId}
            type="monotone"
            dataKey={s.shopName}
            stroke={COLORS[i % COLORS.length]}
            strokeWidth={2}
            dot={s.points.length < 30}
            connectNulls={false}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
