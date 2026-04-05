'use client';

import { useState } from 'react';
import { Card, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

interface Props {
  initialSettings: Record<string, string>;
}

function Field({ label, description, value, onChange, type = 'text', placeholder }: {
  label: string;
  description?: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
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
        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />
    </div>
  );
}

export function EinstellungenForm({ initialSettings }: Props) {
  const [settings, setSettings] = useState<Record<string, string>>(initialSettings);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [testingApi, setTestingApi] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);

  function set(key: string, value: string) {
    setSettings((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  }

  async function handleSave() {
    setSaving(true);
    try {
      await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      setSaved(true);
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
          <Field
            label="API-Key"
            type="password"
            placeholder="sk-ant-..."
            value={settings.claudeApiKey ?? ''}
            onChange={(v) => set('claudeApiKey', v)}
          />
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
              disabled={!settings.claudeApiKey}
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
      </div>
    </div>
  );
}
