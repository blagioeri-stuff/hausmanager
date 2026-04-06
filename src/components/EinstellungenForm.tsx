'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

interface BackupInfo {
  filename: string;
  createdAt: string;
  sizeBytes: number;
  label: 'auto' | 'manual';
}

interface Props {
  initialSettings: Record<string, string>;
  apiKeyViaEnv?: boolean;
}

function Field({ label, description, value, onChange, type = 'text', placeholder, disabled }: {
  label: string;
  description?: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  disabled?: boolean;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {description && <p className="text-xs text-gray-400 mb-1.5">{description}</p>}
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-400"
      />
    </div>
  );
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function EinstellungenForm({ initialSettings, apiKeyViaEnv = false }: Props) {
  const [settings, setSettings] = useState<Record<string, string>>(initialSettings);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [testingApi, setTestingApi] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);

  // Backup state
  const [backups, setBackups] = useState<BackupInfo[]>([]);
  const [backupLoading, setBackupLoading] = useState(false);
  const [backupCreating, setBackupCreating] = useState(false);
  const [restoreResult, setRestoreResult] = useState<'success' | 'error' | null>(null);
  const [restoringFilename, setRestoringFilename] = useState<string | null>(null);

  const loadBackups = useCallback(async () => {
    setBackupLoading(true);
    try {
      const res = await fetch('/api/backup');
      if (res.ok) {
        const data = await res.json();
        setBackups(data.slice(0, 3));
      }
    } finally {
      setBackupLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBackups();
  }, [loadBackups]);

  function set(key: string, value: string) {
    setSettings((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  }

  async function handleSave() {
    setSaving(true);
    setSaveError(null);
    setSaved(false);
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        setSaveError(errData?.error ?? `Fehler ${res.status}`);
        return;
      }
      window.location.href = '/einstellungen';
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : 'Netzwerkfehler');
    } finally {
      setSaving(false);
    }
  }

  async function handleTestApiKey() {
    setTestingApi(true);
    setTestResult(null);
    try {
      const res = await fetch('/api/chat/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: settings.claudeApiKey, model: settings.claudeModel || 'claude-haiku-4-5-20251001' }),
      });
      const data = await res.json();
      setTestResult(res.ok ? { ok: true, message: 'API-Key funktioniert!' } : { ok: false, message: data.error ?? 'Fehler beim Testen' });
    } catch {
      setTestResult({ ok: false, message: 'Netzwerkfehler' });
    } finally {
      setTestingApi(false);
    }
  }

  async function handleCreateBackup() {
    setBackupCreating(true);
    try {
      const res = await fetch('/api/backup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create' }),
      });
      if (res.ok) await loadBackups();
    } finally {
      setBackupCreating(false);
    }
  }

  async function handleRestore(filename: string) {
    if (!confirm(`Backup "${filename}" wiederherstellen? Alle aktuellen Daten werden ersetzt.`)) return;
    setRestoringFilename(filename);
    setRestoreResult(null);
    try {
      const res = await fetch('/api/backup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'restore', filename }),
      });
      setRestoreResult(res.ok ? 'success' : 'error');
    } finally {
      setRestoringFilename(null);
    }
  }

  function downloadUrl(format: 'json' | 'csv') {
    window.location.href = `/api/export?format=${format}`;
  }

  return (
    <div className="space-y-6">
      {/* IST-Rücklage */}
      <Card>
        <CardTitle className="mb-1">IST-Rücklage</CardTitle>
        <p className="text-xs text-gray-400 mb-4">Tragen Sie Ihr aktuelles Rücklagenguthaben ein, um den Deckungsgrad auf dem Dashboard zu sehen.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field
            label="Aktuelles Guthaben (CHF)"
            type="number"
            placeholder="z.B. 45000"
            description="Betrag, der heute auf Ihrem Spar-/Rücklagenkonto liegt"
            value={settings.istReserveChf ?? ''}
            onChange={(v) => set('istReserveChf', v)}
          />
          <Field
            label="Monatliche Einzahlung (CHF)"
            type="number"
            placeholder="z.B. 500"
            description="Fixer Betrag, den Sie monatlich auf die Rücklage einzahlen"
            value={settings.monthlyContributionChf ?? ''}
            onChange={(v) => set('monthlyContributionChf', v)}
          />
        </div>
      </Card>

      {/* General */}
      <Card>
        <CardTitle className="mb-4">Allgemein</CardTitle>
        <div className="space-y-4">
          <Field
            label="Hausname / Bezeichnung"
            placeholder="z.B. Einfamilienhaus Musterstrasse 1"
            value={settings.houseName ?? ''}
            onChange={(v) => set('houseName', v)}
          />
          <Field
            label="Adresse"
            placeholder="Strasse, PLZ Ort"
            value={settings.houseAddress ?? ''}
            onChange={(v) => set('houseAddress', v)}
          />
          <Field
            label="Hauswert (CHF)"
            type="number"
            placeholder="z.B. 850000"
            value={settings.houseValueChf ?? ''}
            onChange={(v) => set('houseValueChf', v)}
          />
        </div>
      </Card>

      {/* Claude AI */}
      <Card>
        <CardTitle className="mb-1">Claude AI</CardTitle>
        <p className="text-xs text-gray-400 mb-4">Für AI-Chat und Dokumentenverarbeitung. API-Key von console.anthropic.com.</p>
        <div className="space-y-4">
          {apiKeyViaEnv ? (
            <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
              <svg className="h-4 w-4 text-green-600 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <p className="text-sm text-green-700">
                API-Key via <code className="font-mono text-xs bg-green-100 px-1 rounded">CLAUDE_API_KEY</code> Umgebungsvariable gesetzt.
              </p>
            </div>
          ) : (
            <Field
              label="API-Key"
              type="password"
              placeholder="sk-ant-..."
              value={settings.claudeApiKey ?? ''}
              onChange={(v) => set('claudeApiKey', v)}
            />
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Modell</label>
            <select
              value={settings.claudeModel ?? 'claude-haiku-4-5-20251001'}
              onChange={(e) => set('claudeModel', e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="claude-haiku-4-5-20251001">Claude Haiku (schnell, günstig)</option>
              <option value="claude-sonnet-4-6">Claude Sonnet (ausgewogen)</option>
              <option value="claude-opus-4-6">Claude Opus (leistungsstark)</option>
            </select>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleTestApiKey}
              loading={testingApi}
              disabled={!apiKeyViaEnv && !settings.claudeApiKey}
            >
              API-Key testen
            </Button>
            {testResult && (
              <span className={`text-sm ${testResult.ok ? 'text-green-600' : 'text-red-500'}`}>
                {testResult.message}
              </span>
            )}
          </div>
        </div>
      </Card>

      {/* Backup */}
      <Card>
        <CardTitle className="mb-1">Datensicherung</CardTitle>
        <p className="text-xs text-gray-400 mb-4">
          Automatische Sicherung täglich um Mitternacht (Zurich). Sicherungen werden unter <code className="font-mono text-xs">data/backups/</code> gespeichert.
        </p>

        {restoreResult === 'success' && (
          <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center justify-between">
            <p className="text-sm text-amber-700">Backup wiederhergestellt — bitte Seite neu laden.</p>
            <button onClick={() => window.location.reload()} className="text-xs text-amber-700 underline font-medium">Neu laden</button>
          </div>
        )}
        {restoreResult === 'error' && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">Fehler beim Wiederherstellen.</p>
          </div>
        )}

        <div className="space-y-2 mb-4">
          {backupLoading ? (
            <p className="text-sm text-gray-400">Lade Sicherungen…</p>
          ) : backups.length === 0 ? (
            <p className="text-sm text-gray-400">Noch keine Sicherungen vorhanden.</p>
          ) : (
            backups.map((b) => (
              <div key={b.filename} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm text-gray-700">
                    {new Date(b.createdAt).toLocaleString('de-CH', { dateStyle: 'medium', timeStyle: 'short' })}
                    <span className={`ml-2 text-xs px-1.5 py-0.5 rounded-full ${b.label === 'auto' ? 'bg-blue-100 text-blue-600' : 'bg-gray-200 text-gray-500'}`}>
                      {b.label === 'auto' ? 'auto' : 'manuell'}
                    </span>
                  </p>
                  <p className="text-xs text-gray-400">{formatBytes(b.sizeBytes)}</p>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleRestore(b.filename)}
                  loading={restoringFilename === b.filename}
                >
                  Wiederherstellen
                </Button>
              </div>
            ))
          )}
        </div>

        <Button variant="secondary" size="sm" onClick={handleCreateBackup} loading={backupCreating}>
          Jetzt sichern
        </Button>
      </Card>

      {/* Export */}
      <Card>
        <CardTitle className="mb-1">Daten-Export</CardTitle>
        <p className="text-xs text-gray-400 mb-4">Alle Komponenten, Wartungshistorie und Dokument-Metadaten exportieren.</p>
        <div className="flex gap-3 flex-wrap">
          <Button variant="secondary" size="sm" onClick={() => downloadUrl('json')}>
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            JSON exportieren
          </Button>
          <Button variant="secondary" size="sm" onClick={() => downloadUrl('csv')}>
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            CSV exportieren
          </Button>
        </div>
      </Card>

      {/* Save */}
      <div className="flex items-center gap-3">
        <Button onClick={handleSave} loading={saving}>
          Einstellungen speichern
        </Button>
        {saved && <span className="text-sm text-green-600">Gespeichert.</span>}
        {saveError && <span className="text-sm text-red-500">Fehler: {saveError}</span>}
      </div>
    </div>
  );
}
