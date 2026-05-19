'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/api';

interface PO {
  id: string; poNumber: string; status: string; totalAmount: number;
  date: string; supplier: { name: string };
}

function formatRp(n: number) { return 'Rp ' + new Intl.NumberFormat('id-ID').format(n); }

const statusColors: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-600',
  submitted: 'bg-blue-100 text-blue-700',
  received: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-600',
};

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
        <h2 className="text-xl font-bold text-gray-900">Purchasing</h2>
        <p className="text-sm text-gray-500 mt-0.5">Purchase Order ke supplier</p>
      </div>

      <div className="flex gap-2 flex-wrap">
        {['', 'draft', 'submitted', 'received', 'cancelled'].map((s) => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors
              ${statusFilter === s ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}>
            {s === '' ? 'Semua' : s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
            <tr>
              {['No. PO', 'Supplier', 'Tanggal', 'Total', 'Status'].map((h) => (
                <th key={h} className="text-left px-4 py-3 font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y">
            {loading && <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">Memuat...</td></tr>}
            {!loading && orders.length === 0 && <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">Tidak ada data</td></tr>}
            {orders.map((po) => (
              <tr key={po.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-mono text-xs text-gray-600">{po.poNumber}</td>
                <td className="px-4 py-3 font-medium text-gray-900">{po.supplier.name}</td>
                <td className="px-4 py-3 text-gray-500">{new Date(po.date).toLocaleDateString('id-ID')}</td>
                <td className="px-4 py-3 font-semibold text-gray-900">{formatRp(po.totalAmount)}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[po.status] || 'bg-gray-100'}`}>
                    {po.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
