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
import { Download, RefreshCw, TrendingUp } from 'lucide-react';
import { formatRupiah } from '@/lib/helpers';

interface PLItem {
  account_code: string;
  account_name: string;
  amount: number;
  category: string;
}

interface PLSection {
  title: string;
  items: PLItem[];
  total: number;
}

export default function ProfitLossPage() {
  const [period, setPeriod] = useState('2024-01');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<{
    revenue: PLSection;
    cogs: PLSection;
    grossProfit: number;
    expenses: PLSection;
    operatingIncome: number;
    otherIncome: PLSection;
    netIncome: number;
  } | null>(null);

  const fetchProfitLoss = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/accounting/profit-loss?period=${period}`);
      if (res.ok) {
        const result = await res.json();
        setData(result.data);
      }
    } catch (error) {
      console.error('Error fetching profit loss:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    if (!data) return;
    
    const rows: string[][] = [];
    rows.push(['Category', 'Account Code', 'Account Name', 'Amount']);
    
    data.revenue.items.forEach(item => {
      rows.push(['Revenue', item.account_code, item.account_name, item.amount.toString()]);
    });
    rows.push(['Total Revenue', '', '', data.revenue.total.toString()]);
    
    data.cogs.items.forEach(item => {
      rows.push(['COGS', item.account_code, item.account_name, item.amount.toString()]);
    });
    rows.push(['Total COGS', '', '', data.cogs.total.toString()]);
    rows.push(['Gross Profit', '', '', data.grossProfit.toString()]);
    
    data.expenses.items.forEach(item => {
      rows.push(['Expense', item.account_code, item.account_name, item.amount.toString()]);
    });
    rows.push(['Total Expenses', '', '', data.expenses.total.toString()]);
    rows.push(['Operating Income', '', '', data.operatingIncome.toString()]);
    
    data.otherIncome.items.forEach(item => {
      rows.push(['Other Income', item.account_code, item.account_name, item.amount.toString()]);
    });
    rows.push(['Net Income', '', '', data.netIncome.toString()]);
    
    const csvContent = rows.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `profit-loss-${period}.csv`;
    a.click();
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Laba Rugi (Profit & Loss)</h1>
          <p className="text-muted-foreground">Laporan kinerja keuangan perusahaan</p>
        </div>
        {data && (
          <Button onClick={exportToCSV} variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filter Periode</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              <Button onClick={fetchProfitLoss} disabled={loading} className="w-full md:w-auto">
                <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                Generate Report
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {data && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">{formatRupiah(data.revenue.total)}</div>
                <p className="text-muted-foreground">Total Pendapatan</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">{formatRupiah(data.cogs.total)}</div>
                <p className="text-muted-foreground">Harga Pokok Penjualan</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-green-600">{formatRupiah(data.grossProfit)}</div>
                <p className="text-muted-foreground">Laba Kotor</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className={`text-2xl font-bold ${data.netIncome >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  <TrendingUp className="inline mr-2 h-5 w-5" />
                  {formatRupiah(Math.abs(data.netIncome))}
                </div>
                <p className="text-muted-foreground">
                  {data.netIncome >= 0 ? 'Laba Bersih' : 'Rugi Bersih'}
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Laporan Laba Rugi - Periode {period}</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Keterangan</TableHead>
                    <TableHead className="text-right">Jumlah</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {/* PENDAPATAN */}
                  <TableRow className="bg-blue-50 font-semibold">
                    <TableCell>PENDAPATAN</TableCell>
                    <TableCell></TableCell>
                  </TableRow>
                  {data.revenue.items.map((item, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="pl-8">{item.account_name}</TableCell>
                      <TableCell className="text-right">{formatRupiah(item.amount)}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="font-bold">
                    <TableCell className="pl-8">Total Pendapatan</TableCell>
                    <TableCell className="text-right">{formatRupiah(data.revenue.total)}</TableCell>
                  </TableRow>

                  {/* HPP */}
                  <TableRow className="bg-red-50 font-semibold">
                    <TableCell>HARGA POKOK PENJUALAN (HPP)</TableCell>
                    <TableCell></TableCell>
                  </TableRow>
                  {data.cogs.items.map((item, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="pl-8">{item.account_name}</TableCell>
                      <TableCell className="text-right">{formatRupiah(item.amount)}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="font-bold">
                    <TableCell className="pl-8">Total HPP</TableCell>
                    <TableCell className="text-right">{formatRupiah(data.cogs.total)}</TableCell>
                  </TableRow>

                  {/* LABA KOTOR */}
                  <TableRow className="bg-green-50 font-bold text-lg">
                    <TableCell>LABA KOTOR</TableCell>
                    <TableCell className="text-right text-green-600">{formatRupiah(data.grossProfit)}</TableCell>
                  </TableRow>

                  {/* BEBAN OPERASIONAL */}
                  <TableRow className="bg-yellow-50 font-semibold">
                    <TableCell>BEBAN OPERASIONAL</TableCell>
                    <TableCell></TableCell>
                  </TableRow>
                  {data.expenses.items.map((item, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="pl-8">{item.account_name}</TableCell>
                      <TableCell className="text-right">{formatRupiah(item.amount)}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="font-bold">
                    <TableCell className="pl-8">Total Beban Operasional</TableCell>
                    <TableCell className="text-right">{formatRupiah(data.expenses.total)}</TableCell>
                  </TableRow>

                  {/* LABA OPERASIONAL */}
                  <TableRow className="font-bold">
                    <TableCell>LABA OPERASIONAL</TableCell>
                    <TableCell className="text-right">{formatRupiah(data.operatingIncome)}</TableCell>
                  </TableRow>

                  {/* PENDAPATAN/BEBAN LAIN-LAIN */}
                  {data.otherIncome.items.length > 0 && (
                    <>
                      <TableRow className="bg-purple-50 font-semibold">
                        <TableCell>PENDAPATAN/BEBAN LAIN-LAIN</TableCell>
                        <TableCell></TableCell>
                      </TableRow>
                      {data.otherIncome.items.map((item, idx) => (
                        <TableRow key={idx}>
                          <TableCell className="pl-8">{item.account_name}</TableCell>
                          <TableCell className="text-right">{formatRupiah(item.amount)}</TableCell>
                        </TableRow>
                      ))}
                    </>
                  )}

                  {/* LABA BERSIH */}
                  <TableRow className="bg-gray-100 font-bold text-xl border-t-2">
                    <TableCell>{data.netIncome >= 0 ? 'LABA BERSIH' : 'RUGI BERSIH'}</TableCell>
                    <TableCell className={`text-right ${data.netIncome >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatRupiah(Math.abs(data.netIncome))}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}

      {!data && !loading && (
        <Card>
          <CardContent className="pt-6 text-center text-muted-foreground">
            Pilih periode dan klik &quot;Generate Report&quot; untuk melihat laporan laba rugi
          </CardContent>
        </Card>
      )}
    </div>
  );
}
