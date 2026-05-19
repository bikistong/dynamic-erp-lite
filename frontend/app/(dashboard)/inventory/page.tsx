'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Search, Plus, Pencil } from 'lucide-react';

interface Item {
  id: string; sku: string; name: string; uom: string;
  stock: number; purchasePrice: number; sellingPrice: number;
  itemType: string; active: boolean;
}

function formatRp(n: number) {
  return 'Rp ' + new Intl.NumberFormat('id-ID').format(n);
}

const typeColors: Record<string, string> = {
  raw_material: 'bg-yellow-100 text-yellow-700',
  finished_good: 'bg-green-100 text-green-700',
  general: 'bg-gray-100 text-gray-600',
};

const typeLabels: Record<string, string> = {
  raw_material: 'RM', finished_good: 'FG', general: 'Umum',
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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Inventory</h2>
          <p className="text-sm text-gray-500 mt-0.5">Master barang dan stok</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">
          <Plus size={16} /> Tambah Item
        </button>
      </div>

      <div className="bg-white rounded-xl border">
        <div className="p-4 border-b flex items-center gap-3">
          <Search size={16} className="text-gray-400" />
          <input
            className="flex-1 text-sm outline-none"
            placeholder="Cari SKU atau nama..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); load(e.target.value); }}
          />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
              <tr>
                {['SKU', 'Nama', 'Tipe', 'Stok', 'UOM', 'Harga Beli', 'Harga Jual', ''].map((h) => (
                  <th key={h} className="text-left px-4 py-3 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading && <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-400">Memuat...</td></tr>}
              {!loading && items.length === 0 && <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-400">Tidak ada data</td></tr>}
              {items.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">{item.sku}</td>
                  <td className="px-4 py-3 font-medium text-gray-900">{item.name}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${typeColors[item.itemType] || 'bg-gray-100 text-gray-600'}`}>
                      {typeLabels[item.itemType] || item.itemType}
                    </span>
                  </td>
                  <td className={`px-4 py-3 font-medium ${item.stock < 10 ? 'text-orange-600' : 'text-gray-900'}`}>{item.stock}</td>
                  <td className="px-4 py-3 text-gray-500">{item.uom}</td>
                  <td className="px-4 py-3 text-gray-700">{formatRp(item.purchasePrice)}</td>
                  <td className="px-4 py-3 text-gray-700">{formatRp(item.sellingPrice)}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => openEdit(item)} className="text-gray-400 hover:text-blue-600">
                      <Pencil size={15} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 space-y-4">
            <h3 className="font-bold text-gray-900">{editing ? 'Edit Item' : 'Tambah Item'}</h3>
            {!editing && (
              <div>
                <label className="text-xs font-medium text-gray-600">SKU</label>
                <input className="w-full border rounded-lg px-3 py-2 text-sm mt-1" value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} />
              </div>
            )}
            <div>
              <label className="text-xs font-medium text-gray-600">Nama</label>
              <input className="w-full border rounded-lg px-3 py-2 text-sm mt-1" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-gray-600">UOM</label>
                <input className="w-full border rounded-lg px-3 py-2 text-sm mt-1" value={form.uom} onChange={(e) => setForm({ ...form, uom: e.target.value })} />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600">Tipe Item</label>
                <select className="w-full border rounded-lg px-3 py-2 text-sm mt-1" value={form.itemType} onChange={(e) => setForm({ ...form, itemType: e.target.value })}>
                  <option value="general">Umum</option>
                  <option value="raw_material">Raw Material (RM)</option>
                  <option value="finished_good">Finished Good (FG)</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-gray-600">Harga Beli</label>
                <input type="number" className="w-full border rounded-lg px-3 py-2 text-sm mt-1" value={form.purchasePrice} onChange={(e) => setForm({ ...form, purchasePrice: +e.target.value })} />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600">Harga Jual</label>
                <input type="number" className="w-full border rounded-lg px-3 py-2 text-sm mt-1" value={form.sellingPrice} onChange={(e) => setForm({ ...form, sellingPrice: +e.target.value })} />
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setShowModal(false)} className="flex-1 border rounded-lg py-2 text-sm text-gray-600 hover:bg-gray-50">Batal</button>
              <button onClick={handleSave} className="flex-1 bg-blue-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-blue-700">Simpan</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
