'use client';

import { useState, useEffect, useCallback } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';

interface LogEntry {
  id: string;
  level: string;
  category: string;
  message: string;
  detail: string | null;
  createdAt: string;
}

const LEVEL_BADGE: Record<string, string> = {
  info: 'bg-blue-100 text-blue-700',
  warn: 'bg-yellow-100 text-yellow-700',
  error: 'bg-red-100 text-red-700',
};

const LEVEL_ROW: Record<string, string> = {
  warn: 'bg-yellow-50',
  error: 'bg-red-50',
};

const CATEGORY_LABEL: Record<string, string> = {
  system: 'System',
  backup: 'Backup',
  ki: 'KI',
  garten: 'Garten',
  einstellungen: 'Einstellungen',
  import: 'Import',
};

const DAYS_OPTIONS = [
  { value: '1', label: 'Heute' },
  { value: '7', label: '7 Tage' },
  { value: '30', label: '30 Tage' },
  { value: '90', label: '90 Tage' },
];

function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat('de-CH', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  }).format(new Date(iso));
}

export default function LogPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterLevel, setFilterLevel] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterDays, setFilterDays] = useState('7');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [clearing, setClearing] = useState(false);

  const loadLogs = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ days: filterDays, limit: '200' });
    if (filterLevel) params.set('level', filterLevel);
    if (filterCategory) params.set('category', filterCategory);
    try {
      const res = await fetch(`/api/log?${params}`);
      const data = await res.json();
      setLogs(data);
    } finally {
      setLoading(false);
    }
  }, [filterLevel, filterCategory, filterDays]);

  useEffect(() => { loadLogs(); }, [loadLogs]);

  async function clearOld() {
    if (!confirm('Logs älter als 30 Tage löschen?')) return;
    setClearing(true);
    const res = await fetch('/api/log?olderThan=30', { method: 'DELETE' });
    const data = await res.json();
    await loadLogs();
    setClearing(false);
    alert(`${data.deleted} Einträge gelöscht.`);
  }

  const chipBase = 'px-2.5 py-1 rounded-full text-xs font-medium border transition-colors cursor-pointer select-none';
  const chipActive = 'bg-gray-800 border-gray-800 text-white';
  const chipInactive = 'bg-gray-50 border-gray-200 text-gray-500 hover:border-gray-300';

  return (
    <div className="max-w-5xl space-y-6">
      <PageHeader
        title="Systemlog"
        subtitle={loading ? 'Lädt…' : `${logs.length} Einträge`}
        action={
          <button
            onClick={clearOld}
            disabled={clearing}
            className="text-xs text-gray-400 hover:text-red-600 border border-gray-200 rounded-lg px-3 py-1.5 transition-colors"
          >
            {clearing ? 'Löscht…' : 'Alte Einträge löschen'}
          </button>
        }
      />

      {/* Filters */}
      <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs">
        <div className="flex items-center gap-1.5">
          <span className="text-gray-400 font-medium">Zeitraum:</span>
          {DAYS_OPTIONS.map((d) => (
            <button key={d.value} onClick={() => setFilterDays(d.value)}
              className={`${chipBase} ${filterDays === d.value ? chipActive : chipInactive}`}>
              {d.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-gray-400 font-medium">Level:</span>
          {['', 'info', 'warn', 'error'].map((l) => (
            <button key={l} onClick={() => setFilterLevel(l)}
              className={`${chipBase} ${filterLevel === l ? chipActive : chipInactive}`}>
              {l === '' ? 'Alle' : l.charAt(0).toUpperCase() + l.slice(1)}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-gray-400 font-medium">Kategorie:</span>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="text-xs border border-gray-200 rounded px-1.5 py-0.5 text-gray-600"
          >
            <option value="">Alle</option>
            {Object.entries(CATEGORY_LABEL).map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Log table */}
      {loading ? (
        <p className="text-sm text-gray-400">Lädt…</p>
      ) : logs.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-3">📋</p>
          <p>Keine Logeinträge gefunden.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-500 whitespace-nowrap">Zeitpunkt</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Level</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500 hidden sm:table-cell">Kategorie</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Meldung</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {logs.map((entry) => (
                <>
                  <tr
                    key={entry.id}
                    onClick={() => entry.detail ? setExpanded(expanded === entry.id ? null : entry.id) : undefined}
                    className={`transition-colors ${LEVEL_ROW[entry.level] ?? 'hover:bg-gray-50'} ${entry.detail ? 'cursor-pointer' : ''}`}
                  >
                    <td className="px-4 py-2.5 text-xs text-gray-400 whitespace-nowrap font-mono">
                      {formatDateTime(entry.createdAt)}
                    </td>
                    <td className="px-4 py-2.5">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${LEVEL_BADGE[entry.level] ?? 'bg-gray-100 text-gray-600'}`}>
                        {entry.level}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-xs text-gray-500 hidden sm:table-cell">
                      {CATEGORY_LABEL[entry.category] ?? entry.category}
                    </td>
                    <td className="px-4 py-2.5 text-gray-800">
                      <div className="flex items-center gap-2">
                        <span>{entry.message}</span>
                        {entry.detail && (
                          <svg className={`w-3.5 h-3.5 text-gray-400 shrink-0 transition-transform ${expanded === entry.id ? 'rotate-90' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        )}
                      </div>
                    </td>
                  </tr>
                  {expanded === entry.id && entry.detail && (
                    <tr key={`${entry.id}-detail`} className={LEVEL_ROW[entry.level] ?? ''}>
                      <td colSpan={4} className="px-4 pb-3 pt-0">
                        <pre className="text-xs text-gray-600 bg-gray-100 rounded-lg px-3 py-2 overflow-x-auto whitespace-pre-wrap font-mono">
                          {entry.detail}
                        </pre>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
