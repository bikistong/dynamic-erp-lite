'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/api';

interface PO {
  id: string; poNumber: string; status: string; totalAmount: number;
  date: string; supplier: { name: string };
}

function formatRp(n: number) { return 'Rp ' + new Intl.NumberFormat('id-ID').format(n); }

const statusColors: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  submitted: 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  received: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  cancelled: 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400',
};

const filterBtns = ['', 'draft', 'submitted', 'received', 'cancelled'];

export default function PurchasingPage() {
  const [orders, setOrders] = useState<PO[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    setLoading(true);
    api.get('/purchasing/orders', { params: { limit: 50, status: statusFilter || undefined } })
      .then((r) => setOrders(r.data.data))
      .finally(() => setLoading(false));
  }, [statusFilter]);

  return (
    <div className="p-6 md:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Purchasing</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Purchase Order ke supplier</p>
      </div>

      <div className="flex gap-2 flex-wrap">
        {filterBtns.map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-all ${
              statusFilter === s
                ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
            }`}
          >
            {s === '' ? 'Semua' : s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-800">
                {['No. PO', 'Supplier', 'Tanggal', 'Total', 'Status'].map((h) => (
                  <th key={h} className="text-left px-5 py-3.5 text-xs font-semibold text-gray-400 dark:text-gray-600 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={5} className="px-5 py-10 text-center text-gray-300 dark:text-gray-700 text-sm">Memuat...</td></tr>}
              {!loading && orders.length === 0 && <tr><td colSpan={5} className="px-5 py-10 text-center text-gray-300 dark:text-gray-700 text-sm">Tidak ada data</td></tr>}
              {orders.map((po) => (
                <tr key={po.id} className="border-b border-gray-50 dark:border-gray-800/60 hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
                  <td className="px-5 py-3.5 font-mono text-xs text-gray-500 dark:text-gray-400">{po.poNumber}</td>
                  <td className="px-5 py-3.5 font-medium text-gray-900 dark:text-white">{po.supplier.name}</td>
                  <td className="px-5 py-3.5 text-gray-500 dark:text-gray-400 text-xs">{new Date(po.date).toLocaleDateString('id-ID')}</td>
                  <td className="px-5 py-3.5 font-semibold text-gray-900 dark:text-white text-xs">{formatRp(po.totalAmount)}</td>
                  <td className="px-5 py-3.5">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusColors[po.status] || 'bg-gray-100 text-gray-500'}`}>
                      {po.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
