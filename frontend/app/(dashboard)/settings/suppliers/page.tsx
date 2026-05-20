'use client';
import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { Plus, X, ChevronLeft, Truck, Pencil, Search } from 'lucide-react';

interface Supplier { id: string; name: string; email?: string; phone?: string; address?: string; city?: string; }

const emptyForm = { name: '', email: '', phone: '', address: '', city: '' };

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<Supplier | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async (q = '') => {
    setLoading(true);
    try {
      const res = await api.get('/purchasing/suppliers', { params: { limit: 100, search: q || undefined } });
      setSuppliers(res.data.data || []);
    } catch { setSuppliers([]); } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  function openCreate() { setEditing(null); setForm(emptyForm); setError(''); setModal(true); }
  function openEdit(s: Supplier) {
    setEditing(s);
    setForm({ name: s.name, email: s.email || '', phone: s.phone || '', address: s.address || '', city: s.city || '' });
    setError(''); setModal(true);
  }

  async function save() {
    setError('');
    if (!form.name) return setError('Nama supplier wajib diisi.');
    setSaving(true);
    try {
      if (editing) await api.put(`/purchasing/suppliers/${editing.id}`, form);
      else await api.post('/purchasing/suppliers', form);
      setModal(false); load(search);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg || 'Gagal menyimpan.');
    } finally { setSaving(false); }
  }

  return (
    <div className="p-6 md:p-8 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <Link href="/settings" className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 mb-2 transition-colors">
            <ChevronLeft size={14} />Pengaturan
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Suppliers</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{suppliers.length} supplier terdaftar</p>
        </div>
        <button onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium transition-colors shadow-sm">
          <Plus size={16} />Tambah Supplier
        </button>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center gap-3">
          <Search size={15} className="text-gray-400" />
          <input className="flex-1 text-sm outline-none bg-transparent text-gray-900 dark:text-white placeholder-gray-400"
            placeholder="Cari nama atau kota..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); load(e.target.value); }} />
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 dark:border-gray-800">
              {['Nama', 'Email', 'Telepon', 'Kota', ''].map((h) => (
                <th key={h} className="text-left px-5 py-3.5 text-xs font-semibold text-gray-400 dark:text-gray-600 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={5} className="px-5 py-10 text-center text-gray-300 dark:text-gray-700 text-sm">Memuat...</td></tr>}
            {!loading && suppliers.length === 0 && (
              <tr><td colSpan={5} className="px-5 py-10 text-center">
                <Truck size={28} className="text-gray-200 dark:text-gray-700 mx-auto mb-2" />
                <p className="text-sm text-gray-400 dark:text-gray-600">Belum ada supplier</p>
              </td></tr>
            )}
            {suppliers.map((s) => (
              <tr key={s.id} className="border-b border-gray-50 dark:border-gray-800/60 hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
                <td className="px-5 py-3.5 font-medium text-gray-900 dark:text-white">{s.name}</td>
                <td className="px-5 py-3.5 text-gray-500 dark:text-gray-400 text-xs">{s.email || '—'}</td>
                <td className="px-5 py-3.5 text-gray-500 dark:text-gray-400 text-xs">{s.phone || '—'}</td>
                <td className="px-5 py-3.5 text-gray-500 dark:text-gray-400 text-xs">{s.city || '—'}</td>
                <td className="px-5 py-3.5">
                  <button onClick={() => openEdit(s)} className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
                    <Pencil size={13} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md border border-gray-100 dark:border-gray-800">
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 dark:border-gray-800">
              <h3 className="font-semibold text-gray-900 dark:text-white">{editing ? 'Edit Supplier' : 'Tambah Supplier'}</h3>
              <button onClick={() => setModal(false)} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"><X size={16} /></button>
            </div>
            <div className="px-6 py-5 space-y-4">
              {[
                { label: 'Nama *', key: 'name', placeholder: 'CV. Bahan Jaya' },
                { label: 'Email', key: 'email', placeholder: 'info@bahanjaya.com' },
                { label: 'Telepon', key: 'phone', placeholder: '08123456789' },
                { label: 'Alamat', key: 'address', placeholder: 'Jl. Industri No. 5' },
                { label: 'Kota', key: 'city', placeholder: 'Surabaya' },
              ].map(({ label, key, placeholder }) => (
                <div key={key}>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">{label}</label>
                  <input value={(form as any)[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                    placeholder={placeholder}
                    className="w-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              ))}
              {error && <div className="px-4 py-3 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-xl text-xs text-red-600 dark:text-red-400">{error}</div>}
            </div>
            <div className="flex gap-3 px-6 py-4 border-t border-gray-100 dark:border-gray-800">
              <button onClick={() => setModal(false)} className="flex-1 border border-gray-200 dark:border-gray-700 rounded-xl py-2.5 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">Batal</button>
              <button onClick={save} disabled={saving} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-2.5 text-sm font-medium transition-colors disabled:opacity-60">{saving ? 'Menyimpan...' : 'Simpan'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
