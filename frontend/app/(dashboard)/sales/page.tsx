'use client';
import { useEffect, useState, useCallback } from 'react';
import api from '@/lib/api';
import { Plus, X, Trash2, FileText, Send, CreditCard, Ban } from 'lucide-react';

interface Invoice {
  id: string; invoiceNo: string; status: string;
  subtotal: number; taxAmount: number; totalAmount: number;
  date: string; customer: { name: string };
}
interface Customer { id: string; name: string; }
interface Item { id: string; sku: string; name: string; uom: string; sellingPrice: number; }
interface Line { itemId: string; quantity: number; unitPrice: number; }

function formatRp(n: number) { return 'Rp ' + new Intl.NumberFormat('id-ID').format(n); }

const statusColors: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  posted: 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  paid: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  cancelled: 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400',
};

const filterBtns = ['', 'draft', 'posted', 'paid', 'cancelled'];
const emptyLine = (): Line => ({ itemId: '', quantity: 1, unitPrice: 0 });
const today = () => new Date().toISOString().slice(0, 10);

export default function SalesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  // Modal state
  const [modal, setModal] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    customerId: '', date: today(), dueDate: '', taxRate: 11, notes: '',
  });
  const [lines, setLines] = useState<Line[]>([emptyLine()]);
  const [formError, setFormError] = useState('');

  const [actioning, setActioning] = useState<string | null>(null);

  const loadInvoices = useCallback(() => {
    setLoading(true);
    api.get('/sales/invoices', { params: { limit: 50, status: statusFilter || undefined } })
      .then((r) => setInvoices(r.data.data || []))
      .catch(() => setInvoices([]))
      .finally(() => setLoading(false));
  }, [statusFilter]);

  async function postInvoice(id: string) {
    if (!confirm('Post invoice ini? Stok akan dikurangi dan jurnal dibuat.')) return;
    setActioning(id);
    try {
      await api.put(`/sales/invoices/${id}/post`);
      loadInvoices();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      alert('Gagal: ' + (msg || 'Error'));
    } finally { setActioning(null); }
  }

  async function payInvoice(id: string) {
    if (!confirm('Tandai invoice ini sebagai lunas?')) return;
    setActioning(id);
    try {
      await api.put(`/sales/invoices/${id}/pay`);
      loadInvoices();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      alert('Gagal: ' + (msg || 'Error'));
    } finally { setActioning(null); }
  }

  async function cancelInvoice(id: string) {
    if (!confirm('Batalkan invoice ini?')) return;
    setActioning(id);
    try {
      await api.put(`/sales/invoices/${id}/cancel`);
      loadInvoices();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      alert('Gagal: ' + (msg || 'Error'));
    } finally { setActioning(null); }
  }

  useEffect(() => { loadInvoices(); }, [loadInvoices]);

  async function openModal() {
    setForm({ customerId: '', date: today(), dueDate: '', taxRate: 11, notes: '' });
    setLines([emptyLine()]);
    setFormError('');
    if (customers.length === 0) {
      const [cRes, iRes] = await Promise.all([
        api.get('/sales/customers', { params: { limit: 100 } }),
        api.get('/inventory/items', { params: { limit: 200 } }),
      ]);
      setCustomers(cRes.data.data);
      setItems(iRes.data.data);
    }
    setModal(true);
  }

  function setLine(i: number, patch: Partial<Line>) {
    setLines((prev) => prev.map((l, idx) => {
      if (idx !== i) return l;
      const updated = { ...l, ...patch };
      if (patch.itemId) {
        const item = items.find((it) => it.id === patch.itemId);
        if (item) updated.unitPrice = item.sellingPrice;
      }
      return updated;
    }));
  }

  function removeLine(i: number) { setLines((prev) => prev.filter((_, idx) => idx !== i)); }
  function addLine() { setLines((prev) => [...prev, emptyLine()]); }

  const subtotal = lines.reduce((s, l) => s + l.quantity * l.unitPrice, 0);
  const taxAmount = Math.round(subtotal * form.taxRate) / 100;
  const total = subtotal + taxAmount;

  async function save() {
    setFormError('');
    if (!form.customerId) return setFormError('Pilih customer terlebih dahulu.');
    if (lines.some((l) => !l.itemId)) return setFormError('Semua baris harus memiliki item.');
    setSaving(true);
    try {
      await api.post('/sales/invoices', { ...form, lines });
      setModal(false);
      loadInvoices();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setFormError(msg || 'Gagal membuat invoice.');
    } finally { setSaving(false); }
  }

  return (
    <div className="p-6 md:p-8 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Sales</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Faktur penjualan</p>
        </div>
        <button
          onClick={openModal}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium transition-colors shadow-sm"
        >
          <Plus size={16} />Tambah Invoice
        </button>
      </div>

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
                {['No. Invoice', 'Customer', 'Tanggal', 'Subtotal', 'PPN', 'Total', 'Status', ''].map((h) => (
                  <th key={h} className="text-left px-5 py-3.5 text-xs font-semibold text-gray-400 dark:text-gray-600 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={8} className="px-5 py-10 text-center text-gray-300 dark:text-gray-700 text-sm">Memuat...</td></tr>}
              {!loading && invoices.length === 0 && <tr><td colSpan={8} className="px-5 py-10 text-center text-gray-300 dark:text-gray-700 text-sm">Tidak ada data</td></tr>}
              {invoices.map((inv) => (
                <tr key={inv.id} className="border-b border-gray-50 dark:border-gray-800/60 hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
                  <td className="px-5 py-3.5 font-mono text-xs text-gray-500 dark:text-gray-400">{inv.invoiceNo}</td>
                  <td className="px-5 py-3.5 font-medium text-gray-900 dark:text-white">{inv.customer.name}</td>
                  <td className="px-5 py-3.5 text-gray-500 dark:text-gray-400 text-xs">{new Date(inv.date).toLocaleDateString('id-ID')}</td>
                  <td className="px-5 py-3.5 text-gray-600 dark:text-gray-300 text-xs">{formatRp(inv.subtotal)}</td>
                  <td className="px-5 py-3.5 text-gray-500 dark:text-gray-400 text-xs">{formatRp(inv.taxAmount)}</td>
                  <td className="px-5 py-3.5 font-semibold text-gray-900 dark:text-white text-xs">{formatRp(inv.totalAmount)}</td>
                  <td className="px-5 py-3.5">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusColors[inv.status] || 'bg-gray-100 text-gray-500'}`}>
                      {inv.status}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-1.5">
                      {inv.status === 'draft' && (
                        <button onClick={() => postInvoice(inv.id)} disabled={actioning === inv.id}
                          title="Post invoice"
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/40 disabled:opacity-50 transition-colors">
                          <Send size={12} />Post
                        </button>
                      )}
                      {inv.status === 'posted' && (
                        <button onClick={() => payInvoice(inv.id)} disabled={actioning === inv.id}
                          title="Tandai lunas"
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-emerald-50 text-emerald-600 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:hover:bg-emerald-900/40 disabled:opacity-50 transition-colors">
                          <CreditCard size={12} />Bayar
                        </button>
                      )}
                      {['draft', 'posted'].includes(inv.status) && (
                        <button onClick={() => cancelInvoice(inv.id)} disabled={actioning === inv.id}
                          title="Batalkan"
                          className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50 transition-colors">
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

      {/* Create Invoice Modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 z-50 flex items-start justify-center p-4 pt-8 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-2xl border border-gray-100 dark:border-gray-800 mb-8">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 bg-blue-50 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                  <FileText size={16} className="text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white">Buat Invoice Baru</h3>
              </div>
              <button onClick={() => setModal(false)} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                <X size={16} />
              </button>
            </div>

            <div className="px-6 py-5 space-y-5">
              {/* Customer & Date */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Customer *</label>
                  <select
                    value={form.customerId}
                    onChange={(e) => setForm({ ...form, customerId: e.target.value })}
                    className="w-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Pilih customer...</option>
                    {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Tanggal *</label>
                  <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })}
                    className="w-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Jatuh Tempo</label>
                  <input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                    className="w-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">PPN (%)</label>
                  <input type="number" value={form.taxRate} onChange={(e) => setForm({ ...form, taxRate: Number(e.target.value) })}
                    className="w-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>

              {/* Lines */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-medium text-gray-600 dark:text-gray-400">Item *</label>
                  <button onClick={addLine} className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium">
                    <Plus size={12} /> Tambah Baris
                  </button>
                </div>
                <div className="space-y-2">
                  {lines.map((line, i) => {
                    const selectedItem = items.find((it) => it.id === line.itemId);
                    return (
                      <div key={i} className="grid grid-cols-12 gap-2 items-center">
                        <div className="col-span-5">
                          <select value={line.itemId} onChange={(e) => setLine(i, { itemId: e.target.value })}
                            className="w-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-xl px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                            <option value="">Pilih item...</option>
                            {items.map((it) => <option key={it.id} value={it.id}>{it.name} ({it.sku})</option>)}
                          </select>
                        </div>
                        <div className="col-span-2">
                          <input type="number" min={1} value={line.quantity} onChange={(e) => setLine(i, { quantity: Number(e.target.value) })}
                            placeholder="Qty"
                            className="w-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-xl px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
                        </div>
                        <div className="col-span-4">
                          <input type="number" min={0} value={line.unitPrice} onChange={(e) => setLine(i, { unitPrice: Number(e.target.value) })}
                            placeholder="Harga satuan"
                            className="w-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-xl px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
                        </div>
                        <div className="col-span-1 flex justify-center">
                          <button onClick={() => removeLine(i)} disabled={lines.length === 1}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-30">
                            <Trash2 size={14} />
                          </button>
                        </div>
                        {selectedItem && (
                          <div className="col-span-11 text-xs text-gray-400 dark:text-gray-600 -mt-1 px-1">
                            {selectedItem.uom} · Subtotal: {formatRp(line.quantity * line.unitPrice)}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Totals */}
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl px-4 py-3 space-y-1.5 text-sm">
                <div className="flex justify-between text-gray-500 dark:text-gray-400">
                  <span>Subtotal</span><span>{formatRp(subtotal)}</span>
                </div>
                <div className="flex justify-between text-gray-500 dark:text-gray-400">
                  <span>PPN {form.taxRate}%</span><span>{formatRp(taxAmount)}</span>
                </div>
                <div className="flex justify-between font-bold text-gray-900 dark:text-white pt-1 border-t border-gray-200 dark:border-gray-700">
                  <span>Total</span><span>{formatRp(total)}</span>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Catatan</label>
                <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2}
                  className="w-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
              </div>

              {formError && (
                <div className="px-4 py-3 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-xl text-xs text-red-600 dark:text-red-400">
                  {formError}
                </div>
              )}
            </div>

            <div className="flex gap-3 px-6 py-4 border-t border-gray-100 dark:border-gray-800">
              <button onClick={() => setModal(false)}
                className="flex-1 border border-gray-200 dark:border-gray-700 rounded-xl py-2.5 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                Batal
              </button>
              <button onClick={save} disabled={saving}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-2.5 text-sm font-medium transition-colors disabled:opacity-60">
                {saving ? 'Menyimpan...' : 'Buat Invoice'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
