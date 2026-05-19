'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { CheckCircle, Clock, XCircle, AlertCircle, CheckCheck } from 'lucide-react';

interface JobOrder {
  id: string; jobOrderNo: string; status: string; plannedQty: number;
  finishedGood: { name: string; uom: string };
  salesInvoice: { invoiceNo: string; customer: { name: string } };
  materials: { requiredQty: number; material: { name: string; stock: number } }[];
}

const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  draft:            { label: 'Draft',           color: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',       icon: Clock },
  waiting_material: { label: 'Tunggu Material', color: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400', icon: AlertCircle },
  ready:            { label: 'Siap Produksi',   color: 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',     icon: Clock },
  completed:        { label: 'Selesai',         color: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400', icon: CheckCircle },
  cancelled:        { label: 'Dibatalkan',      color: 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400',         icon: XCircle },
};

const filterBtns = ['', 'waiting_material', 'ready', 'completed', 'cancelled'];

export default function ProductionPage() {
  const [jobOrders, setJobOrders] = useState<JobOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [completing, setCompleting] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const res = await api.get('/production/job-orders', { params: { limit: 50, status: statusFilter || undefined } });
    setJobOrders(res.data.data);
    setLoading(false);
  }

  useEffect(() => { load(); }, [statusFilter]);

  async function complete(id: string) {
    if (!confirm('Selesaikan job order ini? Stok RM akan dikurangi dan stok FG akan ditambah.')) return;
    setCompleting(id);
    try {
      await api.put(`/production/job-orders/${id}/complete`);
      load();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      alert('Gagal: ' + (msg || 'Error'));
    } finally {
      setCompleting(null);
    }
  }

  return (
    <div className="p-6 md:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Production</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Job Order & proses produksi</p>
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
            {s === '' ? 'Semua' : statusConfig[s]?.label || s}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {loading && <div className="text-sm text-gray-300 dark:text-gray-700 py-10 text-center bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800">Memuat...</div>}
        {!loading && jobOrders.length === 0 && (
          <div className="text-sm text-gray-300 dark:text-gray-700 py-10 text-center bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800">
            Tidak ada job order
          </div>
        )}
        {jobOrders.map((jo) => {
          const cfg = statusConfig[jo.status] || statusConfig.draft;
          const Icon = cfg.icon;
          const canComplete = jo.status === 'ready' || jo.status === 'waiting_material';
          return (
            <div key={jo.id} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1.5">
                    <span className="font-mono text-xs text-gray-400 dark:text-gray-600">{jo.jobOrderNo}</span>
                    <span className={`flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full font-medium ${cfg.color}`}>
                      <Icon size={11} /> {cfg.label}
                    </span>
                  </div>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {jo.finishedGood.name}
                    <span className="text-gray-400 dark:text-gray-500 font-normal ml-1.5">× {jo.plannedQty} {jo.finishedGood.uom}</span>
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-600 mt-0.5">
                    {jo.salesInvoice.invoiceNo} · {jo.salesInvoice.customer.name}
                  </p>
                </div>
                {canComplete && (
                  <button
                    onClick={() => complete(jo.id)}
                    disabled={completing === jo.id}
                    className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2 rounded-xl text-xs font-medium transition-colors disabled:opacity-50 whitespace-nowrap flex-shrink-0"
                  >
                    <CheckCheck size={13} />
                    {completing === jo.id ? 'Proses...' : 'Selesaikan'}
                  </button>
                )}
              </div>

              <div className="mt-3.5 pt-3.5 border-t border-gray-100 dark:border-gray-800">
                <p className="text-xs font-medium text-gray-400 dark:text-gray-600 mb-2">Kebutuhan Material</p>
                <div className="flex flex-wrap gap-2">
                  {jo.materials.map((m, i) => {
                    const short = m.material.stock < m.requiredQty;
                    return (
                      <div key={i} className={`text-xs px-2.5 py-1.5 rounded-lg font-medium ${short ? 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400' : 'bg-gray-50 text-gray-600 dark:bg-gray-800 dark:text-gray-400'}`}>
                        {m.material.name} ({m.requiredQty} / stok: {m.material.stock}){short && ' ⚠'}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
