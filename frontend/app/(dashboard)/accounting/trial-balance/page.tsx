'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Download, RefreshCw, Calculator } from 'lucide-react';
import { formatRupiah } from '@/lib/helpers';

interface TrialBalanceEntry {
  account_code: string;
  account_name: string;
  account_type: string;
  debit: number;
  credit: number;
  balance: number;
}

export default function TrialBalancePage() {
  const [period, setPeriod] = useState('2024-01');
  const [includeClosing, setIncludeClosing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<TrialBalanceEntry[]>([]);

  const fetchTrialBalance = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/accounting/trial-balance?period=${period}&include_closing=${includeClosing}`);
      if (res.ok) {
        const result = await res.json();
        setData(result.data || []);
      }
    } catch (error) {
      console.error('Error fetching trial balance:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalDebit = data.reduce((sum, item) => sum + item.debit, 0);
  const totalCredit = data.reduce((sum, item) => sum + item.credit, 0);
  const difference = totalDebit - totalCredit;

  const exportToCSV = () => {
    const headers = ['Account Code', 'Account Name', 'Type', 'Debit', 'Credit', 'Balance'];
    const rows = data.map(item => [
      item.account_code,
      item.account_name,
      item.account_type,
      item.debit,
      item.credit,
      item.balance
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `trial-balance-${period}.csv`;
    a.click();
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Neraca Saldo (Trial Balance)</h1>
          <p className="text-muted-foreground">Laporan saldo semua akun untuk periode tertentu</p>
        </div>
        <Button onClick={exportToCSV} variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filter Periode</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="period">Periode</Label>
              <Input
                id="period"
                type="month"
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
              />
            </div>
            <div className="flex items-end">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeClosing}
                  onChange={(e) => setIncludeClosing(e.target.checked)}
                  className="rounded border-gray-300"
                />
                <span>Sertakan Jurnal Penutup</span>
              </label>
            </div>
            <div className="flex items-end gap-2">
              <Button onClick={fetchTrialBalance} disabled={loading}>
                <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                Generate Report
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {data.length > 0 && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">{formatRupiah(totalDebit)}</div>
                <p className="text-muted-foreground">Total Debit</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">{formatRupiah(totalCredit)}</div>
                <p className="text-muted-foreground">Total Kredit</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className={`text-2xl font-bold ${difference === 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatRupiah(Math.abs(difference))}
                </div>
                <p className="text-muted-foreground">
                  Selisih {difference === 0 ? '(Balanced)' : '(Unbalanced)'}
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                Neraca Saldo - Periode {period}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Kode Akun</TableHead>
                    <TableHead>Nama Akun</TableHead>
                    <TableHead>Tipe</TableHead>
                    <TableHead className="text-right">Debit</TableHead>
                    <TableHead className="text-right">Kredit</TableHead>
                    <TableHead className="text-right">Saldo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-mono">{item.account_code}</TableCell>
                      <TableCell className="font-medium">{item.account_name}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded text-xs ${
                          item.account_type === 'Asset' ? 'bg-blue-100 text-blue-800' :
                          item.account_type === 'Liability' ? 'bg-red-100 text-red-800' :
                          item.account_type === 'Equity' ? 'bg-purple-100 text-purple-800' :
                          item.account_type === 'Revenue' ? 'bg-green-100 text-green-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {item.account_type}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">{formatRupiah(item.debit)}</TableCell>
                      <TableCell className="text-right">{formatRupiah(item.credit)}</TableCell>
                      <TableCell className={`text-right font-medium ${item.balance < 0 ? 'text-red-600' : ''}`}>
                        {formatRupiah(Math.abs(item.balance))}
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="font-bold bg-gray-50">
                    <TableCell colSpan={3}>TOTAL</TableCell>
                    <TableCell className="text-right">{formatRupiah(totalDebit)}</TableCell>
                    <TableCell className="text-right">{formatRupiah(totalCredit)}</TableCell>
                    <TableCell className="text-right">{formatRupiah(Math.abs(difference))}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}

      {data.length === 0 && !loading && (
        <Card>
          <CardContent className="pt-6 text-center text-muted-foreground">
            Pilih periode dan klik &quot;Generate Report&quot; untuk melihat neraca saldo
          </CardContent>
        </Card>
      )}
    </div>
  );
}
