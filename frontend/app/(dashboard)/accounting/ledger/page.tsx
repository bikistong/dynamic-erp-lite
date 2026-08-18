'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { FileText, Filter, Download } from 'lucide-react';

interface LedgerEntry {
  id: string;
  date: string;
  debit: number;
  credit: number;
  balance: number;
  description: string;
  account: { code: string; name: string; type: string };
  journal: { journalNo: string; description: string; reference?: string };
}

interface Account {
  id: string;
  code: string;
  name: string;
  type: string;
}

function formatRp(n: number) { return new Intl.NumberFormat('id-ID').format(n); }
function formatDate(d: string) { return new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }); }

export default function GeneralLedgerPage() {
  const router = useRouter();
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterLoading, setFilterLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Filters
  const [selectedAccount, setSelectedAccount] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 50;

  const loadAccounts = useCallback(async () => {
    try {
      const res = await api.get('/accounting/accounts', { params: { limit: 200, active: true } });
      setAccounts(res.data.data || []);
    } catch (err) {
      console.error('Failed to load accounts:', err);
    }
  }, []);

  const loadLedger = useCallback(async () => {
    setFilterLoading(true);
    setError('');
    try {
      const params: Record<string, any> = { page, limit };
      if (selectedAccount) params.accountId = selectedAccount;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const res = await api.get('/accounting/ledger', { params });
      setEntries(res.data.data || []);
      setTotal(res.data.total || 0);
      setPage(res.data.page || 1);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal memuat general ledger.');
    } finally {
      setFilterLoading(false);
      setLoading(false);
    }
  }, [selectedAccount, startDate, endDate, page]);

  useEffect(() => {
    loadAccounts();
  }, [loadAccounts]);

  useEffect(() => {
    loadLedger();
  }, [loadLedger]);

  function resetFilters() {
    setSelectedAccount('');
    setStartDate('');
    setEndDate('');
    setPage(1);
  }

  const totalPages = Math.ceil(total / limit);
  const totalDebit = entries.reduce((sum, e) => sum + e.debit, 0);
  const totalCredit = entries.reduce((sum, e) => sum + e.credit, 0);

  if (loading) {
    return (
      <div className="p-6 md:p-8 flex items-center justify-center min-h-[400px]">
        <div className="text-gray-500 dark:text-gray-400">Memuat data...</div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">General Ledger</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Buku besar semua transaksi akuntansi</p>
        </div>
        <button
          onClick={() => router.push('/accounting')}
          className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-medium transition-colors"
        >
          <FileText size={16} />
          Kembali
        </button>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-xl text-sm">
          {error}
        </div>
      )}

      {/* Filters Card */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 p-5">
        <div className="flex items-center gap-2 mb-4">
          <Filter size={18} className="text-gray-500 dark:text-gray-400" />
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Filter</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
              Akun
            </label>
            <select
              value={selectedAccount}
              onChange={(e) => { setSelectedAccount(e.target.value); setPage(1); }}
              className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
            >
              <option value="">Semua Akun</option>
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.code} - {acc.name}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
              Dari Tanggal
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
              className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
            />
          </div>
          
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
              Sampai Tanggal
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
              className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
            />
          </div>
          
          <div className="flex items-end">
            <button
              onClick={resetFilters}
              className="w-full px-4 py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-medium transition-colors"
            >
              Reset Filter
            </button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-900/20 rounded-2xl p-5 border border-blue-200 dark:border-blue-800">
          <p className="text-xs font-medium text-blue-700 dark:text-blue-400 mb-1">Total Debit</p>
          <p className="text-xl font-bold text-blue-900 dark:text-white">Rp {formatRp(totalDebit)}</p>
        </div>
        <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/30 dark:to-orange-900/20 rounded-2xl p-5 border border-orange-200 dark:border-orange-800">
          <p className="text-xs font-medium text-orange-700 dark:text-orange-400 mb-1">Total Kredit</p>
          <p className="text-xl font-bold text-orange-900 dark:text-white">Rp {formatRp(totalCredit)}</p>
        </div>
        <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/30 dark:to-emerald-900/20 rounded-2xl p-5 border border-emerald-200 dark:border-emerald-800">
          <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400 mb-1">Jumlah Transaksi</p>
          <p className="text-xl font-bold text-emerald-900 dark:text-white">{total.toLocaleString('id-ID')}</p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="text-left px-5 py-4 font-semibold text-gray-700 dark:text-gray-300">Tanggal</th>
                <th className="text-left px-5 py-4 font-semibold text-gray-700 dark:text-gray-300">Akun</th>
                <th className="text-left px-5 py-4 font-semibold text-gray-700 dark:text-gray-300">Jurnal</th>
                <th className="text-left px-5 py-4 font-semibold text-gray-700 dark:text-gray-300 w-1/3">Deskripsi</th>
                <th className="text-right px-5 py-4 font-semibold text-gray-700 dark:text-gray-300">Debit</th>
                <th className="text-right px-5 py-4 font-semibold text-gray-700 dark:text-gray-300">Kredit</th>
                <th className="text-right px-5 py-4 font-semibold text-gray-700 dark:text-gray-300">Saldo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {entries.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-gray-500 dark:text-gray-400">
                    <FileText size={40} className="mx-auto mb-3 opacity-50" />
                    <p className="font-medium">Belum ada data general ledger</p>
                    <p className="text-sm mt-1">Transaksi akan muncul setelah jurnal diposting</p>
                  </td>
                </tr>
              ) : (
                entries.map((entry) => (
                  <tr key={entry.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="px-5 py-4 text-gray-900 dark:text-white whitespace-nowrap">
                      {formatDate(entry.date)}
                    </td>
                    <td className="px-5 py-4">
                      <div className="font-medium text-gray-900 dark:text-white">{entry.account.code}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{entry.account.name}</div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="font-medium text-gray-900 dark:text-white">{entry.journal.journalNo}</div>
                      {entry.journal.reference && (
                        <div className="text-xs text-gray-500 dark:text-gray-400">{entry.journal.reference}</div>
                      )}
                    </td>
                    <td className="px-5 py-4 text-gray-700 dark:text-gray-300">
                      <div className="truncate max-w-md" title={entry.description}>
                        {entry.description || entry.journal.description}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-right">
                      {entry.debit > 0 ? (
                        <span className="font-medium text-blue-600 dark:text-blue-400">
                          Rp {formatRp(entry.debit)}
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-right">
                      {entry.credit > 0 ? (
                        <span className="font-medium text-orange-600 dark:text-orange-400">
                          Rp {formatRp(entry.credit)}
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-right font-medium text-gray-900 dark:text-white">
                      Rp {formatRp(entry.balance)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {entries.length > 0 && (
              <tfoot className="bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
                <tr>
                  <td colSpan={4} className="px-5 py-4 text-right font-semibold text-gray-700 dark:text-gray-300">Total:</td>
                  <td className="px-5 py-4 text-right font-bold text-blue-600 dark:text-blue-400">
                    Rp {formatRp(totalDebit)}
                  </td>
                  <td className="px-5 py-4 text-right font-bold text-orange-600 dark:text-orange-400">
                    Rp {formatRp(totalCredit)}
                  </td>
                  <td className="px-5 py-4"></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-4 border-t border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Menampilkan {((page - 1) * limit) + 1} - {Math.min(page * limit, total)} dari {total} entri
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
                className="px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>
              <span className="px-3 py-1.5 text-sm font-medium text-gray-900 dark:text-white bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage(page + 1)}
                disabled={page === totalPages}
                className="px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
