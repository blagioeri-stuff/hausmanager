import { Card } from '@/components/ui/Card';

export const dynamic = 'force-dynamic';

interface LoginPageProps {
  searchParams: { error?: string; next?: string };
}

export default function LoginPage({ searchParams }: LoginPageProps) {
  const error = searchParams.error;
  const next = searchParams.next ?? '/';

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-6">
          <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center mb-3">
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"
              />
            </svg>
          </div>
          <h1 className="text-lg font-semibold text-gray-900">Hausmanager</h1>
          <p className="text-sm text-gray-500">Bitte einloggen</p>
        </div>

        <form method="POST" action="/api/auth/login" className="space-y-4">
          <input type="hidden" name="next" value={next} />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="password">
              Passwort
            </label>
            <input
              id="password"
              type="password"
              name="password"
              autoFocus
              required
              autoComplete="current-password"
              className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          {error === '1' && <p className="text-sm text-red-600">Falsches Passwort.</p>}
          {error === 'rate' && (
            <p className="text-sm text-red-600">Zu viele Versuche. Bitte warte 15 Minuten.</p>
          )}
          {error === 'config' && (
            <p className="text-sm text-red-600">Auth ist nicht konfiguriert (siehe README).</p>
          )}
          <button
            type="submit"
            className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
          >
            Einloggen
          </button>
        </form>
      </Card>
    </div>
  );
}
