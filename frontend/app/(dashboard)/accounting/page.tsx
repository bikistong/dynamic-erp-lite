'use client';
import { useEffect, useState, useCallback } from 'react';
import api from '@/lib/api';
import { BookOpen, BarChart2, Scale, ListChecks, BookX, Database, FileText } from 'lucide-react';

// ── Types ────────────────────────────────────────────────────────────────────
interface Journal { id: string; journalNo: string; type: string; status: string; description: string; date: string; reference?: string; }

interface TBRow { code: string; name: string; type: string; totalDebit: number; totalCredit: number; balance: number; }
interface TBSummary { grandDebit: number; grandCredit: number; isBalanced: boolean; }

interface PLItem { code: string; name: string; amount: number; }
interface PLData { revenue: PLItem[]; expenses: PLItem[]; }
interface PLSummary { totalRevenue: number; totalExpenses: number; netProfit: number; }

interface BSItem { code: string; name: string; balance: number; }
interface BSData { assets: BSItem[]; liabilities: BSItem[]; equity: BSItem[]; }
interface BSSummary { totalAssets: number; totalLiabilities: number; totalEquity: number; isBalanced: boolean; }

function formatRp(n: number) { return 'Rp ' + new Intl.NumberFormat('id-ID').format(Math.round(n)); }
const today = () => new Date().toISOString().slice(0, 10);
const firstDayOfYear = () => `${new Date().getFullYear()}-01-01`;

const statusColors: Record<string, string> = {
  draft:  'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  posted: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
};

