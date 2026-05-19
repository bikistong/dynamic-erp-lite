'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { CheckCircle, Clock, XCircle, AlertCircle } from 'lucide-react';

interface JobOrder {
  id: string; jobOrderNo: string; status: string; plannedQty: number;
  finishedGood: { name: string; uom: string };
  salesInvoice: { invoiceNo: string; customer: { name: string } };
  materials: { requiredQty: number; material: { name: string; stock: number } }[];
}

const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  draft:            { label: 'Draft',             color: 'bg-gray-100 text-gray-600',   icon: Clock },
  waiting_material: { label: 'Tunggu Material',   color: 'bg-orange-100 text-orange-700', icon: AlertCircle },
  ready:            { label: 'Siap Produksi',     color: 'bg-blue-100 text-blue-700',   icon: Clock },
  completed:        { label: 'Selesai',           color: 'bg-green-100 text-green-700', icon: CheckCircle },
  cancelled:        { label: 'Dibatalkan',        color: 'bg-red-100 text-red-600',     icon: XCircle },
};

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
        <h2 className="text-xl font-bold text-gray-900">Production</h2>
        <p className="text-sm text-gray-500 mt-0.5">Job Order & proses produksi</p>
      </div>

      <div className="flex gap-2 flex-wrap">
        {['', 'waiting_material', 'ready', 'completed', 'cancelled'].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors
              ${statusFilter === s ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
          >
            {s === '' ? 'Semua' : statusConfig[s]?.label || s}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {loading && <div className="text-sm text-gray-400 py-8 text-center">Memuat...</div>}
        {!loading && jobOrders.length === 0 && <div className="text-sm text-gray-400 py-8 text-center bg-white rounded-xl border">Tidak ada job order</div>}
        {jobOrders.map((jo) => {
          const cfg = statusConfig[jo.status] || statusConfig.draft;
          const Icon = cfg.icon;
          return (
            <div key={jo.id} className="bg-white rounded-xl border p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs text-gray-400">{jo.jobOrderNo}</span>
                    <span className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${cfg.color}`}>
                      <Icon size={11} /> {cfg.label}
                    </span>
                  </div>
                  <p className="font-semibold text-gray-900 mt-1">
                    {jo.finishedGood.name} — {jo.plannedQty} {jo.finishedGood.uom}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Invoice: {jo.salesInvoice.invoiceNo} · {jo.salesInvoice.customer.name}
                  </p>
                </div>
                {(jo.status === 'ready' || jo.status === 'waiting_material') && (
                  <button
                    onClick={() => complete(jo.id)}
                    disabled={completing === jo.id}
                    className="bg-green-600 text-white px-4 py-1.5 rounded-lg text-xs font-medium hover:bg-green-700 disabled:opacity-50 whitespace-nowrap"
                  >
                    {completing === jo.id ? 'Proses...' : 'Selesaikan'}
                  </button>
                )}
              </div>

              <div className="mt-3 pt-3 border-t">
                <p className="text-xs font-medium text-gray-500 mb-2">Kebutuhan Material:</p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {jo.materials.map((m, i) => {
                    const short = m.material.stock < m.requiredQty;
                    return (
                      <div key={i} className={`text-xs px-2 py-1.5 rounded-lg ${short ? 'bg-red-50 text-red-700' : 'bg-gray-50 text-gray-600'}`}>
                        <span className="font-medium">{m.material.name}</span>
                        <span className="ml-1">({m.requiredQty} / stok: {m.material.stock})</span>
                        {short && <span className="ml-1 font-bold">⚠</span>}
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
