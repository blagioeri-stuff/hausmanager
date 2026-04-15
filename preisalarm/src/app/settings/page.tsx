'use client';

import { useEffect, useState } from 'react';

interface Settings {
  smtpHost?: string;
  smtpPort?: string;
  smtpUser?: string;
  smtpPass?: string;
  smtpFrom?: string;
  notifyEmail?: string;
  telegramToken?: string;
  telegramChatId?: string;
  claudeApiKey?: string;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/settings')
      .then((r) => r.json())
      .then((data: Settings) => { setSettings(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const set = (key: keyof Settings, value: string) =>
    setSettings((prev) => ({ ...prev, [key]: value }));

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    // Don't send placeholder values
    const toSave = Object.fromEntries(
      Object.entries(settings).filter(([, v]) => v && v !== '(set via env)')
    );
    await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(toSave),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  if (loading) return <div className="text-gray-400">Lade Einstellungen...</div>;

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-2">Einstellungen</h1>
      <p className="text-gray-500 mb-8">Benachrichtigungen und API-Schlüssel konfigurieren</p>

      <div className="space-y-6">
        {/* SMTP */}
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h2 className="font-semibold mb-1">E-Mail (SMTP)</h2>
          <p className="text-sm text-gray-500 mb-4">Für Preisalarm-Benachrichtigungen per E-Mail</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-xs font-medium text-gray-600 mb-1">SMTP Host</label>
              <input value={settings.smtpHost ?? ''} onChange={(e) => set('smtpHost', e.target.value)}
                placeholder="smtp.fastmail.com" className={inputClass} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Port</label>
              <input value={settings.smtpPort ?? ''} onChange={(e) => set('smtpPort', e.target.value)}
                placeholder="587" className={inputClass} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Benutzername</label>
              <input value={settings.smtpUser ?? ''} onChange={(e) => set('smtpUser', e.target.value)}
                placeholder="deine@email.ch" className={inputClass} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Passwort / App-Key</label>
              <input type="password" value={settings.smtpPass ?? ''} onChange={(e) => set('smtpPass', e.target.value)}
                placeholder="••••••••" className={inputClass} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Absender (From)</label>
              <input value={settings.smtpFrom ?? ''} onChange={(e) => set('smtpFrom', e.target.value)}
                placeholder="Preisalarm <deine@email.ch>" className={inputClass} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Empfänger (Notify To)</label>
              <input value={settings.notifyEmail ?? ''} onChange={(e) => set('notifyEmail', e.target.value)}
                placeholder="deine@email.ch" className={inputClass} />
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-3">
            Gmail: App-Passwort unter Konto → Sicherheit → 2-Faktor → App-Passwörter erstellen.
            FastMail: Einstellungen → Passwörter & App-Schlüssel.
          </p>
        </div>

        {/* Telegram */}
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h2 className="font-semibold mb-1">Telegram Bot</h2>
          <p className="text-sm text-gray-500 mb-4">
            Bot via{' '}
            <span className="font-mono text-blue-600">@BotFather</span> erstellen →
            Token kopieren. Chat-ID: Nachricht an Bot senden, dann
            {' '}<span className="font-mono">api.telegram.org/bot&lt;TOKEN&gt;/getUpdates</span> aufrufen.
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-xs font-medium text-gray-600 mb-1">Bot Token</label>
              <input
                type="password"
                value={settings.telegramToken === '(set via env)' ? '' : (settings.telegramToken ?? '')}
                onChange={(e) => set('telegramToken', e.target.value)}
                placeholder="123456:ABC-DEF..."
                className={inputClass}
              />
              {settings.telegramToken === '(set via env)' && (
                <p className="text-xs text-green-600 mt-1">✓ Via Umgebungsvariable gesetzt</p>
              )}
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Chat ID</label>
              <input value={settings.telegramChatId ?? ''} onChange={(e) => set('telegramChatId', e.target.value)}
                placeholder="123456789" className={inputClass} />
            </div>
          </div>
        </div>

        {/* Claude AI */}
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h2 className="font-semibold mb-1">Claude AI (optional)</h2>
          <p className="text-sm text-gray-500 mb-4">
            Für KI-basierte Preiserkennung wenn andere Methoden versagen.
            Nutzt Claude Haiku (günstigstes Modell).
          </p>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">API Key</label>
            <input
              type="password"
              value={settings.claudeApiKey === '(set via env)' ? '' : (settings.claudeApiKey ?? '')}
              onChange={(e) => set('claudeApiKey', e.target.value)}
              placeholder="sk-ant-..."
              className={inputClass}
            />
            {settings.claudeApiKey === '(set via env)' && (
              <p className="text-xs text-green-600 mt-1">✓ Via Umgebungsvariable gesetzt</p>
            )}
          </div>
        </div>

        {/* Save */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
          >
            {saving ? 'Speichere...' : 'Einstellungen speichern'}
          </button>
          {saved && <span className="text-green-600 text-sm">✓ Gespeichert</span>}
        </div>
      </div>
    </div>
  );
}

const inputClass =
  'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500';
