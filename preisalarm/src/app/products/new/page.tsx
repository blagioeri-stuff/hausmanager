'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface DetectionResult {
  price: number | null;
  currency: string;
  productName: string | null;
  method: string;
  error?: string;
}

interface UrlEntry {
  url: string;
  shopName: string;
  checkIntervalHours: number;
  detected: DetectionResult | null;
  detecting: boolean;
}

export default function NewProductPage() {
  const router = useRouter();
  const [productName, setProductName] = useState('');
  const [targetPrice, setTargetPrice] = useState('');
  const [targetCurrency, setTargetCurrency] = useState('CHF');
  const [notes, setNotes] = useState('');
  const [urls, setUrls] = useState<UrlEntry[]>([
    { url: '', shopName: '', checkIntervalHours: 12, detected: null, detecting: false },
  ]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const detectPrice = async (index: number) => {
    const entry = urls[index];
    if (!entry.url) return;
    setUrls((prev) => prev.map((u, i) => (i === index ? { ...u, detecting: true } : u)));
    try {
      const res = await fetch('/api/scrape/detect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: entry.url }),
      });
      const data = (await res.json()) as DetectionResult;
      setUrls((prev) =>
        prev.map((u, i) => {
          if (i !== index) return u;
          const updated = { ...u, detecting: false, detected: data };
          // Auto-fill product name if empty
          if (!productName && data.productName) setProductName(data.productName);
          return updated;
        })
      );
    } catch (err) {
      setUrls((prev) =>
        prev.map((u, i) =>
          i === index ? { ...u, detecting: false, detected: { price: null, currency: 'CHF', productName: null, method: 'failed', error: String(err) } } : u
        )
      );
    }
  };

  const addUrl = () =>
    setUrls((prev) => [
      ...prev,
      { url: '', shopName: '', checkIntervalHours: 12, detected: null, detecting: false },
    ]);

  const removeUrl = (index: number) =>
    setUrls((prev) => prev.filter((_, i) => i !== index));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productName.trim()) { setError('Produktname erforderlich'); return; }
    const validUrls = urls.filter((u) => u.url.trim());
    if (validUrls.length === 0) { setError('Mindestens eine URL erforderlich'); return; }

    setSaving(true);
    setError('');
    try {
      // 1. Create product
      const pRes = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: productName.trim(), notes: notes.trim() || undefined }),
      });
      if (!pRes.ok) throw new Error('Produkt konnte nicht erstellt werden');
      const product = await pRes.json() as { id: string };

      // 2. Add tracked URLs
      for (const u of validUrls) {
        await fetch('/api/tracked-urls', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            productId: product.id,
            url: u.url,
            shopName: u.shopName || undefined,
            checkIntervalHours: u.checkIntervalHours,
          }),
        });
      }

      // 3. Create alert if target price set
      if (targetPrice && parseFloat(targetPrice) > 0) {
        await fetch('/api/alerts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            productId: product.id,
            targetPrice: parseFloat(targetPrice),
            currency: targetCurrency,
          }),
        });
      }

      router.push(`/products/${product.id}`);
    } catch (err) {
      setError(String(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-2">Produkt hinzufügen</h1>
      <p className="text-gray-500 mb-8">URL(s) einfügen, Preis automatisch erkennen lassen.</p>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* URLs */}
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h2 className="font-semibold mb-4">Shop-URLs</h2>
          <div className="space-y-4">
            {urls.map((entry, i) => (
              <div key={i} className="space-y-2">
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={entry.url}
                    onChange={(e) => setUrls((prev) => prev.map((u, idx) => idx === i ? { ...u, url: e.target.value } : u))}
                    placeholder="https://www.digitec.ch/de/s1/product/..."
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => detectPrice(i)}
                    disabled={!entry.url || entry.detecting}
                    className="bg-blue-50 text-blue-700 border border-blue-200 px-3 py-2 rounded-lg text-sm font-medium hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                  >
                    {entry.detecting ? '⏳ Prüfe...' : '🔍 Preis erkennen'}
                  </button>
                  {urls.length > 1 && (
                    <button type="button" onClick={() => removeUrl(i)} className="text-red-400 hover:text-red-600 px-2">✕</button>
                  )}
                </div>

                {/* Detection result */}
                {entry.detected && (
                  <div className={`text-sm px-3 py-2 rounded-lg ${entry.detected.price ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                    {entry.detected.price ? (
                      <>✓ Preis erkannt: <strong>{entry.detected.currency} {entry.detected.price.toFixed(2)}</strong>
                        {' '}(Methode: {entry.detected.method})
                        {entry.detected.productName && <span className="text-gray-500 ml-2">— {entry.detected.productName}</span>}
                      </>
                    ) : (
                      <>✗ Kein Preis gefunden{entry.detected.error ? `: ${entry.detected.error}` : ''}</>
                    )}
                  </div>
                )}

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={entry.shopName}
                    onChange={(e) => setUrls((prev) => prev.map((u, idx) => idx === i ? { ...u, shopName: e.target.value } : u))}
                    placeholder="Shop-Name (optional, z.B. Digitec)"
                    className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <select
                    value={entry.checkIntervalHours}
                    onChange={(e) => setUrls((prev) => prev.map((u, idx) => idx === i ? { ...u, checkIntervalHours: parseFloat(e.target.value) } : u))}
                    className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="1">Jede Stunde</option>
                    <option value="2">Alle 2h</option>
                    <option value="6">Alle 6h</option>
                    <option value="12">Alle 12h</option>
                    <option value="24">Täglich</option>
                    <option value="48">Alle 2 Tage</option>
                  </select>
                </div>
              </div>
            ))}
          </div>
          <button type="button" onClick={addUrl} className="mt-3 text-sm text-blue-600 hover:text-blue-800">
            + Weiteren Shop hinzufügen
          </button>
        </div>

        {/* Product info */}
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h2 className="font-semibold mb-4">Produkt-Info</h2>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Produktname *</label>
              <input
                type="text"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                placeholder="z.B. Samsung Galaxy S25 Ultra 256GB"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notizen (optional)</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="z.B. Phantom Black, mind. 2 Jahre Garantie"
                rows={2}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>
          </div>
        </div>

        {/* Alert */}
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h2 className="font-semibold mb-1">Preisalarm</h2>
          <p className="text-sm text-gray-500 mb-4">Benachrichtigung wenn Preis unter diesen Wert fällt</p>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="number"
                value={targetPrice}
                onChange={(e) => setTargetPrice(e.target.value)}
                placeholder="0.00"
                min="0"
                step="0.01"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <select
              value={targetCurrency}
              onChange={(e) => setTargetCurrency(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option>CHF</option>
              <option>EUR</option>
              <option>USD</option>
            </select>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={saving}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
          >
            {saving ? 'Speichere...' : 'Produkt speichern'}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="text-gray-600 px-6 py-2 rounded-lg hover:bg-gray-100"
          >
            Abbrechen
          </button>
        </div>
      </form>
    </div>
  );
}
