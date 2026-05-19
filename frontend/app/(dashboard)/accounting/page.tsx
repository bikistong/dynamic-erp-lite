'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/api';

interface Journal {
  id: string; journalNo: string; type: string; status: string;
  description: string; date: string; reference?: string;
}

const statusColors: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  posted: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
};

export default function AccountingPage() {
  const [journals, setJournals] = useState<Journal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/accounting/journals', { params: { limit: 50 } })
      .then((r) => setJournals(r.data.data))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-6 md:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Accounting</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Jurnal dan buku besar</p>
      </div>

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
              {!loading && journals.length === 0 && <tr><td colSpan={6} className="px-5 py-10 text-center text-gray-300 dark:text-gray-700 text-sm">Tidak ada jurnal</td></tr>}
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
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusColors[j.status] || 'bg-gray-100 text-gray-500'}`}>
                      {j.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
