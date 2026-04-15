import { prisma } from '@/lib/db';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { formatPrice, estimateSwissImportCost, convertToChf } from '@/lib/swiss';
import { PriceHistoryChart } from '@/components/charts/PriceHistoryChart';
import { ProductActions } from './ProductActions';

export const dynamic = 'force-dynamic';

export default async function ProductDetailPage({ params }: { params: { id: string } }) {
  const product = await prisma.product.findUnique({
    where: { id: params.id },
    include: {
      trackedUrls: {
        orderBy: { lastPrice: 'asc' },
        include: { pricePoints: { orderBy: { timestamp: 'desc' }, take: 200 } },
      },
      alerts: { where: { active: true } },
    },
  });
  if (!product) notFound();

  const activeAlert = product.alerts[0] ?? null;
  const bestUrl = product.trackedUrls.filter((u) => u.active && u.lastPrice != null)[0];

  // Build chart series
  const series = product.trackedUrls
    .filter((u) => u.pricePoints.length > 0)
    .map((u) => ({
      trackedUrlId: u.id,
      shopName: u.shopName ?? u.shopDomain ?? new URL(u.url).hostname,
      currency: u.currency,
      points: u.pricePoints.map((p) => ({
        timestamp: p.timestamp.toISOString(),
        price: p.price,
        currency: p.currency,
        available: p.available,
      })),
    }));

  return (
    <div className="max-w-4xl">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <Link href="/products" className="text-sm text-gray-400 hover:text-gray-600 mb-2 block">
            ← Produkte
          </Link>
          <h1 className="text-2xl font-bold">{product.name}</h1>
          {product.notes && <p className="text-gray-500 mt-1">{product.notes}</p>}
        </div>
        <ProductActions productId={product.id} productName={product.name} />
      </div>

      {/* Best price */}
      {bestUrl && (
        <div className={`rounded-xl p-6 mb-6 ${
          activeAlert && bestUrl.lastPrice! <= activeAlert.targetPrice
            ? 'bg-green-50 border border-green-200'
            : 'bg-blue-50 border border-blue-100'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">Bester aktueller Preis</p>
              <p className="text-3xl font-bold text-gray-900">
                {formatPrice(bestUrl.lastPrice!, bestUrl.currency)}
              </p>
              <p className="text-sm text-gray-500 mt-1">{bestUrl.shopName ?? bestUrl.shopDomain}</p>
            </div>
            {activeAlert && (
              <div className="text-right">
                <p className="text-sm text-gray-500 mb-1">Dein Zielpreis</p>
                <p className="text-xl font-semibold text-gray-700">
                  {formatPrice(activeAlert.targetPrice, activeAlert.currency)}
                </p>
                {bestUrl.lastPrice! <= activeAlert.targetPrice ? (
                  <span className="text-green-600 text-sm font-medium">✓ Ziel erreicht!</span>
                ) : (
                  <span className="text-gray-500 text-sm">
                    Noch {formatPrice(bestUrl.lastPrice! - activeAlert.targetPrice, bestUrl.currency)} drüber
                  </span>
                )}
              </div>
            )}
          </div>
          <a
            href={bestUrl.url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-block bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium"
          >
            Zum Shop →
          </a>
        </div>
      )}

      {/* Price history chart */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 mb-6">
        <h2 className="font-semibold mb-4">Preisverlauf</h2>
        <PriceHistoryChart
          series={series}
          alertTargetPrice={activeAlert?.targetPrice}
          currency={bestUrl?.currency ?? 'CHF'}
        />
      </div>

      {/* Shops comparison table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden mb-6">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold">Shops ({product.trackedUrls.length})</h2>
          <AddUrlButton productId={product.id} />
        </div>
        {product.trackedUrls.length === 0 ? (
          <p className="text-center text-gray-400 py-8">Noch keine Shop-URLs</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-5 py-3 font-medium text-gray-600">Shop</th>
                <th className="text-right px-5 py-3 font-medium text-gray-600">Preis</th>
                <th className="text-right px-5 py-3 font-medium text-gray-600">CHF total*</th>
                <th className="text-right px-5 py-3 font-medium text-gray-600">Zuletzt</th>
                <th className="text-right px-5 py-3 font-medium text-gray-600">Methode</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {product.trackedUrls.map((u) => {
                const isChShop = (u.shopDomain ?? '').endsWith('.ch');
                const costEstimate =
                  !isChShop && u.lastPrice != null
                    ? estimateSwissImportCost(convertToChf(u.lastPrice, u.currency))
                    : null;
                return (
                  <tr key={u.id} className={`hover:bg-gray-50 ${!u.active ? 'opacity-50' : ''}`}>
                    <td className="px-5 py-3">
                      <a
                        href={u.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline font-medium"
                      >
                        {u.shopName ?? u.shopDomain ?? u.url.slice(0, 40)}
                      </a>
                      {!u.active && <span className="ml-2 text-xs text-red-500">(deaktiviert)</span>}
                      {u.lastError && <p className="text-xs text-red-400 mt-0.5 truncate max-w-xs">{u.lastError}</p>}
                    </td>
                    <td className="px-5 py-3 text-right font-medium">
                      {u.lastPrice != null ? formatPrice(u.lastPrice, u.currency) : '—'}
                    </td>
                    <td className="px-5 py-3 text-right text-gray-600">
                      {costEstimate
                        ? <span title={`inkl. MwSt${costEstimate.dutyApplies ? ' + Zoll' : ''}`}>
                            {formatPrice(costEstimate.totalWithDuty, 'CHF')}
                            {costEstimate.dutyApplies && <span className="text-xs text-amber-600 ml-1">+Zoll</span>}
                          </span>
                        : isChShop && u.lastPrice != null
                        ? formatPrice(convertToChf(u.lastPrice, u.currency), 'CHF')
                        : '—'}
                    </td>
                    <td className="px-5 py-3 text-right text-gray-400 text-xs">
                      {u.lastChecked
                        ? new Date(u.lastChecked).toLocaleString('de-CH', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
                        : 'Nie'}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">
                        {u.detectionMethod ?? '—'}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <UrlActions urlId={u.id} productId={product.id} active={u.active} checkIntervalHours={u.checkIntervalHours} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
        <p className="text-xs text-gray-400 px-5 py-2 border-t border-gray-100">
          * Für EU/nicht-CH Shops: geschätzter CHF-Gesamtpreis inkl. MwSt (8.1%) und ggf. Zoll (Waren &gt; CHF 300)
        </p>
      </div>

      {/* Alert section */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <h2 className="font-semibold mb-4">Preisalarm</h2>
        <AlertSection productId={product.id} alert={activeAlert} />
      </div>
    </div>
  );
}

function AddUrlButton({ productId }: { productId: string }) {
  return (
    <Link
      href={`/products/new?productId=${productId}`}
      className="text-sm text-blue-600 hover:text-blue-800"
    >
      + Shop hinzufügen
    </Link>
  );
}

function UrlActions({
  urlId,
  productId,
  active,
  checkIntervalHours,
}: {
  urlId: string;
  productId: string;
  active: boolean;
  checkIntervalHours: number;
}) {
  return (
    <div className="flex items-center gap-1 justify-end">
      <form action={`/api/tracked-urls/${urlId}/check`} method="POST" className="inline">
        <button
          type="submit"
          title="Jetzt prüfen"
          className="text-xs text-gray-400 hover:text-blue-600 px-2 py-1 rounded hover:bg-blue-50"
        >
          🔄
        </button>
      </form>
    </div>
  );
}

function AlertSection({
  productId,
  alert,
}: {
  productId: string;
  alert: { id: string; targetPrice: number; currency: string; notifyEmail: boolean; notifyTelegram: boolean } | null;
}) {
  if (alert) {
    return (
      <div className="flex items-center justify-between bg-blue-50 border border-blue-100 rounded-lg px-4 py-3">
        <div>
          <p className="font-medium text-blue-900">
            Alarm bei {formatPrice(alert.targetPrice, alert.currency)}
          </p>
          <p className="text-sm text-gray-500 mt-0.5">
            {[alert.notifyEmail && 'E-Mail', alert.notifyTelegram && 'Telegram'].filter(Boolean).join(', ')}
          </p>
        </div>
        <a
          href={`/api/alerts?id=${alert.id}`}
          className="text-sm text-red-500 hover:text-red-700"
          onClick={(e) => {
            e.preventDefault();
            if (confirm('Alarm löschen?')) {
              fetch(`/api/alerts?id=${alert.id}`, { method: 'DELETE' }).then(() => location.reload());
            }
          }}
        >
          Löschen
        </a>
      </div>
    );
  }
  return (
    <NewAlertForm productId={productId} />
  );
}

function NewAlertForm({ productId }: { productId: string }) {
  return (
    <form
      action="/api/alerts"
      method="POST"
      className="flex gap-2 items-end"
      onSubmit={async (e) => {
        e.preventDefault();
        const form = e.target as HTMLFormElement;
        const data = new FormData(form);
        await fetch('/api/alerts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            productId,
            targetPrice: parseFloat(data.get('targetPrice') as string),
            currency: data.get('currency'),
          }),
        });
        location.reload();
      }}
    >
      <input type="hidden" name="productId" value={productId} />
      <div className="flex-1">
        <label className="block text-sm text-gray-600 mb-1">Alarm wenn Preis unter</label>
        <input
          name="targetPrice"
          type="number"
          min="0"
          step="0.01"
          placeholder="0.00"
          required
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <select
        name="currency"
        defaultValue="CHF"
        className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option>CHF</option>
        <option>EUR</option>
        <option>USD</option>
      </select>
      <button
        type="submit"
        className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
      >
        Alarm setzen
      </button>
    </form>
  );
}
