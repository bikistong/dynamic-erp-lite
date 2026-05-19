'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Area, AreaChart,
} from 'recharts';
import {
  FileText, TrendingUp, TrendingDown, Package, ShoppingCart,
  ArrowUpRight, ArrowDownRight, Users, DollarSign,
} from 'lucide-react';

interface Summary {
  totalItems: number;
  lowStockItems: number;
  totalCustomers: number;
  totalSuppliers: number;
  revenueThisMonth: number;
  revenueLastMonth: number;
  revenueGrowthPercent: number;
  pendingPOs: number;
  recentInvoices: { invoiceNo: string; status: string; totalAmount: number; date?: string; customer: { name: string } }[];
}

function formatRp(n: number) {
  if (n >= 1_000_000) return 'Rp ' + (n / 1_000_000).toFixed(1) + 'jt';
  if (n >= 1_000) return 'Rp ' + (n / 1_000).toFixed(0) + 'k';
  return 'Rp ' + n;
}

function formatRpFull(n: number) {
  return 'Rp ' + new Intl.NumberFormat('id-ID').format(n);
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

function buildMonthlyData(invoices: Summary['recentInvoices']) {
  const now = new Date();
  const months: { month: string; revenue: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({ month: MONTHS[d.getMonth()], revenue: 0 });
  }
  invoices.forEach((inv) => {
    const d = inv.date ? new Date(inv.date) : null;
    if (!d) return;
    const diff = (now.getFullYear() - d.getFullYear()) * 12 + (now.getMonth() - d.getMonth());
    if (diff >= 0 && diff < 6) {
      months[5 - diff].revenue += inv.totalAmount;
    }
  });
  return months;
}

const statusColors: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  posted: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400',
  paid: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400',
  cancelled: 'bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400',
};

const DONUT_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#6366f1'];

function StatCard({
  label, value, sub, trend, icon: Icon, iconBg, iconColor,
}: {
  label: string; value: string; sub: string; trend?: number;
  icon: React.ElementType; iconBg: string; iconColor: string;
}) {
  const up = trend !== undefined && trend >= 0;
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 flex flex-col gap-3">
      <div className="flex items-start justify-between">
        <div className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center`}>
          <Icon size={18} className={iconColor} />
        </div>
        {trend !== undefined && (
          <div className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${up ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-red-50 text-red-500 dark:bg-red-900/30 dark:text-red-400'}`}>
            {up ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
            {Math.abs(trend).toFixed(1)}%
          </div>
        )}
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{label}</p>
      </div>
      <p className="text-xs text-gray-400 dark:text-gray-600">{sub}</p>
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl shadow-lg px-3 py-2">
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{label}</p>
      <p className="text-sm font-bold text-gray-900 dark:text-white">{formatRp(payload[0].value)}</p>
    </div>
  );
};

