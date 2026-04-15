'use client';

import { useEffect, useState } from 'react';

interface ShopProfile {
  id: string;
  domain: string;
  name: string;
  priceSelector: string;
  currencySelector: string | null;
  availabilitySelector: string | null;
  notes: string | null;
  active: boolean;
}

export default function AdminPage() {
  const [profiles, setProfiles] = useState<ShopProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState(false);
  const [testUrl, setTestUrl] = useState('');
  const [testResult, setTestResult] = useState<Record<string, unknown> | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<ShopProfile>>({});

  const loadProfiles = async () => {
    const data = await fetch('/api/shop-profiles').then((r) => r.json()) as ShopProfile[];
    setProfiles(data);
    setLoading(false);
  };

  useEffect(() => { loadProfiles(); }, []);

  const testDetect = async () => {
    if (!testUrl) return;
    setTesting(true);
    setTestResult(null);
    const res = await fetch('/api/scrape/detect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: testUrl }),
    });
    setTestResult(await res.json() as Record<string, unknown>);
    setTesting(false);
  };

  const saveEdit = async (id: string) => {
    await fetch('/api/shop-profiles', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...editData }),
    });
    setEditingId(null);
    loadProfiles();
  };

  const toggleActive = async (profile: ShopProfile) => {
    await fetch('/api/shop-profiles', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: profile.id, active: !profile.active }),
    });
    loadProfiles();
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">Admin</h1>
      <p className="text-gray-500 mb-8">Preiserkennung testen und Shop-Profile verwalten</p>

      {/* Test detector */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 mb-8">
        <h2 className="font-semibold mb-3">Preiserkennung testen</h2>
        <div className="flex gap-2">
          <input
            type="url"
            value={testUrl}
            onChange={(e) => setTestUrl(e.target.value)}
            placeholder="https://www.digitec.ch/de/s1/product/..."
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={testDetect}
            disabled={testing || !testUrl}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 whitespace-nowrap"
          >
            {testing ? '⏳ Prüfe...' : '🔍 Testen'}
          </button>
        </div>
        {testResult && (
          <pre className="mt-3 bg-gray-50 border border-gray-200 rounded-lg p-3 text-xs overflow-auto max-h-64">
            {JSON.stringify(testResult, null, 2)}
          </pre>
        )}
      </div>

      {/* Shop profiles */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold">Shop-Profile ({profiles.length})</h2>
          <p className="text-sm text-gray-500">CSS-Selektoren für bekannte Shops</p>
        </div>
        {loading ? (
          <div className="p-8 text-center text-gray-400">Lade...</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Shop</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Preis-Selektor</th>
                <th className="text-center px-4 py-3 font-medium text-gray-600">Aktiv</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {profiles.map((p) => (
                <tr key={p.id} className={`hover:bg-gray-50 ${!p.active ? 'opacity-50' : ''}`}>
                  <td className="px-4 py-3">
                    <div className="font-medium">{p.name}</div>
                    <div className="text-xs text-gray-400">{p.domain}</div>
                  </td>
                  <td className="px-4 py-3">
                    {editingId === p.id ? (
                      <input
                        value={editData.priceSelector ?? p.priceSelector}
                        onChange={(e) => setEditData((d) => ({ ...d, priceSelector: e.target.value }))}
                        className="border border-gray-300 rounded px-2 py-1 text-xs w-full font-mono"
                      />
                    ) : (
                      <code className="text-xs bg-gray-100 px-2 py-1 rounded">{p.priceSelector}</code>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => toggleActive(p)}
                      className={`w-8 h-5 rounded-full transition-colors ${p.active ? 'bg-green-500' : 'bg-gray-300'}`}
                    />
                  </td>
                  <td className="px-4 py-3 text-right">
                    {editingId === p.id ? (
                      <div className="flex gap-1 justify-end">
                        <button onClick={() => saveEdit(p.id)} className="text-xs text-green-600 hover:text-green-800 px-2 py-1">✓ Speichern</button>
                        <button onClick={() => setEditingId(null)} className="text-xs text-gray-400 px-2 py-1">✕</button>
                      </div>
                    ) : (
                      <button
                        onClick={() => { setEditingId(p.id); setEditData({}); }}
                        className="text-xs text-gray-400 hover:text-blue-600 px-2 py-1"
                      >
                        Bearbeiten
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
