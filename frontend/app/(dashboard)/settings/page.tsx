'use client';
import Link from 'next/link';
import { BookMarked, Users, Truck, Layers, ChevronRight } from 'lucide-react';

const tiles = [
  {
    href: '/settings/coa',
    icon: BookMarked,
    iconBg: 'bg-violet-50 dark:bg-violet-900/30',
    iconColor: 'text-violet-600 dark:text-violet-400',
    title: 'Chart of Accounts',
    desc: 'Kelola akun keuangan (asset, liability, equity, revenue, expense)',
  },
  {
    href: '/settings/customers',
    icon: Users,
    iconBg: 'bg-blue-50 dark:bg-blue-900/30',
    iconColor: 'text-blue-600 dark:text-blue-400',
    title: 'Customers',
    desc: 'Kelola data pelanggan dan kontak',
  },
  {
    href: '/settings/suppliers',
    icon: Truck,
    iconBg: 'bg-emerald-50 dark:bg-emerald-900/30',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
    title: 'Suppliers',
    desc: 'Kelola data pemasok bahan baku',
  },
  {
    href: '/bom',
    icon: Layers,
    iconBg: 'bg-amber-50 dark:bg-amber-900/30',
    iconColor: 'text-amber-600 dark:text-amber-400',
    title: 'Bill of Materials',
    desc: 'Komposisi bahan baku untuk setiap produk jadi',
  },
];

export default function SettingsPage() {
  return (
    <div className="p-6 md:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Pengaturan</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Konfigurasi master data dan referensi sistem</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {tiles.map(({ href, icon: Icon, iconBg, iconColor, title, desc }) => (
          <Link key={href} href={href}
            className="group bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 flex items-center gap-4 hover:border-blue-200 dark:hover:border-blue-700 hover:shadow-sm transition-all">
            <div className={`w-12 h-12 rounded-xl ${iconBg} flex items-center justify-center flex-shrink-0`}>
              <Icon size={22} className={iconColor} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-900 dark:text-white text-sm">{title}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-snug">{desc}</p>
            </div>
            <ChevronRight size={16} className="text-gray-300 dark:text-gray-700 group-hover:text-blue-400 transition-colors flex-shrink-0" />
          </Link>
        ))}
      </div>
    </div>
  );
}
