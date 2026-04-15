'use client';

import { useEffect, useState } from 'react';

interface LogEntry {
  id: string;
  level: string;
  category: string;
  message: string;
  detail?: string | null;
  createdAt: string;
}

const levelColors: Record<string, string> = {
  info: 'bg-blue-50 text-blue-700',
  warn: 'bg-amber-50 text-amber-700',
  error: 'bg-red-50 text-red-700',
};

export default function LogPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [level, setLevel] = useState('');
  const [days, setDays] = useState('7');

  const load = async () => {
    setLoading(true);
    const params = new URLSearchParams({ days });
    if (level) params.set('level', level);
    const data = await fetch(`/api/log?${params}`).then((r) => r.json()) as LogEntry[];
    setLogs(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, [level, days]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleClear = async () => {
    if (!confirm('Alle Logs älter als 30 Tage löschen?')) return;
    await fetch('/api/log?olderThan=30', { method: 'DELETE' });
    load();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Systemprotokoll</h1>
          <p className="text-gray-500">{logs.length} Einträge</p>
        </div>
        <div className="flex items-center gap-2">
          <select value={level} onChange={(e) => setLevel(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
            <option value="">Alle Level</option>
            <option value="info">Info</option>
            <option value="warn">Warnung</option>
            <option value="error">Fehler</option>
          </select>
          <select value={days} onChange={(e) => setDays(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
            <option value="1">Heute</option>
            <option value="7">7 Tage</option>
            <option value="30">30 Tage</option>
          </select>
          <button onClick={handleClear} className="text-sm text-red-500 border border-red-200 px-3 py-2 rounded-lg hover:bg-red-50">
            Bereinigen
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-gray-400">Lade...</div>
      ) : logs.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-8 text-center text-gray-400">
          Keine Einträge gefunden
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600 w-36">Zeit</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 w-16">Level</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 w-24">Kategorie</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Nachricht</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2 text-gray-400 text-xs whitespace-nowrap">
                    {new Date(log.createdAt).toLocaleString('de-CH', {
                      day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit',
                    })}
                  </td>
                  <td className="px-4 py-2">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${levelColors[log.level] ?? 'bg-gray-100 text-gray-600'}`}>
                      {log.level}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-gray-500 text-xs">{log.category}</td>
                  <td className="px-4 py-2">
                    <div>{log.message}</div>
                    {log.detail && (
                      <div className="text-xs text-gray-400 mt-0.5 truncate max-w-lg" title={log.detail}>
                        {log.detail}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
