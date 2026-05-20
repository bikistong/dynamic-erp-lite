'use client';
import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { Plus, X, ChevronLeft, BookMarked, Pencil } from 'lucide-react';

interface Account { id: string; code: string; name: string; type: string; description?: string; active: boolean; }

const typeColors: Record<string, string> = {
  Asset:     'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  Liability: 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  Equity:    'bg-violet-50 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400',
  Revenue:   'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  Expense:   'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
};

const TYPES = ['Asset', 'Liability', 'Equity', 'Revenue', 'Expense'];
const emptyForm = { code: '', name: '', type: 'Asset', description: '' };

export default function COAPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('');
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<Account | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/accounting/accounts', { params: { limit: 200, type: typeFilter || undefined } });
      setAccounts(res.data.data || []);
    } catch { setAccounts([]); } finally { setLoading(false); }
  }, [typeFilter]);

  useEffect(() => { load(); }, [load]);

  function openCreate() { setEditing(null); setForm(emptyForm); setError(''); setModal(true); }
  function openEdit(acc: Account) {
    setEditing(acc);
    setForm({ code: acc.code, name: acc.name, type: acc.type, description: acc.description || '' });
    setError(''); setModal(true);
  }

  async function save() {
    setError('');
    if (!form.code || !form.name) return setError('Kode dan nama akun wajib diisi.');
    setSaving(true);
    try {
      if (editing) await api.put(`/accounting/accounts/${editing.id}`, form);
      else await api.post('/accounting/accounts', form);
      setModal(false); load();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg || 'Gagal menyimpan.');
    } finally { setSaving(false); }
  }

  const grouped = TYPES.map((t) => ({ type: t, items: accounts.filter((a) => a.type === t) })).filter((g) => g.items.length > 0 || typeFilter === g.type);

  return (
    <div className="p-6 md:p-8 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <Link href="/settings" className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 mb-2 transition-colors">
            <ChevronLeft size={14} />Pengaturan
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Chart of Accounts</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Daftar akun keuangan</p>
        </div>
        <button onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium transition-colors shadow-sm">
          <Plus size={16} />Tambah Akun
        </button>
      </div>

      {/* Filter */}
      <div className="flex gap-2 flex-wrap">
        {['', ...TYPES].map((t) => (
          <button key={t} onClick={() => setTypeFilter(t)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-all ${typeFilter === t
              ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
              : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
            }`}>
            {t === '' ? 'Semua' : t}
          </button>
        ))}
      </div>

      {/* Accounts grouped by type */}
      <div className="space-y-4">
        {loading && <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 px-5 py-10 text-center text-gray-300 dark:text-gray-700 text-sm">Memuat...</div>}
        {!loading && accounts.length === 0 && (
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 px-5 py-10 text-center">
            <BookMarked size={32} className="text-gray-200 dark:text-gray-700 mx-auto mb-3" />
            <p className="text-sm text-gray-400 dark:text-gray-600">Belum ada akun</p>
          </div>
        )}
        {!loading && (typeFilter ? [{ type: typeFilter, items: accounts }] : grouped).map(({ type, items }) => items.length > 0 && (
          <div key={type} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-100 dark:border-gray-800 flex items-center gap-2">
              <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${typeColors[type]}`}>{type}</span>
              <span className="text-xs text-gray-400 dark:text-gray-600">{items.length} akun</span>
            </div>
            <table className="w-full text-sm">
              <tbody>
                {items.map((acc) => (
                  <tr key={acc.id} className="border-b border-gray-50 dark:border-gray-800/60 hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
                    <td className="px-5 py-3 font-mono text-xs text-gray-500 dark:text-gray-400 w-24">{acc.code}</td>
                    <td className="px-5 py-3 font-medium text-gray-900 dark:text-white">{acc.name}</td>
                    <td className="px-5 py-3 text-xs text-gray-400 dark:text-gray-600 max-w-xs truncate">{acc.description}</td>
                    <td className="px-5 py-3 w-10">
                      <button onClick={() => openEdit(acc)} className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
                        <Pencil size={13} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md border border-gray-100 dark:border-gray-800">
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 dark:border-gray-800">
              <h3 className="font-semibold text-gray-900 dark:text-white">{editing ? 'Edit Akun' : 'Tambah Akun'}</h3>
              <button onClick={() => setModal(false)} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"><X size={16} /></button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Kode Akun *</label>
                  <input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} disabled={!!editing}
                    placeholder="1100"
                    className="w-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Tipe *</label>
                  <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}
                    className="w-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                    {TYPES.map((t) => <option key={t}>{t}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Nama Akun *</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Kas & Bank"
                  className="w-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Deskripsi</label>
                <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
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
