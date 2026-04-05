import type { Metadata } from 'next';
import './globals.css';
import { Sidebar } from '@/components/layout/Sidebar';
import { ChatWidget } from '@/components/ChatWidget';

export const metadata: Metadata = {
  title: 'Hausmanager',
  description: 'Rücklagenplanung für Ihr Einfamilienhaus',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de">
      <body className="bg-gray-50 text-gray-900 font-sans">
        <div className="flex min-h-screen">
          <Sidebar />
          <main className="flex-1 p-4 md:p-8 overflow-auto pb-20 md:pb-8">{children}</main>
        </div>
        <ChatWidget />
      </body>
    </html>
  );
}
