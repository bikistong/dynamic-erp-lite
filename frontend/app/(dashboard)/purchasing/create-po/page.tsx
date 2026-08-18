'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { ArrowLeft, Save, Send } from 'lucide-react';

interface Supplier { id: string; name: string; email?: string; phone?: string; }
interface Item { id: string; sku: string; name: string; uom: string; purchasePrice: number; }
interface POLine { itemId: string; quantity: number; unitPrice: number; }

function formatRp(n: number) { return 'Rp ' + new Intl.NumberFormat('id-ID').format(n); }
const today = () => new Date().toISOString().slice(0, 10);
const emptyPoLine = (): POLine => ({ itemId: '', quantity: 1, unitPrice: 0 });

export default function CreatePOPage() {
  const router = useRouter();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [poForm, setPoForm] = useState({ supplierId: '', date: today(), dueDate: '', notes: '' });
  const [poLines, setPoLines] = useState<POLine[]>([emptyPoLine()]);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [sRes, iRes] = await Promise.all([
          api.get('/purchasing/suppliers', { params: { limit: 200 } }),
          api.get('/inventory/items', { params: { limit: 200 } }),
        ]);
        setSuppliers(sRes.data.data || []);
        setItems(iRes.data.data || []);
      } catch (err) {
        setError('Gagal memuat data supplier/item.');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

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

  function addLine() { setPoLines([...poLines, emptyPoLine()]); }
  function removeLine(i: number) {
    if (poLines.length === 1) return;
    setPoLines(poLines.filter((_, idx) => idx !== i));
  }

  const subtotal = poLines.reduce((s, l) => s + l.quantity * l.unitPrice, 0);

  async function savePO(asSubmitted: boolean) {
    setError('');
    if (!poForm.supplierId) return setError('Pilih supplier terlebih dahulu.');
    if (poLines.some((l) => !l.itemId)) return setError('Semua baris harus memiliki item.');
    
    setSaving(true);
    try {
      const payload = { ...poForm, lines: poLines };
      const res = await api.post('/purchasing/orders', payload);
      const poId = res.data.data?.id;
      
      if (asSubmitted && poId) {
        await api.put(`/purchasing/orders/${poId}/submit`);
      }
      
      router.push('/purchasing');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg || 'Gagal membuat PO.');
    } finally {
      setSaving(false);
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="p-6 md:p-8 flex items-center justify-center min-h-[400px]">
        <div className="text-gray-500 dark:text-gray-400">Memuat data...</div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
          <ArrowLeft size={20} className="text-gray-600 dark:text-gray-400" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Buat Purchase Order</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Form pembuatan PO baru</p>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-xl text-sm">
          {error}
        </div>
      )}

      {/* Form Card */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 p-6 space-y-6">
        
        {/* PO Info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Tanggal PO <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={poForm.date}
              onChange={(e) => setPoForm({ ...poForm, date: e.target.value })}
              className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Jatuh Tempo
            </label>
            <input
              type="date"
              value={poForm.dueDate}
              onChange={(e) => setPoForm({ ...poForm, dueDate: e.target.value })}
              className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Supplier <span className="text-red-500">*</span>
            </label>
            <select
              value={poForm.supplierId}
              onChange={(e) => setPoForm({ ...poForm, supplierId: e.target.value })}
              className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
            >
              <option value="">-- Pilih Supplier --</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            Catatan
          </label>
          <textarea
            value={poForm.notes}
            onChange={(e) => setPoForm({ ...poForm, notes: e.target.value })}
            rows={2}
            className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white resize-none"
            placeholder="Catatan tambahan untuk PO ini..."
          />
        </div>

        {/* Line Items */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Item PO</h3>
            <button onClick={addLine} className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 font-medium">
              + Tambah Baris
            </button>
          </div>
          
          <div className="bg-gray-50 dark:bg-gray-800 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-100 dark:bg-gray-900 text-gray-600 dark:text-gray-400">
                <tr>
                  <th className="text-left px-4 py-3 font-medium">Item</th>
                  <th className="text-right px-4 py-3 font-medium w-32">Qty</th>
                  <th className="text-right px-4 py-3 font-medium w-40">Harga Satuan</th>
                  <th className="text-right px-4 py-3 font-medium w-40">Total</th>
                  <th className="text-center px-4 py-3 font-medium w-16"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {poLines.map((line, i) => {
                  const item = items.find((it) => it.id === line.itemId);
                  const total = line.quantity * line.unitPrice;
                  return (
                    <tr key={i} className="bg-white dark:bg-gray-800">
                      <td className="px-4 py-3">
                        <select
                          value={line.itemId}
                          onChange={(e) => setPoLine(i, { itemId: e.target.value })}
                          className="w-full px-2 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                        >
                          <option value="">-- Pilih Item --</option>
                          {items.map((it) => (
                            <option key={it.id} value={it.id}>
                              {it.sku} - {it.name} ({it.uom})
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          min="1"
                          value={line.quantity}
                          onChange={(e) => setPoLine(i, { quantity: parseInt(e.target.value) || 0 })}
                          className="w-full px-2 py-2 text-right bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={line.unitPrice}
                          onChange={(e) => setPoLine(i, { unitPrice: parseFloat(e.target.value) || 0 })}
                          className="w-full px-2 py-2 text-right bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                        />
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-gray-900 dark:text-white">
                        {formatRp(total)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => removeLine(i)}
                          disabled={poLines.length === 1}
                          className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="bg-gray-100 dark:bg-gray-900">
                <tr>
                  <td colSpan={3} className="px-4 py-3 text-right font-medium text-gray-600 dark:text-gray-400">Subtotal:</td>
                  <td className="px-4 py-3 text-right font-bold text-gray-900 dark:text-white">{formatRp(subtotal)}</td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={() => router.back()}
            disabled={saving || submitting}
            className="px-5 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
          >
            Batal
          </button>
          <button
            onClick={() => savePO(false)}
            disabled={saving || submitting}
            className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors shadow-sm disabled:opacity-50"
          >
            <Save size={16} />
            {saving ? 'Menyimpan...' : 'Simpan Draft'}
          </button>
          <button
            onClick={() => savePO(true)}
            disabled={saving || submitting}
            className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors shadow-sm disabled:opacity-50"
          >
            <Send size={16} />
            {submitting ? 'Mengirim...' : 'Simpan & Submit'}
          </button>
        </div>
      </div>
    </div>
  );
}
