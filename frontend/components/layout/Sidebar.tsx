'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard, Package, ShoppingCart, FileText,
  BookOpen, Factory, LogOut, Settings, Menu, X,
  Sun, Moon, Zap, HelpCircle,
} from 'lucide-react';
import { useState } from 'react';
import { useTheme } from '@/components/ThemeProvider';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/inventory', label: 'Inventory', icon: Package },
  { href: '/purchasing', label: 'Purchasing', icon: ShoppingCart },
  { href: '/sales', label: 'Sales', icon: FileText },
  { href: '/production', label: 'Production', icon: Factory },
  { href: '/accounting', label: 'Accounting', icon: BookOpen },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, toggle } = useTheme();
  const [open, setOpen] = useState(false);

  function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  }

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-5 pt-6 pb-5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <Zap size={16} className="text-white" />
          </div>
          <div>
            <p className="font-bold text-gray-900 dark:text-white text-sm leading-tight">Dynamic ERP</p>
            <p className="text-xs text-gray-400 dark:text-gray-500">UMKM Suite</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto">
        <p className="px-3 mb-2 text-xs font-semibold text-gray-400 dark:text-gray-600 uppercase tracking-wider">Menu</p>
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/');
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all
                ${active
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-200 dark:shadow-none'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
                }`}
            >
              <Icon size={17} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="px-3 pb-4 space-y-1">
        {/* Help card */}
        <div className="mx-1 mb-3 p-3 rounded-xl bg-blue-50 dark:bg-blue-950/50 border border-blue-100 dark:border-blue-900">
          <div className="flex items-center gap-2 mb-1">
            <HelpCircle size={14} className="text-blue-600 dark:text-blue-400" />
            <p className="text-xs font-semibold text-blue-700 dark:text-blue-400">Butuh bantuan?</p>
          </div>
          <p className="text-xs text-blue-600/70 dark:text-blue-500/70 leading-snug">
            Lihat dokumentasi API di /api/docs
          </p>
        </div>

        <p className="px-3 mb-1 text-xs font-semibold text-gray-400 dark:text-gray-600 uppercase tracking-wider">System</p>

        <button
          onClick={toggle}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white w-full transition-all"
        >
          {theme === 'light' ? <Moon size={17} /> : <Sun size={17} />}
          {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
        </button>
        <Link
          href="/settings"
          onClick={() => setOpen(false)}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium w-full transition-all ${
            pathname.startsWith('/settings') || pathname === '/bom'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          <Settings size={17} />
          Pengaturan
        </Link>
        <button
          onClick={logout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 w-full transition-all"
        >
          <LogOut size={17} />
          Keluar
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile toggle */}
      <button
        className="fixed top-4 left-4 z-50 md:hidden bg-white dark:bg-gray-900 border dark:border-gray-700 rounded-xl p-2 shadow-sm"
        onClick={() => setOpen(!open)}
      >
        {open ? <X size={20} /> : <Menu size={20} />}
      </button>

      {open && (
        <div
          className="fixed inset-0 bg-black/40 z-30 md:hidden backdrop-blur-sm"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Desktop sidebar */}
      <aside className="hidden md:flex fixed top-0 left-0 h-full w-64 flex-col bg-white dark:bg-gray-900 border-r border-gray-100 dark:border-gray-800 z-40">
        <SidebarContent />
      </aside>

      {/* Mobile sidebar */}
      <aside className={`md:hidden fixed top-0 left-0 h-full w-64 flex flex-col bg-white dark:bg-gray-900 border-r border-gray-100 dark:border-gray-800 z-40 transition-transform duration-200 ${open ? 'translate-x-0' : '-translate-x-full'}`}>
        <SidebarContent />
      </aside>
    </>
  );
}
