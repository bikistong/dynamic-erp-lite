'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Search, Plus, Pencil, X, Package } from 'lucide-react';

interface Item {
  id: string; sku: string; name: string; uom: string;
  stock: number; purchasePrice: number; sellingPrice: number;
  itemType: string; active: boolean;
}

function formatRp(n: number) {
  return 'Rp ' + new Intl.NumberFormat('id-ID').format(n);
}

const typeColors: Record<string, string> = {
  raw_material: 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
  finished_good: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400',
  general: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
};

const typeLabels: Record<string, string> = {
  raw_material: 'Bahan Baku', finished_good: 'Barang Jadi', general: 'Umum',
};

export default function InventoryPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Item | null>(null);
  const [form, setForm] = useState({ sku: '', name: '', uom: '', purchasePrice: 0, sellingPrice: 0, itemType: 'general', stock: 0 });

  async function load(q = '') {
    setLoading(true);
    const res = await api.get('/inventory/items', { params: { search: q, limit: 50 } });
    setItems(res.data.data);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  function openCreate() {
    setEditing(null);
    setForm({ sku: '', name: '', uom: '', purchasePrice: 0, sellingPrice: 0, itemType: 'general', stock: 0 });
    setShowModal(true);
  }

  function openEdit(item: Item) {
    setEditing(item);
    setForm({ sku: item.sku, name: item.name, uom: item.uom, purchasePrice: item.purchasePrice, sellingPrice: item.sellingPrice, itemType: item.itemType, stock: item.stock });
    setShowModal(true);
  }

  async function handleSave() {
    if (editing) {
      await api.put(`/inventory/items/${editing.id}`, { name: form.name, uom: form.uom, purchasePrice: form.purchasePrice, sellingPrice: form.sellingPrice, itemType: form.itemType });
    } else {
      await api.post('/inventory/items', form);
    }
    setShowModal(false);
    load(search);
  }

  return (
    <div className="p-6 md:p-8 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Inventory</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Master barang dan stok</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium transition-colors shadow-sm"
        >
          <Plus size={16} />Tambah Item
        </button>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center gap-3">
          <Search size={15} className="text-gray-400" />
          <input
            className="flex-1 text-sm outline-none bg-transparent text-gray-900 dark:text-white placeholder-gray-400"
            placeholder="Cari SKU atau nama..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); load(e.target.value); }}
          />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-50 dark:border-gray-800">
                {['SKU', 'Nama', 'Tipe', 'Stok', 'UOM', 'Harga Beli', 'Harga Jual', ''].map((h) => (
                  <th key={h} className="text-left px-5 py-3.5 text-xs font-semibold text-gray-400 dark:text-gray-600 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={8} className="px-5 py-10 text-center text-gray-300 dark:text-gray-700 text-sm">Memuat...</td></tr>}
              {!loading && items.length === 0 && <tr><td colSpan={8} className="px-5 py-10 text-center text-gray-300 dark:text-gray-700 text-sm">Belum ada data</td></tr>}
              {items.map((item) => (
                <tr key={item.id} className="border-b border-gray-50 dark:border-gray-800/60 hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
                  <td className="px-5 py-3.5 font-mono text-xs text-gray-500 dark:text-gray-400">{item.sku}</td>
                  <td className="px-5 py-3.5 font-medium text-gray-900 dark:text-white">{item.name}</td>
                  <td className="px-5 py-3.5">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${typeColors[item.itemType] || typeColors.general}`}>
                      {typeLabels[item.itemType] || item.itemType}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`font-semibold ${item.stock < 10 ? 'text-red-500' : 'text-gray-900 dark:text-white'}`}>{item.stock}</span>
                  </td>
                  <td className="px-5 py-3.5 text-gray-500 dark:text-gray-400 text-xs">{item.uom}</td>
                  <td className="px-5 py-3.5 text-gray-600 dark:text-gray-300 text-xs">{formatRp(item.purchasePrice)}</td>
                  <td className="px-5 py-3.5 text-gray-600 dark:text-gray-300 text-xs">{formatRp(item.sellingPrice)}</td>
                  <td className="px-5 py-3.5">
                    <button
                      onClick={() => openEdit(item)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                    >
                      <Pencil size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md border border-gray-100 dark:border-gray-800">
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 bg-blue-50 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                  <Package size={16} className="text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white">{editing ? 'Edit Item' : 'Tambah Item'}</h3>
              </div>
              <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                <X size={16} />
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              {!editing && (
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">SKU</label>
                  <input className="w-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} />
                </div>
              )}
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Nama</label>
                <input className="w-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">UOM</label>
                  <input className="w-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" value={form.uom} onChange={(e) => setForm({ ...form, uom: e.target.value })} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Tipe Item</label>
                  <select className="w-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" value={form.itemType} onChange={(e) => setForm({ ...form, itemType: e.target.value })}>
                    <option value="general">Umum</option>
                    <option value="raw_material">Bahan Baku</option>
                    <option value="finished_good">Barang Jadi</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Harga Beli</label>
                  <input type="number" className="w-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" value={form.purchasePrice} onChange={(e) => setForm({ ...form, purchasePrice: +e.target.value })} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Harga Jual</label>
                  <input type="number" className="w-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" value={form.sellingPrice} onChange={(e) => setForm({ ...form, sellingPrice: +e.target.value })} />
                </div>
              </div>
            </div>
            <div className="flex gap-3 px-6 py-4 border-t border-gray-100 dark:border-gray-800">
              <button onClick={() => setShowModal(false)} className="flex-1 border border-gray-200 dark:border-gray-700 rounded-xl py-2.5 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">Batal</button>
              <button onClick={handleSave} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-2.5 text-sm font-medium transition-colors">Simpan</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
