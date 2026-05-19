'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Package, Users, TrendingUp, ShoppingCart, AlertTriangle, Clock } from 'lucide-react';

interface Summary {
  totalItems: number;
  lowStockItems: number;
  totalCustomers: number;
  totalSuppliers: number;
  revenueThisMonth: number;
  revenueLastMonth: number;
  revenueGrowthPercent: number;
  pendingPOs: number;
  recentInvoices: { invoiceNo: string; status: string; totalAmount: number; customer: { name: string } }[];
}

function formatRp(n: number) {
  return 'Rp ' + new Intl.NumberFormat('id-ID').format(n);
}

function StatCard({ icon: Icon, label, value, sub, color }: {
  icon: React.ElementType; label: string; value: string; sub?: string; color: string;
}) {
  return (
    <div className="bg-white rounded-xl border p-5 flex items-start gap-4">
      <div className={`p-2.5 rounded-lg ${color}`}>
        <Icon size={20} className="text-white" />
      </div>
      <div>
        <p className="text-xs text-gray-500">{label}</p>
        <p className="text-xl font-bold text-gray-900 mt-0.5">{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

const statusColors: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-600',
  posted: 'bg-blue-100 text-blue-700',
  paid: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-600',
};

export default function DashboardPage() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboard/summary')
      .then((r) => setSummary(r.data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-8 text-gray-400 text-sm">Memuat data...</div>;
  if (!summary) return <div className="p-8 text-gray-400 text-sm">Gagal memuat data.</div>;

  return (
    <div className="p-6 md:p-8 space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Dashboard</h2>
        <p className="text-sm text-gray-500 mt-0.5">Ringkasan bisnis hari ini</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Package} label="Total Item" value={String(summary.totalItems)} color="bg-blue-500" />
        <StatCard icon={AlertTriangle} label="Stok Menipis" value={String(summary.lowStockItems)} sub="< 10 unit" color="bg-orange-500" />
        <StatCard icon={Users} label="Pelanggan" value={String(summary.totalCustomers)} color="bg-purple-500" />
        <StatCard icon={ShoppingCart} label="PO Pending" value={String(summary.pendingPOs)} color="bg-yellow-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border p-5">
          <div className="flex items-center gap-3 mb-1">
            <TrendingUp size={18} className="text-green-500" />
            <span className="text-sm font-medium text-gray-700">Revenue Bulan Ini</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{formatRp(summary.revenueThisMonth)}</p>
          <p className="text-xs text-gray-400 mt-1">
            Bulan lalu: {formatRp(summary.revenueLastMonth)}
            {' · '}
            <span className={summary.revenueGrowthPercent >= 0 ? 'text-green-600' : 'text-red-500'}>
              {summary.revenueGrowthPercent >= 0 ? '+' : ''}{summary.revenueGrowthPercent.toFixed(1)}%
            </span>
          </p>
        </div>

        <div className="bg-white rounded-xl border p-5">
          <div className="flex items-center gap-3 mb-3">
            <Clock size={18} className="text-blue-500" />
            <span className="text-sm font-medium text-gray-700">Invoice Terbaru</span>
          </div>
          <div className="space-y-2">
            {summary.recentInvoices.length === 0 && (
              <p className="text-xs text-gray-400">Belum ada invoice</p>
            )}
            {summary.recentInvoices.map((inv) => (
              <div key={inv.invoiceNo} className="flex items-center justify-between text-sm">
                <div>
                  <span className="font-medium text-gray-800">{inv.invoiceNo}</span>
                  <span className="text-gray-400 ml-2 text-xs">{inv.customer.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-600">{formatRp(inv.totalAmount)}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[inv.status] || 'bg-gray-100 text-gray-600'}`}>
                    {inv.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
