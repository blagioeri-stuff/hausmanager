import { prisma } from '@/lib/db';
import Link from 'next/link';
import { formatPrice } from '@/lib/swiss';

export const dynamic = 'force-dynamic';

export default async function ProductsPage() {
  const products = await prisma.product.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      trackedUrls: { where: { active: true }, orderBy: { lastPrice: 'asc' } },
      alerts: { where: { active: true } },
    },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Produkte</h1>
          <p className="text-gray-500">{products.length} Produkt{products.length !== 1 ? 'e' : ''} verfolgt</p>
        </div>
        <Link
          href="/products/new"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          + Produkt hinzufügen
        </Link>
      </div>

      {products.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-12 text-center text-gray-400">
          <p className="text-5xl mb-4">🛍️</p>
          <p className="text-lg font-medium text-gray-600">Noch keine Produkte</p>
          <p className="text-sm mt-2 mb-6">Füge dein erstes Produkt hinzu, um Preise zu verfolgen.</p>
          <Link
            href="/products/new"
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Jetzt starten
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {products.map((p) => {
            const bestUrl = p.trackedUrls[0];
            const bestPrice = bestUrl?.lastPrice;
            const activeAlert = p.alerts[0];
            const alertTriggered =
              activeAlert && bestPrice !== null && bestPrice !== undefined && bestPrice <= activeAlert.targetPrice;

            return (
              <Link
                key={p.id}
                href={`/products/${p.id}`}
                className={`bg-white border rounded-xl p-5 hover:shadow-md transition-shadow flex items-center justify-between group ${
                  alertTriggered ? 'border-green-300 bg-green-50' : 'border-gray-200'
                }`}
              >
                <div className="flex items-center gap-4">
                  {p.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.imageUrl} alt={p.name} className="w-12 h-12 object-contain rounded" />
                  ) : (
                    <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center text-xl">📦</div>
                  )}
                  <div>
                    <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                      {p.name}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {p.trackedUrls.length} Shop{p.trackedUrls.length !== 1 ? 's' : ''} ·{' '}
                      {p.alerts.length > 0 ? `Alarm: ${formatPrice(activeAlert!.targetPrice, activeAlert!.currency)}` : 'Kein Alarm'}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  {bestPrice != null ? (
                    <>
                      <div className={`text-xl font-bold ${alertTriggered ? 'text-green-600' : 'text-gray-900'}`}>
                        {formatPrice(bestPrice, bestUrl.currency)}
                      </div>
                      <div className="text-xs text-gray-400">
                        {bestUrl.shopName ?? bestUrl.shopDomain}
                        {alertTriggered && <span className="ml-1 text-green-600 font-medium">✓ Ziel</span>}
                      </div>
                    </>
                  ) : (
                    <span className="text-gray-400 text-sm">Noch nicht geprüft</span>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
