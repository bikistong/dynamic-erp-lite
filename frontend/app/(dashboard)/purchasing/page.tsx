'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Plus, X, Trash2, ShoppingCart, PackageCheck, Send, Ban } from 'lucide-react';

interface PO {
  id: string; poNumber: string; status: string; totalAmount: number;
  date: string; supplier: { name: string };
}
interface GRN {
  id: string; receiptNumber: string; poNumber: string; status: string;
  date: string; notes?: string;
}
interface Supplier { id: string; name: string; }
interface Item { id: string; sku: string; name: string; uom: string; purchasePrice: number; }
interface POLine { itemId: string; quantity: number; unitPrice: number; }
interface PODetail {
  id: string; poNumber: string;
  lines: { id: string; itemId: string; item: { sku: string; name: string; uom: string }; quantity: number; unitPrice: number; receivedQty: number }[];
}

function formatRp(n: number) { return 'Rp ' + new Intl.NumberFormat('id-ID').format(n); }
const today = () => new Date().toISOString().slice(0, 10);
const emptyPoLine = (): POLine => ({ itemId: '', quantity: 1, unitPrice: 0 });

const statusColors: Record<string, string> = {
  draft:     'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  submitted: 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  received:  'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  cancelled: 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400',
  posted:    'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
};

export default function PurchasingPage() {
  const router = useRouter();
  const [tab, setTab] = useState<'po' | 'grn'>('po');

  // PO state
  const [orders, setOrders] = useState<PO[]>([]);
  const [poLoading, setPoLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [actioning, setActioning] = useState<string | null>(null);

  // GRN state
  const [receipts, setReceipts] = useState<GRN[]>([]);
  const [grnLoading, setGrnLoading] = useState(true);

  // Create PO modal
  const [poModal, setPoModal] = useState(false);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [poForm, setPoForm] = useState({ supplierId: '', date: today(), dueDate: '', notes: '' });
  const [poLines, setPoLines] = useState<POLine[]>([emptyPoLine()]);
  const [poSaving, setPoSaving] = useState(false);
  const [poError, setPoError] = useState('');

  // Create GRN modal
  const [grnModal, setGrnModal] = useState(false);
  const [submittedPOs, setSubmittedPOs] = useState<PO[]>([]);
  const [selectedPoId, setSelectedPoId] = useState('');
  const [poDetail, setPoDetail] = useState<PODetail | null>(null);
  const [grnQtys, setGrnQtys] = useState<Record<string, number>>({});
  const [grnDate, setGrnDate] = useState(today());
  const [grnNotes, setGrnNotes] = useState('');
  const [grnSaving, setGrnSaving] = useState(false);
  const [grnError, setGrnError] = useState('');
  const [poDetailLoading, setPoDetailLoading] = useState(false);

  const loadPOs = useCallback(() => {
    setPoLoading(true);
    api.get('/purchasing/orders', { params: { limit: 100, status: statusFilter || undefined } })
      .then((r) => setOrders(r.data.data || []))
      .catch(() => setOrders([]))
      .finally(() => setPoLoading(false));
  }, [statusFilter]);

  const loadGRNs = useCallback(() => {
    setGrnLoading(true);
    api.get('/purchasing/receipts', { params: { limit: 100 } })
      .then((r) => setReceipts(r.data.data || []))
      .catch(() => setReceipts([]))
      .finally(() => setGrnLoading(false));
  }, []);

  useEffect(() => { loadPOs(); }, [loadPOs]);
  useEffect(() => { if (tab === 'grn') loadGRNs(); }, [tab, loadGRNs]);

  // ── Create PO ──────────────────────────────────────────────────────────────
  async function openPoModal() {
    setPoError('');
    setPoForm({ supplierId: '', date: today(), dueDate: '', notes: '' });
    setPoLines([emptyPoLine()]);
    if (suppliers.length === 0) {
      const [sRes, iRes] = await Promise.all([
        api.get('/purchasing/suppliers', { params: { limit: 200 } }),
        api.get('/inventory/items', { params: { limit: 200 } }),
      ]);
      setSuppliers(sRes.data.data || []);
      setItems(iRes.data.data || []);
    }
    setPoModal(true);
  }

  function setPoLine(i: number, patch: Partial<POLine>) {
    setPoLines((prev) => prev.map((l, idx) => {
      if (idx !== i) return l;
      const updated = { ...l, ...patch };
      if (patch.itemId) {
        const item = items.find((it) => it.id === patch.itemId);
        if (item) updated.unitPrice = item.purchasePrice;
      }
      return updated;
    }));
  }

  const poSubtotal = poLines.reduce((s, l) => s + l.quantity * l.unitPrice, 0);

  async function savePO() {
    setPoError('');
    if (!poForm.supplierId) return setPoError('Pilih supplier terlebih dahulu.');
    if (poLines.some((l) => !l.itemId)) return setPoError('Semua baris harus memiliki item.');
    setPoSaving(true);
    try {
      await api.post('/purchasing/orders', { ...poForm, lines: poLines });
      setPoModal(false);
      loadPOs();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setPoError(msg || 'Gagal membuat PO.');
    } finally { setPoSaving(false); }
  }

  // ── PO Actions (submit / cancel) ───────────────────────────────────────────
  async function submitPO(id: string) {
    if (!confirm('Submit PO ini ke supplier?')) return;
    setActioning(id);
    try {
      await api.put(`/purchasing/orders/${id}/submit`);
      loadPOs();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      alert('Gagal: ' + (msg || 'Error'));
    } finally { setActioning(null); }
  }

  async function cancelPO(id: string) {
    if (!confirm('Batalkan PO ini?')) return;
    setActioning(id);
    try {
      await api.put(`/purchasing/orders/${id}/cancel`);
      loadPOs();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      alert('Gagal: ' + (msg || 'Error'));
    } finally { setActioning(null); }
  }

  // ── Create GRN ─────────────────────────────────────────────────────────────
  async function openGrnModal() {
    setGrnError('');
    setSelectedPoId('');
    setPoDetail(null);
    setGrnQtys({});
    setGrnDate(today());
    setGrnNotes('');
    const res = await api.get('/purchasing/orders', { params: { status: 'submitted', limit: 200 } });
    setSubmittedPOs(res.data.data || []);
    setGrnModal(true);
  }

  async function selectPO(poId: string) {
    setSelectedPoId(poId);
    setPoDetail(null);
    setGrnQtys({});
    if (!poId) return;
    setPoDetailLoading(true);
    try {
      const res = await api.get(`/purchasing/orders/${poId}`);
      const detail: PODetail = res.data.data;
      setPoDetail(detail);
      const qtys: Record<string, number> = {};
      detail.lines.forEach((l) => { qtys[l.id] = Math.max(0, l.quantity - l.receivedQty); });
      setGrnQtys(qtys);
    } finally { setPoDetailLoading(false); }
  }

  async function saveGRN() {
    setGrnError('');
    if (!selectedPoId) return setGrnError('Pilih Purchase Order terlebih dahulu.');
    if (!poDetail) return;
    const lines = poDetail.lines
      .filter((l) => (grnQtys[l.id] ?? 0) > 0)
      .map((l) => ({ itemId: l.itemId, quantity: grnQtys[l.id] }));
    if (lines.length === 0) return setGrnError('Minimal satu item harus diterima.');
    setGrnSaving(true);
    try {
      await api.post('/purchasing/receipts', { poId: selectedPoId, date: grnDate, notes: grnNotes, lines });
      setGrnModal(false);
      loadGRNs();
      loadPOs();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setGrnError(msg || 'Gagal membuat GRN.');
    } finally { setGrnSaving(false); }
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  const filterBtns = ['', 'draft', 'submitted', 'received', 'cancelled'];

  return (
    <div className="p-6 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Purchasing</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Purchase Order & Penerimaan Barang</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => router.push('/purchasing/create-po')}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium transition-colors shadow-sm"
          >
            <Plus size={16} />Buat PO
          </button>
          {tab === 'grn' && (
            <button
              onClick={openGrnModal}
              className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-medium transition-colors shadow-sm"
            >
              <PackageCheck size={16} />Buat GRN
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl w-fit">
        {(['po', 'grn'] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === t ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            }`}>
            {t === 'po' ? <><ShoppingCart size={14} />Purchase Order</> : <><PackageCheck size={14} />Penerimaan Barang</>}
          </button>
        ))}
      </div>

      {/* PO Tab */}
      {tab === 'po' && (
        <>
          <div className="flex gap-2 flex-wrap">
            {filterBtns.map((s) => (
              <button key={s} onClick={() => setStatusFilter(s)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-all ${
                  statusFilter === s
                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                    : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}>
                {s === '' ? 'Semua' : s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-gray-800">
                    {['No. PO', 'Supplier', 'Tanggal', 'Total', 'Status', ''].map((h) => (
                      <th key={h} className="text-left px-5 py-3.5 text-xs font-semibold text-gray-400 dark:text-gray-600 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {poLoading && <tr><td colSpan={6} className="px-5 py-10 text-center text-gray-300 dark:text-gray-700 text-sm">Memuat...</td></tr>}
                  {!poLoading && orders.length === 0 && <tr><td colSpan={6} className="px-5 py-10 text-center text-gray-400 dark:text-gray-600 text-sm">Belum ada Purchase Order</td></tr>}
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
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1.5">
                          {po.status === 'draft' && (
                            <button
                              onClick={() => submitPO(po.id)}
                              disabled={actioning === po.id}
                              title="Submit ke supplier"
                              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/40 disabled:opacity-50 transition-colors"
                            >
                              <Send size={12} />Submit
                            </button>
                          )}
                          {['draft', 'submitted'].includes(po.status) && (
                            <button
                              onClick={() => cancelPO(po.id)}
                              disabled={actioning === po.id}
                              title="Batalkan PO"
                              className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50 transition-colors"
                            >
                              <Ban size={13} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* GRN Tab */}
      {tab === 'grn' && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-800">
                  {['No. GRN', 'No. PO', 'Tanggal', 'Status'].map((h) => (
                    <th key={h} className="text-left px-5 py-3.5 text-xs font-semibold text-gray-400 dark:text-gray-600 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {grnLoading && <tr><td colSpan={4} className="px-5 py-10 text-center text-gray-300 dark:text-gray-700 text-sm">Memuat...</td></tr>}
                {!grnLoading && receipts.length === 0 && <tr><td colSpan={4} className="px-5 py-10 text-center text-gray-400 dark:text-gray-600 text-sm">Belum ada penerimaan barang</td></tr>}
                {receipts.map((grn) => (
                  <tr key={grn.id} className="border-b border-gray-50 dark:border-gray-800/60 hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
                    <td className="px-5 py-3.5 font-mono text-xs text-gray-500 dark:text-gray-400">{grn.receiptNumber}</td>
                    <td className="px-5 py-3.5 font-mono text-xs text-gray-500 dark:text-gray-400">{grn.poNumber}</td>
                    <td className="px-5 py-3.5 text-gray-500 dark:text-gray-400 text-xs">{new Date(grn.date).toLocaleDateString('id-ID')}</td>
                    <td className="px-5 py-3.5">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusColors[grn.status] || 'bg-gray-100 text-gray-500'}`}>
                        {grn.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Create PO Modal ────────────────────────────────────────────────── */}
      {poModal && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 z-50 flex items-start justify-center p-4 pt-8 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-2xl border border-gray-100 dark:border-gray-800 mb-8">
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 bg-blue-50 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                  <ShoppingCart size={16} className="text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white">Buat Purchase Order</h3>
              </div>
              <button onClick={() => setPoModal(false)} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"><X size={16} /></button>
            </div>

            <div className="px-6 py-5 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Supplier *</label>
                  <select value={poForm.supplierId} onChange={(e) => setPoForm({ ...poForm, supplierId: e.target.value })}
                    className="w-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">Pilih supplier...</option>
                    {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Tanggal *</label>
                  <input type="date" value={poForm.date} onChange={(e) => setPoForm({ ...poForm, date: e.target.value })}
                    className="w-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Jatuh Tempo</label>
                  <input type="date" value={poForm.dueDate} onChange={(e) => setPoForm({ ...poForm, dueDate: e.target.value })}
                    className="w-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>

              {/* Lines */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-medium text-gray-600 dark:text-gray-400">Item *</label>
                  <button onClick={() => setPoLines((p) => [...p, emptyPoLine()])}
                    className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium">
                    <Plus size={12} />Tambah Baris
                  </button>
                </div>
                <div className="space-y-2">
                  {poLines.map((line, i) => (
                    <div key={i} className="grid grid-cols-12 gap-2 items-center">
                      <div className="col-span-5">
                        <select value={line.itemId} onChange={(e) => setPoLine(i, { itemId: e.target.value })}
                          className="w-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-xl px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                          <option value="">Pilih item...</option>
                          {items.map((it) => <option key={it.id} value={it.id}>{it.name} ({it.sku})</option>)}
                        </select>
                      </div>
                      <div className="col-span-2">
                        <input type="number" min={1} value={line.quantity} onChange={(e) => setPoLine(i, { quantity: Number(e.target.value) })}
                          placeholder="Qty"
                          className="w-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-xl px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
                      </div>
                      <div className="col-span-4">
                        <input type="number" min={0} value={line.unitPrice} onChange={(e) => setPoLine(i, { unitPrice: Number(e.target.value) })}
                          placeholder="Harga beli"
                          className="w-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-xl px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
                      </div>
                      <div className="col-span-1 flex justify-center">
                        <button onClick={() => setPoLines((p) => p.filter((_, idx) => idx !== i))} disabled={poLines.length === 1}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-30 transition-colors">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl px-4 py-3 flex justify-between text-sm font-semibold text-gray-900 dark:text-white">
                <span>Total</span><span>{formatRp(poSubtotal)}</span>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Catatan</label>
                <textarea value={poForm.notes} onChange={(e) => setPoForm({ ...poForm, notes: e.target.value })} rows={2}
                  className="w-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
              </div>

              {poError && <div className="px-4 py-3 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-xl text-xs text-red-600 dark:text-red-400">{poError}</div>}
            </div>

            <div className="flex gap-3 px-6 py-4 border-t border-gray-100 dark:border-gray-800">
              <button onClick={() => setPoModal(false)} className="flex-1 border border-gray-200 dark:border-gray-700 rounded-xl py-2.5 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">Batal</button>
              <button onClick={savePO} disabled={poSaving} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-2.5 text-sm font-medium transition-colors disabled:opacity-60">
                {poSaving ? 'Menyimpan...' : 'Buat PO'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Create GRN Modal ───────────────────────────────────────────────── */}
      {grnModal && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 z-50 flex items-start justify-center p-4 pt-8 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-2xl border border-gray-100 dark:border-gray-800 mb-8">
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 bg-emerald-50 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center">
                  <PackageCheck size={16} className="text-emerald-600 dark:text-emerald-400" />
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white">Buat Penerimaan Barang (GRN)</h3>
              </div>
              <button onClick={() => setGrnModal(false)} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"><X size={16} /></button>
            </div>

            <div className="px-6 py-5 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Purchase Order *</label>
                  <select value={selectedPoId} onChange={(e) => selectPO(e.target.value)}
                    className="w-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">Pilih PO (status: submitted)...</option>
                    {submittedPOs.map((po) => <option key={po.id} value={po.id}>{po.poNumber} — {po.supplier.name}</option>)}
                  </select>
                  {submittedPOs.length === 0 && (
                    <p className="mt-1.5 text-xs text-amber-600 dark:text-amber-400">Tidak ada PO dengan status "submitted". Submit PO terlebih dahulu.</p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Tanggal Terima *</label>
                  <input type="date" value={grnDate} onChange={(e) => setGrnDate(e.target.value)}
                    className="w-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Catatan</label>
                  <input value={grnNotes} onChange={(e) => setGrnNotes(e.target.value)} placeholder="Opsional"
                    className="w-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>

              {poDetailLoading && <p className="text-sm text-gray-400 text-center py-4">Memuat detail PO...</p>}

              {poDetail && (
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">Item yang Diterima</label>
                  <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                          <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400">Item</th>
                          <th className="text-center px-4 py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400">Dipesan</th>
                          <th className="text-center px-4 py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400">Sudah Terima</th>
                          <th className="text-center px-4 py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400">Terima Skrg</th>
                        </tr>
                      </thead>
                      <tbody>
                        {poDetail.lines.map((l) => (
                          <tr key={l.id} className="border-b border-gray-100 dark:border-gray-800 last:border-0">
                            <td className="px-4 py-3">
                              <p className="font-medium text-gray-900 dark:text-white text-xs">{l.item.name}</p>
                              <p className="text-gray-400 text-xs">{l.item.sku} · {l.item.uom}</p>
                            </td>
                            <td className="px-4 py-3 text-center text-xs text-gray-500 dark:text-gray-400">{l.quantity}</td>
                            <td className="px-4 py-3 text-center text-xs text-gray-500 dark:text-gray-400">{l.receivedQty}</td>
                            <td className="px-4 py-3 text-center">
                              <input
                                type="number" min={0} max={l.quantity - l.receivedQty}
                                value={grnQtys[l.id] ?? 0}
                                onChange={(e) => setGrnQtys((prev) => ({ ...prev, [l.id]: Number(e.target.value) }))}
                                className="w-20 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-lg px-2 py-1.5 text-xs text-center text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {grnError && <div className="px-4 py-3 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-xl text-xs text-red-600 dark:text-red-400">{grnError}</div>}
            </div>

            <div className="flex gap-3 px-6 py-4 border-t border-gray-100 dark:border-gray-800">
              <button onClick={() => setGrnModal(false)} className="flex-1 border border-gray-200 dark:border-gray-700 rounded-xl py-2.5 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">Batal</button>
              <button onClick={saveGRN} disabled={grnSaving || !poDetail}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl py-2.5 text-sm font-medium transition-colors disabled:opacity-60">
                {grnSaving ? 'Menyimpan...' : 'Konfirmasi Penerimaan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
