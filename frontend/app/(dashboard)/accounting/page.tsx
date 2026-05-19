'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/api';

interface Journal {
  id: string; journalNo: string; type: string; status: string;
  description: string; date: string; reference?: string;
}

const statusColors: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-600',
  posted: 'bg-green-100 text-green-700',
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
        <h2 className="text-xl font-bold text-gray-900">Accounting</h2>
        <p className="text-sm text-gray-500 mt-0.5">Jurnal dan buku besar</p>
      </div>

      <div className="bg-white rounded-xl border overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
            <tr>
              {['No. Jurnal', 'Tanggal', 'Keterangan', 'Referensi', 'Tipe', 'Status'].map((h) => (
                <th key={h} className="text-left px-4 py-3 font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y">
            {loading && <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">Memuat...</td></tr>}
            {!loading && journals.length === 0 && <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">Tidak ada jurnal</td></tr>}
            {journals.map((j) => (
              <tr key={j.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-mono text-xs text-gray-600">{j.journalNo}</td>
                <td className="px-4 py-3 text-gray-500">{new Date(j.date).toLocaleDateString('id-ID')}</td>
                <td className="px-4 py-3 text-gray-800 max-w-xs truncate">{j.description}</td>
                <td className="px-4 py-3 font-mono text-xs text-gray-500">{j.reference || '-'}</td>
                <td className="px-4 py-3">
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{j.type}</span>
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[j.status] || 'bg-gray-100'}`}>
                    {j.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