export default function DashboardPage() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [allInvoices, setAllInvoices] = useState<Summary['recentInvoices']>([]);
  const [loading, setLoading] = useState(true);
  const today = new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  useEffect(() => {
    Promise.all([
      api.get('/dashboard/summary'),
      api.get('/sales/invoices', { params: { limit: 200 } }),
    ])
      .then(([sumRes, invRes]) => {
        setSummary(sumRes.data.data);
        setAllInvoices(invRes.data.data || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="p-8 flex items-center gap-3 text-gray-400">
        <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        Memuat data...
      </div>
    );
  }

  if (!summary) {
    return <div className="p-8 text-gray-400 text-sm">Gagal memuat data.</div>;
  }

  const monthlyData = buildMonthlyData(allInvoices);

  const statusCount = allInvoices.reduce<Record<string, number>>((acc, inv) => {
    acc[inv.status] = (acc[inv.status] || 0) + 1;
    return acc;
  }, {});
  const donutData = Object.entries(statusCount).map(([name, value]) => ({ name, value }));

  const paidTotal = allInvoices.filter((i) => i.status === 'paid').reduce((s, i) => s + i.totalAmount, 0);
  const postedTotal = allInvoices.filter((i) => i.status === 'posted').reduce((s, i) => s + i.totalAmount, 0);

  return (
    <div className="p-6 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 capitalize">{today}</p>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          label="Total Invoice"
          value={String(allInvoices.length)}
          sub="Semua waktu"
          icon={FileText}
          iconBg="bg-blue-50 dark:bg-blue-900/30"
          iconColor="text-blue-600 dark:text-blue-400"
        />
        <StatCard
          label="Revenue Bulan Ini"
          value={formatRp(summary.revenueThisMonth)}
          sub={`Bulan lalu ${formatRp(summary.revenueLastMonth)}`}
          trend={summary.revenueGrowthPercent}
          icon={DollarSign}
          iconBg="bg-emerald-50 dark:bg-emerald-900/30"
          iconColor="text-emerald-600 dark:text-emerald-400"
        />
        <StatCard
          label="Total Item"
          value={String(summary.totalItems)}
          sub={`${summary.lowStockItems} stok menipis`}
          icon={Package}
          iconBg="bg-violet-50 dark:bg-violet-900/30"
          iconColor="text-violet-600 dark:text-violet-400"
        />
        <StatCard
          label="PO Pending"
          value={String(summary.pendingPOs)}
          sub={`${summary.totalSuppliers} supplier aktif`}
          icon={ShoppingCart}
          iconBg="bg-amber-50 dark:bg-amber-900/30"
          iconColor="text-amber-600 dark:text-amber-400"
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Bar chart */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="font-semibold text-gray-900 dark:text-white text-sm">Dinamika Penjualan</p>
              <p className="text-xs text-gray-400 dark:text-gray-600 mt-0.5">6 bulan terakhir</p>
            </div>
            <TrendingUp size={18} className="text-blue-500" />
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={monthlyData} barSize={28}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} tickFormatter={formatRp} width={55} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f9fafb' }} />
              <Bar dataKey="revenue" fill="#3b82f6" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Donut chart */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5">
          <div className="mb-4">
            <p className="font-semibold text-gray-900 dark:text-white text-sm">Status Invoice</p>
            <p className="text-xs text-gray-400 dark:text-gray-600 mt-0.5">Distribusi semua invoice</p>
          </div>
          {donutData.length === 0 ? (
            <div className="flex items-center justify-center h-40 text-gray-300 dark:text-gray-700 text-sm">Belum ada data</div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie
                    data={donutData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={70}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {donutData.map((_, i) => (
                      <Cell key={i} fill={DONUT_COLORS[i % DONUT_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v, n) => [v, n]} />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-2 space-y-1.5">
                {donutData.map((d, i) => (
                  <div key={d.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ background: DONUT_COLORS[i % DONUT_COLORS.length] }} />
                      <span className="text-gray-600 dark:text-gray-400 capitalize">{d.name}</span>
                    </div>
                    <span className="font-medium text-gray-900 dark:text-white">{d.value}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Metrics + Table row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Metric cards */}
        <div className="space-y-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Invoice Lunas</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white">{formatRpFull(paidTotal)}</p>
            <div className="mt-3 h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all"
                style={{ width: (paidTotal + postedTotal) > 0 ? `${(paidTotal / (paidTotal + postedTotal)) * 100}%` : '0%' }}
              />
            </div>
            <p className="text-xs text-gray-400 mt-1.5">dari total invoice aktif</p>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Pelanggan</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white">{summary.totalCustomers}</p>
            <p className="text-xs text-gray-400 dark:text-gray-600 mt-1">Total pelanggan terdaftar</p>
          </div>
        </div>

        {/* Recent invoices table */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
            <p className="font-semibold text-gray-900 dark:text-white text-sm">Invoice Terbaru</p>
            <span className="text-xs text-gray-400 dark:text-gray-600">{summary.recentInvoices.length} entri</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-50 dark:border-gray-800">
                  {['No. Invoice', 'Customer', 'Total', 'Status'].map((h) => (
                    <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-gray-400 dark:text-gray-600 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {summary.recentInvoices.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-5 py-8 text-center text-gray-300 dark:text-gray-700 text-xs">Belum ada invoice</td>
                  </tr>
                )}
                {summary.recentInvoices.map((inv) => (
                  <tr key={inv.invoiceNo} className="border-b border-gray-50 dark:border-gray-800/60 hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
                    <td className="px-5 py-3.5 font-mono text-xs text-gray-500 dark:text-gray-400">{inv.invoiceNo}</td>
                    <td className="px-5 py-3.5 font-medium text-gray-900 dark:text-white text-xs">{inv.customer.name}</td>
                    <td className="px-5 py-3.5 text-xs font-semibold text-gray-800 dark:text-gray-200">{formatRpFull(inv.totalAmount)}</td>
                    <td className="px-5 py-3.5">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusColors[inv.status] || 'bg-gray-100 text-gray-500'}`}>
                        {inv.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
