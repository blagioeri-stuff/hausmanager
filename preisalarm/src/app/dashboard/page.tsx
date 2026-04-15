import { prisma } from '@/lib/db';
import Link from 'next/link';
import { formatPrice } from '@/lib/swiss';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const products = await prisma.product.findMany({
    include: {
      trackedUrls: { where: { active: true }, orderBy: { lastPrice: 'asc' } },
      alerts: { where: { active: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  const totalProducts = products.length;
  const totalUrls = products.reduce((s, p) => s + p.trackedUrls.length, 0);
  const totalAlerts = products.reduce((s, p) => s + p.alerts.length, 0);

  // Recent price drops (products where best price ≤ any active alert)
  const triggered = products.filter((p) =>
    p.alerts.some((a) =>
      p.trackedUrls.some((u) => u.lastPrice !== null && u.lastPrice <= a.targetPrice)
    )
  );

  // Recently checked
  const recentlyChecked = products
    .flatMap((p) =>
      p.trackedUrls
        .filter((u) => u.lastChecked && u.lastPrice !== null)
        .map((u) => ({ ...u, productName: p.name, productId: p.id }))
    )
    .sort((a, b) => (b.lastChecked?.getTime() ?? 0) - (a.lastChecked?.getTime() ?? 0))
    .slice(0, 10);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">Dashboard</h1>
      <p className="text-gray-500 mb-8">Übersicht deiner Preisalarme</p>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Verfolgte Produkte', value: totalProducts, icon: '🛍️' },
          { label: 'Shop-URLs', value: totalUrls, icon: '🔗' },
          { label: 'Aktive Alarme', value: totalAlerts, icon: '🔔' },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="text-2xl mb-2">{s.icon}</div>
            <div className="text-3xl font-bold text-gray-900">{s.value}</div>
            <div className="text-sm text-gray-500 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Triggered alerts */}
      {triggered.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <span>🎯</span> Zielpreis erreicht
          </h2>
          <div className="space-y-2">
            {triggered.map((p) => {
              const bestUrl = p.trackedUrls[0];
              const alert = p.alerts.find(
                (a) => bestUrl?.lastPrice !== null && (bestUrl?.lastPrice ?? Infinity) <= a.targetPrice
              );
              return (
                <Link
                  key={p.id}
                  href={`/products/${p.id}`}
                  className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg px-4 py-3 hover:bg-green-100 transition-colors"
                >
                  <span className="font-medium text-green-900">{p.name}</span>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-green-700 font-bold">
                      {bestUrl?.lastPrice != null
                        ? formatPrice(bestUrl.lastPrice, bestUrl.currency)
                        : '—'}
                    </span>
                    {alert && (
                      <span className="text-gray-500">
                        Ziel: {formatPrice(alert.targetPrice, alert.currency)}
                      </span>
                    )}
                    <span className="text-green-600">→</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Recent checks */}
      <div>
        <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <span>🕐</span> Zuletzt geprüft
        </h2>
        {recentlyChecked.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-xl p-8 text-center text-gray-400">
            <p className="text-4xl mb-3">🔍</p>
            <p className="font-medium">Noch keine Preise geprüft</p>
            <p className="text-sm mt-1">
              <Link href="/products/new" className="text-blue-600 hover:underline">
                Erstes Produkt hinzufügen
              </Link>
            </p>
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Produkt</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Shop</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">Preis</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">Geprüft</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {recentlyChecked.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <Link href={`/products/${u.productId}`} className="text-blue-600 hover:underline">
                        {u.productName}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{u.shopName ?? u.shopDomain ?? '—'}</td>
                    <td className="px-4 py-3 text-right font-medium">
                      {u.lastPrice != null ? formatPrice(u.lastPrice, u.currency) : '—'}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-400">
                      {u.lastChecked
                        ? new Date(u.lastChecked).toLocaleString('de-CH', {
                            day: '2-digit',
                            month: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
