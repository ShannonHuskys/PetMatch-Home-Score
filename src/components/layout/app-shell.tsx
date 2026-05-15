'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Settings,
  LogOut,
  Menu,
  X,
  PawPrint,
  Sparkles,
  Users,
} from 'lucide-react';
const isDemoMode =
  typeof window !== 'undefined' &&
  (!process.env.NEXT_PUBLIC_SUPABASE_URL ||
   process.env.NEXT_PUBLIC_SUPABASE_URL === 'https://your-project.supabase.co');

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Quick Analyze', href: '/analyses/quick', icon: Sparkles },
  { name: 'Saved Pets', href: '/saved-pets', icon: Users },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  async function handleSignOut() {
    if (isDemoMode) {
      router.push('/login?signout=true');
      return;
    }
    const { createClient } = await import('@/lib/supabase/client');
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Desktop sidebar */}
      <aside className="hidden w-64 flex-col border-r border-gray-200 bg-white lg:flex">
        <div className="flex h-16 items-center gap-3 border-b border-gray-200 px-6">
          <PawPrint className="h-7 w-7 text-brand-600" />
          <span className="text-lg font-bold text-gray-900">PetMatch</span>
        </div>
        <nav className="flex-1 px-4 py-6">
          <ul className="space-y-1">
            {navigation.map((item) => {
              const active = pathname.startsWith(item.href);
              return (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                      active
                        ? 'bg-brand-50 text-brand-700'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <item.icon className="h-5 w-5" />
                    {item.name}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        <div className="border-t border-gray-200 px-4 py-4">
          <button
            onClick={handleSignOut}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900"
          >
            <LogOut className="h-5 w-5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile header */}
      <div className="flex flex-1 flex-col">
        <header className="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-4 lg:hidden">
          <div className="flex items-center gap-3">
            <PawPrint className="h-6 w-6 text-brand-600" />
            <span className="text-lg font-bold text-gray-900">PetMatch</span>
          </div>
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="rounded-lg p-2 text-gray-600 hover:bg-gray-100"
          >
            {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </header>

        {/* Mobile nav overlay */}
        {mobileOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div className="fixed inset-0 bg-black/20" onClick={() => setMobileOpen(false)} />
            <div className="fixed inset-y-0 left-0 w-64 bg-white shadow-xl">
              <div className="flex h-16 items-center gap-3 border-b border-gray-200 px-6">
                <PawPrint className="h-7 w-7 text-brand-600" />
                <span className="text-lg font-bold text-gray-900">PetMatch</span>
              </div>
              <nav className="px-4 py-6">
                <ul className="space-y-1">
                  {navigation.map((item) => {
                    const active = pathname.startsWith(item.href);
                    return (
                      <li key={item.name}>
                        <Link
                          href={item.href}
                          onClick={() => setMobileOpen(false)}
                          className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                            active
                              ? 'bg-brand-50 text-brand-700'
                              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                          }`}
                        >
                          <item.icon className="h-5 w-5" />
                          {item.name}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </nav>
              <div className="border-t border-gray-200 px-4 py-4">
                <button
                  onClick={handleSignOut}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
                >
                  <LogOut className="h-5 w-5" />
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        )}

        {isDemoMode && (
          <div className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-center text-sm text-amber-800">
            <strong>Demo Mode</strong> — Using mock data. Connect Supabase to enable full functionality.
          </div>
        )}
        <main className="flex-1 px-4 py-8 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