// ── Main Page ────────────────────────────────────────────────────────────────
export default function AccountingPage() {
  const router = require('next/navigation').useRouter();
  const [tab, setTab] = useState<'jurnal' | 'ledger' | 'pl' | 'neraca' | 'trial' | 'tutup' | 'saldo'>('jurnal');

  return (
    <div className="p-6 md:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Accounting</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Jurnal, laporan keuangan, tutup buku, dan saldo awal</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl w-fit flex-wrap">
        {([
          { key: 'jurnal', label: 'Jurnal',         icon: BookOpen },
          { key: 'ledger', label: 'General Ledger', icon: FileText },
          { key: 'pl',     label: 'Laba Rugi',     icon: BarChart2 },
          { key: 'neraca', label: 'Neraca',         icon: Scale },
          { key: 'trial',  label: 'Neraca Saldo',  icon: ListChecks },
          { key: 'tutup',  label: 'Tutup Buku',    icon: BookX },
          { key: 'saldo',  label: 'Saldo Awal',    icon: Database },
        ] as const).map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => setTab(key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === key ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            }`}>
            <Icon size={14} />{label}
          </button>
        ))}
      </div>

      {tab === 'jurnal' && <JurnalTab />
      {tab === 'ledger' && <LedgerTab router={router} />}
      {tab === 'pl'     && <PLTab />}
      {tab === 'neraca' && <NeracaTab />}
      {tab === 'trial'  && <TrialTab />}
      {tab === 'tutup'  && <TutupBukuTab />}
      {tab === 'saldo'  && <SaldoAwalTab />}
    </div>
  );
}

// ── Jurnal Tab ───────────────────────────────────────────────────────────────
function JurnalTab() {
  const [journals, setJournals] = useState<Journal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/accounting/journals', { params: { limit: 100 } })
      .then((r) => setJournals(r.data.data || []))
      .catch(() => setJournals([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 dark:border-gray-800">
              {['No. Jurnal', 'Tanggal', 'Keterangan', 'Referensi', 'Tipe', 'Status'].map((h) => (
                <th key={h} className="text-left px-5 py-3.5 text-xs font-semibold text-gray-400 dark:text-gray-600 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={6} className="px-5 py-10 text-center text-gray-300 dark:text-gray-700 text-sm">Memuat...</td></tr>}
            {!loading && journals.length === 0 && <tr><td colSpan={6} className="px-5 py-10 text-center text-gray-400 dark:text-gray-600 text-sm">Belum ada jurnal</td></tr>}
            {journals.map((j) => (
              <tr key={j.id} className="border-b border-gray-50 dark:border-gray-800/60 hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
                <td className="px-5 py-3.5 font-mono text-xs text-gray-500 dark:text-gray-400">{j.journalNo}</td>
                <td className="px-5 py-3.5 text-gray-500 dark:text-gray-400 text-xs">{new Date(j.date).toLocaleDateString('id-ID')}</td>
                <td className="px-5 py-3.5 text-gray-800 dark:text-gray-200 max-w-xs truncate">{j.description}</td>
                <td className="px-5 py-3.5 font-mono text-xs text-gray-400 dark:text-gray-600">{j.reference || '—'}</td>
                <td className="px-5 py-3.5">
                  <span className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 px-2.5 py-1 rounded-full font-medium">{j.type}</span>
                </td>
                <td className="px-5 py-3.5">
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusColors[j.status] || 'bg-gray-100 text-gray-500'}`}>{j.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Laba Rugi Tab ────────────────────────────────────────────────────────────
function PLTab() {
  const [dateFrom, setDateFrom] = useState(firstDayOfYear());
  const [dateTo, setDateTo] = useState(today());
  const [data, setData] = useState<PLData | null>(null);
  const [summary, setSummary] = useState<PLSummary | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/accounting/reports/profit-loss', { params: { dateFrom, dateTo } });
      setData(res.data.data);
      setSummary(res.data.summary);
    } catch { setData(null); setSummary(null); }
    finally { setLoading(false); }
  }, [dateFrom, dateTo]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-4">
      {/* Date filter */}
      <div className="flex items-center gap-3 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 px-5 py-4">
        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Periode:</span>
        <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)}
          className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-xl px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
        <span className="text-xs text-gray-400">s/d</span>
        <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)}
          className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-xl px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>

      {loading && <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 px-5 py-10 text-center text-gray-400 text-sm">Memuat...</div>}

      {!loading && data && summary && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800">
            <h2 className="font-semibold text-gray-900 dark:text-white">Laporan Laba Rugi</h2>
            <p className="text-xs text-gray-400 mt-0.5">{new Date(dateFrom).toLocaleDateString('id-ID')} — {new Date(dateTo).toLocaleDateString('id-ID')}</p>
          </div>

          {/* Revenue */}
          <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800">
            <p className="text-xs font-semibold text-gray-400 dark:text-gray-600 uppercase tracking-wide mb-3">Pendapatan</p>
            {data.revenue.length === 0 && <p className="text-sm text-gray-400">—</p>}
            {data.revenue.map((r) => (
              <div key={r.code} className="flex justify-between py-1.5">
                <span className="text-sm text-gray-700 dark:text-gray-300">{r.code} · {r.name}</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">{formatRp(r.amount)}</span>
              </div>
            ))}
            <div className="flex justify-between pt-2 mt-1 border-t border-gray-100 dark:border-gray-800">
              <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Total Pendapatan</span>
              <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{formatRp(summary.totalRevenue)}</span>
            </div>
          </div>

          {/* Expenses */}
          <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800">
            <p className="text-xs font-semibold text-gray-400 dark:text-gray-600 uppercase tracking-wide mb-3">Beban</p>
            {data.expenses.length === 0 && <p className="text-sm text-gray-400">—</p>}
            {data.expenses.map((e) => (
              <div key={e.code} className="flex justify-between py-1.5">
                <span className="text-sm text-gray-700 dark:text-gray-300">{e.code} · {e.name}</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">{formatRp(e.amount)}</span>
              </div>
            ))}
            <div className="flex justify-between pt-2 mt-1 border-t border-gray-100 dark:border-gray-800">
              <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Total Beban</span>
              <span className="text-sm font-bold text-red-600 dark:text-red-400">{formatRp(summary.totalExpenses)}</span>
            </div>
          </div>

          {/* Net */}
          <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800/50">
            <div className="flex justify-between items-center">
              <span className="font-bold text-gray-900 dark:text-white">Laba / Rugi Bersih</span>
              <span className={`text-lg font-bold ${summary.netProfit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                {summary.netProfit < 0 ? '(' : ''}{formatRp(Math.abs(summary.netProfit))}{summary.netProfit < 0 ? ')' : ''}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Neraca Tab ───────────────────────────────────────────────────────────────
function NeracaTab() {
  const [asOf, setAsOf] = useState(today());
  const [data, setData] = useState<BSData | null>(null);
  const [summary, setSummary] = useState<BSSummary | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/accounting/reports/balance-sheet', { params: { asOf } });
      setData(res.data.data);
      setSummary(res.data.summary);
    } catch { setData(null); setSummary(null); }
    finally { setLoading(false); }
  }, [asOf]);

  useEffect(() => { load(); }, [load]);

  function Section({ title, items, total, colorClass }: { title: string; items: BSItem[]; total: number; colorClass: string }) {
    return (
      <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800">
        <p className="text-xs font-semibold text-gray-400 dark:text-gray-600 uppercase tracking-wide mb-3">{title}</p>
        {items.length === 0 && <p className="text-sm text-gray-400">—</p>}
        {items.map((item) => (
          <div key={item.code} className="flex justify-between py-1.5">
            <span className="text-sm text-gray-700 dark:text-gray-300">{item.code} · {item.name}</span>
            <span className="text-sm font-medium text-gray-900 dark:text-white">{formatRp(item.balance)}</span>
          </div>
        ))}
        <div className="flex justify-between pt-2 mt-1 border-t border-gray-100 dark:border-gray-800">
          <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Total {title}</span>
          <span className={`text-sm font-bold ${colorClass}`}>{formatRp(total)}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 px-5 py-4">
        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Per tanggal:</span>
        <input type="date" value={asOf} onChange={(e) => setAsOf(e.target.value)}
          className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-xl px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>

      {loading && <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 px-5 py-10 text-center text-gray-400 text-sm">Memuat...</div>}

      {!loading && data && summary && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800">
            <h2 className="font-semibold text-gray-900 dark:text-white">Neraca (Balance Sheet)</h2>
            <p className="text-xs text-gray-400 mt-0.5">Per {new Date(asOf).toLocaleDateString('id-ID')}</p>
          </div>

          <Section title="Aset" items={data.assets} total={summary.totalAssets} colorClass="text-blue-600 dark:text-blue-400" />
          <Section title="Kewajiban" items={data.liabilities} total={summary.totalLiabilities} colorClass="text-red-600 dark:text-red-400" />
          <Section title="Ekuitas" items={data.equity} total={summary.totalEquity} colorClass="text-violet-600 dark:text-violet-400" />

          <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800/50 flex items-center justify-between">
            <span className="font-bold text-gray-900 dark:text-white">Kewajiban + Ekuitas</span>
            <div className="flex items-center gap-3">
              <span className="text-lg font-bold text-gray-900 dark:text-white">{formatRp(summary.totalLiabilities + summary.totalEquity)}</span>
              <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${summary.isBalanced ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400'}`}>
                {summary.isBalanced ? 'Seimbang ✓' : 'Tidak Seimbang ✗'}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Neraca Saldo Tab ─────────────────────────────────────────────────────────
function TrialTab() {
  const [asOf, setAsOf] = useState(today());
  const [rows, setRows] = useState<TBRow[]>([]);
  const [summary, setSummary] = useState<TBSummary | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/accounting/reports/trial-balance', { params: { asOf } });
      setRows(res.data.data || []);
      setSummary(res.data.summary);
    } catch { setRows([]); setSummary(null); }
    finally { setLoading(false); }
  }, [asOf]);

  useEffect(() => { load(); }, [load]);

  const typeLabels: Record<string, string> = { Asset: 'Aset', Liability: 'Kewajiban', Equity: 'Ekuitas', Revenue: 'Pendapatan', Expense: 'Beban' };
  const typeColors: Record<string, string> = {
    Asset:     'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    Liability: 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    Equity:    'bg-violet-50 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400',
    Revenue:   'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    Expense:   'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 px-5 py-4">
        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Per tanggal:</span>
        <input type="date" value={asOf} onChange={(e) => setAsOf(e.target.value)}
          className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-xl px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800">
          <h2 className="font-semibold text-gray-900 dark:text-white">Neraca Saldo (Trial Balance)</h2>
          <p className="text-xs text-gray-400 mt-0.5">Per {new Date(asOf).toLocaleDateString('id-ID')}</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-800">
                {['Kode', 'Nama Akun', 'Tipe', 'Debit', 'Kredit', 'Saldo'].map((h) => (
                  <th key={h} className={`px-5 py-3.5 text-xs font-semibold text-gray-400 dark:text-gray-600 uppercase tracking-wide ${h === 'Kode' || h === 'Nama Akun' || h === 'Tipe' ? 'text-left' : 'text-right'}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={6} className="px-5 py-10 text-center text-gray-300 dark:text-gray-700 text-sm">Memuat...</td></tr>}
              {!loading && rows.length === 0 && <tr><td colSpan={6} className="px-5 py-10 text-center text-gray-400 dark:text-gray-600 text-sm">Belum ada data akuntansi</td></tr>}
              {rows.map((r) => (
                <tr key={r.code} className="border-b border-gray-50 dark:border-gray-800/60 hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
                  <td className="px-5 py-3 font-mono text-xs text-gray-500 dark:text-gray-400">{r.code}</td>
                  <td className="px-5 py-3 text-gray-800 dark:text-gray-200">{r.name}</td>
                  <td className="px-5 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${typeColors[r.type] || 'bg-gray-100 text-gray-500'}`}>{typeLabels[r.type] || r.type}</span>
                  </td>
                  <td className="px-5 py-3 text-right text-xs text-gray-600 dark:text-gray-300">{r.totalDebit > 0 ? formatRp(r.totalDebit) : '—'}</td>
                  <td className="px-5 py-3 text-right text-xs text-gray-600 dark:text-gray-300">{r.totalCredit > 0 ? formatRp(r.totalCredit) : '—'}</td>
                  <td className={`px-5 py-3 text-right text-xs font-semibold ${r.balance >= 0 ? 'text-gray-900 dark:text-white' : 'text-red-600 dark:text-red-400'}`}>
                    {r.balance < 0 ? '(' : ''}{formatRp(Math.abs(r.balance))}{r.balance < 0 ? ')' : ''}
                  </td>
                </tr>
              ))}
            </tbody>
            {summary && rows.length > 0 && (
              <tfoot>
                <tr className="bg-gray-50 dark:bg-gray-800/50 border-t-2 border-gray-200 dark:border-gray-700">
                  <td colSpan={3} className="px-5 py-3 text-xs font-bold text-gray-700 dark:text-gray-300 uppercase">Total</td>
                  <td className="px-5 py-3 text-right text-xs font-bold text-gray-900 dark:text-white">{formatRp(summary.grandDebit)}</td>
                  <td className="px-5 py-3 text-right text-xs font-bold text-gray-900 dark:text-white">{formatRp(summary.grandCredit)}</td>
                  <td className="px-5 py-3 text-right">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${summary.isBalanced ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400'}`}>
                      {summary.isBalanced ? 'Balance ✓' : 'Tidak Balance ✗'}
                    </span>
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
}

// ── Tutup Buku Tab ────────────────────────────────────────────────────────────
function TutupBukuTab() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [result, setResult] = useState<{ summary: { totalRevenue: number; totalExpenses: number; netProfit: number; period: string } } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const monthNames = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];

  async function close() {
    if (!confirm(`Tutup buku ${monthNames[month - 1]} ${year}? Jurnal penutup akan dibuat dan di-posting otomatis.`)) return;
    setError(''); setResult(null); setDone(false);
    setLoading(true);
    try {
      const res = await api.post('/accounting/close-period', { year, month });
      setResult(res.data.data);
      setDone(true);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg || 'Gagal tutup buku.');
    } finally { setLoading(false); }
  }

  return (
    <div className="space-y-4 max-w-lg">
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6 space-y-5">
        <div>
          <h2 className="font-semibold text-gray-900 dark:text-white mb-1">Tutup Buku Bulanan</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400">Membuat jurnal penutup untuk menol-kan akun revenue & expense ke akun Laba Periode Berjalan (3300).</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Bulan</label>
            <select value={month} onChange={(e) => setMonth(Number(e.target.value))}
              className="w-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
              {monthNames.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Tahun</label>
            <input type="number" value={year} onChange={(e) => setYear(Number(e.target.value))} min={2020} max={2099}
              className="w-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>

        {error && <div className="px-4 py-3 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-xl text-xs text-red-600 dark:text-red-400">{error}</div>}

        {done && result && (
          <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800 rounded-xl px-4 py-4 space-y-2">
            <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">Tutup buku berhasil — {result.summary.period}</p>
            <div className="space-y-1 text-xs text-emerald-700 dark:text-emerald-400">
              <div className="flex justify-between"><span>Total Pendapatan ditutup</span><span>{formatRp(result.summary.totalRevenue)}</span></div>
              <div className="flex justify-between"><span>Total Beban ditutup</span><span>{formatRp(result.summary.totalExpenses)}</span></div>
              <div className="flex justify-between font-bold pt-1 border-t border-emerald-200 dark:border-emerald-700">
                <span>Laba / Rugi ke akun 3300</span>
                <span className={result.summary.netProfit >= 0 ? '' : 'text-red-600 dark:text-red-400'}>
                  {result.summary.netProfit < 0 ? '(' : ''}{formatRp(Math.abs(result.summary.netProfit))}{result.summary.netProfit < 0 ? ')' : ''}
                </span>
              </div>
            </div>
          </div>
        )}

        <button onClick={close} disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-2.5 text-sm font-medium transition-colors disabled:opacity-60">
          {loading ? 'Memproses...' : `Tutup Buku ${monthNames[month - 1]} ${year}`}
        </button>
      </div>

      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800 rounded-xl px-4 py-3 text-xs text-amber-700 dark:text-amber-400">
        <strong>Catatan:</strong> Tutup buku hanya generate jurnal penutup. Periode tidak dikunci — pastikan tidak ada jurnal susulan setelah tutup buku.
      </div>
    </div>
  );
}

// ── Saldo Awal Tab ────────────────────────────────────────────────────────────
interface COAAccount { id: string; code: string; name: string; type: string; }
interface InventoryItem { id: string; sku: string; name: string; uom: string; stock: number; }
interface SaldoEntry { accountCode: string; name: string; type: string; debit: number; credit: number; }

function SaldoAwalTab() {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [accounts, setAccounts] = useState<COAAccount[]>([]);
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [entries, setEntries] = useState<SaldoEntry[]>([]);
  const [inventoryMap, setInventoryMap] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [existing, setExisting] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get('/accounting/accounts', { params: { limit: 200, active: true } }),
      api.get('/inventory/items', { params: { limit: 200 } }),
      api.get('/accounting/opening-balance'),
    ]).then(([aRes, iRes, obRes]) => {
      const accs: COAAccount[] = aRes.data.data || [];
      setAccounts(accs);
      setEntries(accs.map((a) => ({
        accountCode: a.code, name: a.name, type: a.type,
        debit: ['Asset', 'Expense'].includes(a.type) ? 0 : 0,
        credit: 0,
      })));
      const invItems: InventoryItem[] = iRes.data.data || [];
      setItems(invItems);
      const invMap: Record<string, number> = {};
      invItems.forEach((it) => { invMap[it.id] = it.stock; });
      setInventoryMap(invMap);
      setExisting(obRes.data.data?.exists || false);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  function setEntry(code: string, field: 'debit' | 'credit', val: number) {
    setEntries((prev) => prev.map((e) => {
      if (e.accountCode !== code) return e;
      // Auto-clear the other side
      return { ...e, [field]: val, [field === 'debit' ? 'credit' : 'debit']: val > 0 ? 0 : e[field === 'debit' ? 'credit' : 'debit'] };
    }));
  }

  const totalDebit = entries.reduce((s, e) => s + (e.debit || 0), 0);
  const totalCredit = entries.reduce((s, e) => s + (e.credit || 0), 0);
  const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01;

  async function save() {
    setError(''); setSuccess('');
    if (!isBalanced) return setError(`Tidak balance: Debit ${formatRp(totalDebit)} ≠ Kredit ${formatRp(totalCredit)}`);
    const nonZero = entries.filter((e) => e.debit > 0 || e.credit > 0);
    if (nonZero.length === 0) return setError('Minimal satu akun harus diisi.');
    if (existing && !confirm('Saldo awal sudah pernah di-input. Lanjutkan? Ini akan membuat jurnal pembuka tambahan.')) return;
    setSaving(true);
    try {
      const inventory = Object.entries(inventoryMap).map(([itemId, stock]) => ({ itemId, stock }));
      await api.post('/accounting/opening-balance', {
        date,
        entries: nonZero.map((e) => ({ accountCode: e.accountCode, debit: e.debit, credit: e.credit, description: `Saldo awal ${e.name}` })),
        inventory,
      });
      setSuccess('Saldo awal berhasil disimpan. Jurnal pembuka telah di-posting.');
      setExisting(true);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg || 'Gagal menyimpan saldo awal.');
    } finally { setSaving(false); }
  }

  const typeLabels: Record<string, string> = { Asset: 'Aset', Liability: 'Kewajiban', Equity: 'Ekuitas', Revenue: 'Pendapatan', Expense: 'Beban' };
  const typeColors: Record<string, string> = {
    Asset: 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    Liability: 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    Equity: 'bg-violet-50 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400',
    Revenue: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    Expense: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  };

  if (loading) return <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 px-5 py-10 text-center text-gray-400 text-sm">Memuat...</div>;

  return (
    <div className="space-y-4">
      {existing && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800 rounded-xl px-4 py-3 text-xs text-amber-700 dark:text-amber-400">
          Saldo awal sudah pernah di-input sebelumnya. Menyimpan lagi akan membuat jurnal pembuka tambahan.
        </div>
      )}

      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-gray-900 dark:text-white">Saldo Awal Akun</h2>
            <p className="text-xs text-gray-400 mt-0.5">Total Debit dan Kredit harus sama</p>
          </div>
          <div className="flex items-center gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Tanggal</label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
                className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-lg px-2.5 py-1.5 text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
        </div>

        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 dark:border-gray-800">
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 dark:text-gray-600 uppercase tracking-wide">Kode</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 dark:text-gray-600 uppercase tracking-wide">Nama Akun</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 dark:text-gray-600 uppercase tracking-wide">Tipe</th>
              <th className="text-right px-5 py-3 text-xs font-semibold text-gray-400 dark:text-gray-600 uppercase tracking-wide">Debit</th>
              <th className="text-right px-5 py-3 text-xs font-semibold text-gray-400 dark:text-gray-600 uppercase tracking-wide">Kredit</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((e) => (
              <tr key={e.accountCode} className="border-b border-gray-50 dark:border-gray-800/60">
                <td className="px-5 py-2 font-mono text-xs text-gray-500 dark:text-gray-400">{e.accountCode}</td>
                <td className="px-5 py-2 text-gray-800 dark:text-gray-200 text-xs">{e.name}</td>
                <td className="px-5 py-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${typeColors[e.type] || ''}`}>{typeLabels[e.type] || e.type}</span>
                </td>
                <td className="px-5 py-2">
                  <input type="number" min={0} value={e.debit || ''} placeholder="0"
                    onChange={(ev) => setEntry(e.accountCode, 'debit', Number(ev.target.value))}
                    className="w-32 text-right border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-lg px-2.5 py-1.5 text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 ml-auto block" />
                </td>
                <td className="px-5 py-2">
                  <input type="number" min={0} value={e.credit || ''} placeholder="0"
                    onChange={(ev) => setEntry(e.accountCode, 'credit', Number(ev.target.value))}
                    className="w-32 text-right border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-lg px-2.5 py-1.5 text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 ml-auto block" />
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-gray-50 dark:bg-gray-800/50 border-t-2 border-gray-200 dark:border-gray-700">
              <td colSpan={3} className="px-5 py-3 text-xs font-bold text-gray-700 dark:text-gray-300 uppercase">Total</td>
              <td className="px-5 py-3 text-right text-xs font-bold text-gray-900 dark:text-white">{formatRp(totalDebit)}</td>
              <td className="px-5 py-3 text-right text-xs font-bold text-gray-900 dark:text-white">{formatRp(totalCredit)}</td>
            </tr>
            <tr className="bg-gray-50 dark:bg-gray-800/50">
              <td colSpan={5} className="px-5 py-2 text-right">
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${isBalanced && totalDebit > 0 ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400'}`}>
                  {isBalanced && totalDebit > 0 ? 'Balance ✓' : totalDebit === 0 && totalCredit === 0 ? 'Belum diisi' : 'Tidak Balance ✗'}
                </span>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Inventory */}
      {items.length > 0 && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800">
            <h2 className="font-semibold text-gray-900 dark:text-white">Stok Awal Inventory</h2>
            <p className="text-xs text-gray-400 mt-0.5">Set stok awal tiap item. Biarkan 0 kalau tidak ada.</p>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-800">
                {['SKU', 'Nama Item', 'Satuan', 'Stok Awal'].map((h) => (
                  <th key={h} className={`px-5 py-3 text-xs font-semibold text-gray-400 dark:text-gray-600 uppercase tracking-wide ${h === 'Stok Awal' ? 'text-right' : 'text-left'}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-b border-gray-50 dark:border-gray-800/60">
                  <td className="px-5 py-2 font-mono text-xs text-gray-500 dark:text-gray-400">{item.sku}</td>
                  <td className="px-5 py-2 text-gray-800 dark:text-gray-200 text-xs">{item.name}</td>
                  <td className="px-5 py-2 text-gray-500 dark:text-gray-400 text-xs">{item.uom}</td>
                  <td className="px-5 py-2">
                    <input type="number" min={0} value={inventoryMap[item.id] ?? 0}
                      onChange={(e) => setInventoryMap((prev) => ({ ...prev, [item.id]: Number(e.target.value) }))}
                      className="w-28 text-right border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-lg px-2.5 py-1.5 text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 ml-auto block" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {error && <div className="px-4 py-3 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-xl text-xs text-red-600 dark:text-red-400">{error}</div>}
      {success && <div className="px-4 py-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800 rounded-xl text-xs text-emerald-700 dark:text-emerald-400">{success}</div>}

      <button onClick={save} disabled={saving}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-3 text-sm font-medium transition-colors disabled:opacity-60">
        {saving ? 'Menyimpan...' : 'Simpan Saldo Awal'}
      </button>
    </div>
  );
}

// ── Ledger Tab (redirect to dedicated page) ──────────────────────────────────
function LedgerTab({ router }: { router: any }) {
  useEffect(() => {
    router.push('/accounting/ledger');
  }, [router]);
  return null;
}
