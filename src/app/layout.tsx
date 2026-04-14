import type { Metadata } from 'next';
import './globals.css';
import { Sidebar } from '@/components/layout/Sidebar';
import { ChatWidget } from '@/components/ChatWidget';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pkg = require('../../package.json') as { version: string };

export const metadata: Metadata = {
  title: 'Hausmanager',
  description: 'Rücklagenplanung für Ihr Einfamilienhaus',
};

function getInstallInfo(): { version: string; installedAt: string } {
  let gitHash = '';
  try {
    gitHash = '+' + execSync('git rev-parse --short HEAD', { timeout: 1000 }).toString().trim();
  } catch { /* git not available */ }

  try {
    const lockPath = path.join(process.cwd(), 'package-lock.json');
    const mtime = fs.statSync(lockPath).mtime;
    const installedAt = new Intl.DateTimeFormat('de-CH', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(mtime);
    return { version: pkg.version + gitHash, installedAt };
  } catch {
    return { version: pkg.version + gitHash, installedAt: '—' };
  }
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const { version, installedAt } = getInstallInfo();
  return (
    <html lang="de">
      <body className="bg-gray-50 text-gray-900 font-sans">
        <div className="flex h-screen overflow-hidden">
          <Sidebar version={version} installedAt={installedAt} />
          <main className="flex-1 overflow-y-auto p-4 md:p-8 pb-20 md:pb-8">{children}</main>
        </div>
        <ChatWidget />
      </body>
    </html>
  );
}
