'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: '📊' },
  { href: '/products', label: 'Produkte', icon: '🛍️' },
  { href: '/admin', label: 'Admin', icon: '🔧' },
  { href: '/log', label: 'Protokoll', icon: '📋' },
];

const settingsItem = { href: '/settings', label: 'Einstellungen', icon: '⚙️' };

export function Sidebar() {
  const pathname = usePathname();
  const isActive = (href: string) =>
    pathname === href || (href !== '/dashboard' && pathname.startsWith(href));

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-white border-r border-gray-200 flex flex-col shadow-sm z-10">
      <div className="p-6 border-b border-gray-200">
        <h1 className="text-xl font-bold text-blue-600">🔔 Preisalarm</h1>
        <p className="text-xs text-gray-500 mt-1">Universeller Preisverfolger</p>
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => (
          <Link key={item.href} href={item.href}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              isActive(item.href) ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
            }`}>
            <span>{item.icon}</span>{item.label}
          </Link>
        ))}
      </nav>
      <div className="p-4 border-t border-gray-200">
        <Link href={settingsItem.href}
          className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
            isActive(settingsItem.href) ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
          }`}>
          <span>{settingsItem.icon}</span>{settingsItem.label}
        </Link>
      </div>
    </aside>
  );
}
