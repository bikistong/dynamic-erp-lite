'use client';
import { useEffect, useState, useCallback } from 'react';
import api from '@/lib/api';
import { ArrowDownLeft, ArrowUpRight, Plus, X, Wallet } from 'lucide-react';

interface BankAccount { id: string; code: string; name: string; balance: number; }
interface LedgerEntry {
  id: string; date: string; debit: number; credit: number; runningBalance: number;
  journal: { journalNo: string; description: string; reference?: string; };
}
interface COAAccount { id: string; code: string; name: string; type: string; }

function formatRp(n: number) {
  const abs = Math.abs(Math.round(n));
  const str = 'Rp ' + new Intl.NumberFormat('id-ID').format(abs);
  return n < 0 ? `(${str})` : str;
}
const today = () => new Date().toISOString().slice(0, 10);

export default function BankPage() {
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [openingBalance, setOpeningBalance] = useState(0);
  const [loadingAccounts, setLoadingAccounts] = useState(true);
  const [loadingLedger, setLoadingLedger] = useState(false);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Modal
  const [modal, setModal] = useState<'masuk' | 'keluar' | null>(null);
  const [allAccounts, setAllAccounts] = useState<COAAccount[]>([]);
  const [form, setForm] = useState({ counterAccountCode: '', amount: '', date: today(), description: '', reference: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const loadAccounts = useCallback(async () => {
    setLoadingAccounts(true);
    try {
      const res = await api.get('/bank/accounts');
      setAccounts(res.data.data || []);
    } catch { setAccounts([]); }
    finally { setLoadingAccounts(false); }
  }, []);

  const loadLedger = useCallback(async () => {
    if (!selectedId) return;
    setLoadingLedger(true);
    try {
      const res = await api.get(`/bank/ledger/${selectedId}`, {
        params: { dateFrom: dateFrom || undefined, dateTo: dateTo || undefined },
      });
      setEntries(res.data.data.entries || []);
      setOpeningBalance(res.data.data.openingBalance || 0);
    } catch { setEntries([]); }
    finally { setLoadingLedger(false); }
  }, [selectedId, dateFrom, dateTo]);

  useEffect(() => { loadAccounts(); }, [loadAccounts]);
  useEffect(() => { loadLedger(); }, [loadLedger]);

  const selectedAccount = accounts.find((a) => a.id === selectedId);

  async function openModal(type: 'masuk' | 'keluar') {
    setError('');
    setForm({ counterAccountCode: '', amount: '', date: today(), description: '', reference: '' });
    if (allAccounts.length === 0) {
      const res = await api.get('/accounting/accounts', { params: { limit: 200, active: true } });
      setAllAccounts(res.data.data || []);
    }
    setModal(type);
  }

  async function save() {
    setError('');
    if (!selectedAccount) return setError('Pilih rekening bank terlebih dahulu.');
    if (!form.counterAccountCode) return setError('Pilih akun lawan.');
    if (!form.amount || Number(form.amount) <= 0) return setError('Nominal harus lebih dari 0.');
    if (!form.description) return setError('Keterangan wajib diisi.');
    setSaving(true);
    try {
      await api.post('/bank/transactions', {
        type: modal,
        bankAccountCode: selectedAccount.code,
        counterAccountCode: form.counterAccountCode,
        amount: Number(form.amount),
        date: form.date,
        description: form.description,
        reference: form.reference || undefined,
      });
      setModal(null);
      loadAccounts();
      loadLedger();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg || 'Gagal menyimpan transaksi.');
    } finally { setSaving(false); }
  }

  const counterAccounts = allAccounts.filter((a) => a.code !== selectedAccount?.code);

  return (
    <div className="p-6 md:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Kas & Bank</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Transaksi kas masuk dan keluar per rekening</p>
      </div>

      {/* Rekening cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {loadingAccounts && <div className="col-span-4 text-sm text-gray-400 py-4 text-center">Memuat rekening...</div>}
        {accounts.map((acc) => (
          <button key={acc.id} onClick={() => setSelectedId(acc.id)}
            className={`text-left p-4 rounded-2xl border transition-all ${
              selectedId === acc.id
                ? 'bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-200 dark:shadow-none'
                : 'bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800 hover:border-blue-300 dark:hover:border-blue-700'
            }`}>
            <div className="flex items-start justify-between mb-2">
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${selectedId === acc.id ? 'bg-white/20' : 'bg-blue-50 dark:bg-blue-900/30'}`}>
                <Wallet size={14} className={selectedId === acc.id ? 'text-white' : 'text-blue-600 dark:text-blue-400'} />
              </div>
              <span className={`text-xs font-mono ${selectedId === acc.id ? 'text-blue-100' : 'text-gray-400 dark:text-gray-600'}`}>{acc.code}</span>
            </div>
            <p className={`text-xs font-medium truncate mb-1 ${selectedId === acc.id ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'}`}>{acc.name}</p>
            <p className={`text-sm font-bold ${selectedId === acc.id ? 'text-white' : acc.balance < 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-white'}`}>
              {formatRp(acc.balance)}
            </p>
          </button>
        ))}
        {!loadingAccounts && accounts.length === 0 && (
          <div className="col-span-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800 rounded-2xl px-5 py-4 text-sm text-amber-700 dark:text-amber-400">
            Belum ada akun tipe Asset di COA. Tambahkan terlebih dahulu di <strong>Pengaturan → Chart of Accounts</strong>.
          </div>
        )}
      </div>

      {/* Selected account detail */}
      {selectedAccount && (
        <>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-gray-900 dark:text-white">{selectedAccount.name}</h2>
              <p className="text-xs text-gray-400 mt-0.5">Riwayat transaksi</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => openModal('masuk')}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-medium transition-colors">
                <ArrowDownLeft size={15} />Kas Masuk
              </button>
              <button onClick={() => openModal('keluar')}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-medium transition-colors">
                <ArrowUpRight size={15} />Kas Keluar
              </button>
            </div>
          </div>

          {/* Date filter */}
          <div className="flex items-center gap-3 bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 px-4 py-3">
            <span className="text-xs text-gray-400">Filter:</span>
            <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)}
              className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-lg px-2.5 py-1.5 text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <span className="text-xs text-gray-400">s/d</span>
            <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)}
              className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-lg px-2.5 py-1.5 text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
            {(dateFrom || dateTo) && (
              <button onClick={() => { setDateFrom(''); setDateTo(''); }} className="text-xs text-gray-400 hover:text-red-500 transition-colors">Reset</button>
            )}
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
            {dateFrom && (
              <div className="px-5 py-3 border-b border-gray-100 dark:border-gray-800 flex justify-between text-xs text-gray-500 dark:text-gray-400">
                <span>Saldo awal periode</span>
                <span className="font-medium">{formatRp(openingBalance)}</span>
              </div>
            )}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-gray-800">
                    {['Tanggal', 'Keterangan', 'Referensi', 'Masuk', 'Keluar', 'Saldo'].map((h) => (
                      <th key={h} className={`px-5 py-3.5 text-xs font-semibold text-gray-400 dark:text-gray-600 uppercase tracking-wide ${['Masuk','Keluar','Saldo'].includes(h) ? 'text-right' : 'text-left'}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loadingLedger && <tr><td colSpan={6} className="px-5 py-10 text-center text-gray-300 dark:text-gray-700 text-sm">Memuat...</td></tr>}
                  {!loadingLedger && entries.length === 0 && (
                    <tr><td colSpan={6} className="px-5 py-10 text-center text-gray-400 dark:text-gray-600 text-sm">Belum ada transaksi</td></tr>
                  )}
                  {entries.map((e) => (
                    <tr key={e.id} className="border-b border-gray-50 dark:border-gray-800/60 hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
                      <td className="px-5 py-3 text-xs text-gray-500 dark:text-gray-400">{new Date(e.date).toLocaleDateString('id-ID')}</td>
                      <td className="px-5 py-3 text-gray-800 dark:text-gray-200 text-xs max-w-xs truncate">{e.journal.description}</td>
                      <td className="px-5 py-3 font-mono text-xs text-gray-400 dark:text-gray-600">{e.journal.reference || '—'}</td>
                      <td className="px-5 py-3 text-right text-xs text-emerald-600 dark:text-emerald-400 font-medium">{e.debit > 0 ? formatRp(e.debit) : '—'}</td>
                      <td className="px-5 py-3 text-right text-xs text-red-500 dark:text-red-400 font-medium">{e.credit > 0 ? formatRp(e.credit) : '—'}</td>
                      <td className={`px-5 py-3 text-right text-xs font-semibold ${e.runningBalance < 0 ? 'text-red-500' : 'text-gray-900 dark:text-white'}`}>{formatRp(e.runningBalance)}</td>
                    </tr>
                  ))}
                </tbody>
                {entries.length > 0 && (
                  <tfoot>
                    <tr className="border-t-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                      <td colSpan={3} className="px-5 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400">Saldo Akhir</td>
                      <td className="px-5 py-3 text-right text-xs font-bold text-emerald-600 dark:text-emerald-400">{formatRp(entries.reduce((s, e) => s + e.debit, 0))}</td>
                      <td className="px-5 py-3 text-right text-xs font-bold text-red-500 dark:text-red-400">{formatRp(entries.reduce((s, e) => s + e.credit, 0))}</td>
                      <td className={`px-5 py-3 text-right text-sm font-bold ${selectedAccount.balance < 0 ? 'text-red-500' : 'text-gray-900 dark:text-white'}`}>{formatRp(selectedAccount.balance)}</td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        </>
      )}

      {!selectedId && !loadingAccounts && accounts.length > 0 && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 px-5 py-16 text-center">
          <Wallet size={32} className="text-gray-200 dark:text-gray-700 mx-auto mb-3" />
          <p className="text-sm text-gray-400 dark:text-gray-600">Pilih rekening di atas untuk melihat transaksi</p>
        </div>
      )}

      {/* Modal Kas Masuk / Keluar */}
      {modal && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md border border-gray-100 dark:border-gray-800">
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-2.5">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${modal === 'masuk' ? 'bg-emerald-50 dark:bg-emerald-900/30' : 'bg-red-50 dark:bg-red-900/30'}`}>
                  {modal === 'masuk' ? <ArrowDownLeft size={16} className="text-emerald-600 dark:text-emerald-400" /> : <ArrowUpRight size={16} className="text-red-500 dark:text-red-400" />}
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white">{modal === 'masuk' ? 'Kas Masuk' : 'Kas Keluar'} — {selectedAccount?.name}</h3>
              </div>
              <button onClick={() => setModal(null)} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"><X size={16} /></button>
            </div>

            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                  {modal === 'masuk' ? 'Akun Asal (Kredit)' : 'Akun Tujuan (Debit)'} *
                </label>
                <select value={form.counterAccountCode} onChange={(e) => setForm({ ...form, counterAccountCode: e.target.value })}
                  className="w-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Pilih akun...</option>
                  {counterAccounts.map((a) => <option key={a.id} value={a.code}>{a.code} — {a.name}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Tanggal *</label>
                  <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })}
                    className="w-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Nominal *</label>
                  <input type="number" min={0} value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })}
                    placeholder="0"
                    className="w-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Keterangan *</label>
                <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Penerimaan dari customer / Pembayaran listrik..."
                  className="w-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Referensi</label>
                <input value={form.reference} onChange={(e) => setForm({ ...form, reference: e.target.value })}
                  placeholder="No. bukti / invoice (opsional)"
                  className="w-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>

              {error && <div className="px-4 py-3 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-xl text-xs text-red-600 dark:text-red-400">{error}</div>}
            </div>

            <div className="flex gap-3 px-6 py-4 border-t border-gray-100 dark:border-gray-800">
              <button onClick={() => setModal(null)} className="flex-1 border border-gray-200 dark:border-gray-700 rounded-xl py-2.5 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">Batal</button>
              <button onClick={save} disabled={saving}
                className={`flex-1 text-white rounded-xl py-2.5 text-sm font-medium transition-colors disabled:opacity-60 ${modal === 'masuk' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-500 hover:bg-red-600'}`}>
                {saving ? 'Menyimpan...' : 'Simpan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
