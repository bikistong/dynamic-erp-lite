'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Search } from 'lucide-react';

interface Invoice {
  id: string; invoiceNo: string; status: string;
  subtotal: number; taxAmount: number; totalAmount: number;
  date: string; customer: { name: string };
}

function formatRp(n: number) { return 'Rp ' + new Intl.NumberFormat('id-ID').format(n); }

const statusColors: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-600',
  posted: 'bg-blue-100 text-blue-700',
  paid: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-600',
};

export default function SalesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    setLoading(true);
    api.get('/sales/invoices', { params: { limit: 50, status: statusFilter || undefined } })
      .then((r) => setInvoices(r.data.data))
      .finally(() => setLoading(false));
  }, [statusFilter]);

  return (
    <div className="p-6 md:p-8 space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Sales</h2>
        <p className="text-sm text-gray-500 mt-0.5">Faktur penjualan</p>
      </div>

      <div className="flex gap-2 flex-wrap">
        {['', 'draft', 'posted', 'paid', 'cancelled'].map((s) => (
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
              {['No. Invoice', 'Customer', 'Tanggal', 'Subtotal', 'PPN', 'Total', 'Status'].map((h) => (
                <th key={h} className="text-left px-4 py-3 font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y">
            {loading && <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">Memuat...</td></tr>}
            {!loading && invoices.length === 0 && <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">Tidak ada data</td></tr>}
            {invoices.map((inv) => (
              <tr key={inv.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-mono text-xs text-gray-600">{inv.invoiceNo}</td>
                <td className="px-4 py-3 font-medium text-gray-900">{inv.customer.name}</td>
                <td className="px-4 py-3 text-gray-500">{new Date(inv.date).toLocaleDateString('id-ID')}</td>
                <td className="px-4 py-3 text-gray-700">{formatRp(inv.subtotal)}</td>
                <td className="px-4 py-3 text-gray-500">{formatRp(inv.taxAmount)}</td>
                <td className="px-4 py-3 font-semibold text-gray-900">{formatRp(inv.totalAmount)}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[inv.status] || 'bg-gray-100'}`}>
                    {inv.status}
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
