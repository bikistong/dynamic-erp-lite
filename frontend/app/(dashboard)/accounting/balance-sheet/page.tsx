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
import { Download, RefreshCw, Scale } from 'lucide-react';
import { formatRupiah } from '@/lib/helpers';

interface BSItem {
  account_code: string;
  account_name: string;
  amount: number;
}

interface BSSection {
  title: string;
  items: BSItem[];
  total: number;
}

export default function BalanceSheetPage() {
  const [asOfDate, setAsOfDate] = useState('2024-01-31');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<{
    assets: {
      current: BSSection;
      nonCurrent: BSSection;
      total: number;
    };
    liabilities: {
      current: BSSection;
      nonCurrent: BSSection;
      total: number;
    };
    equity: BSSection;
    totalEquity: number;
    totalLiabilitiesAndEquity: number;
  } | null>(null);

  const fetchBalanceSheet = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/accounting/balance-sheet?as_of=${asOfDate}`);
      if (res.ok) {
        const result = await res.json();
        setData(result.data);
      }
    } catch (error) {
      console.error('Error fetching balance sheet:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    if (!data) return;
    
    const rows: string[][] = [];
    rows.push(['Category', 'Subcategory', 'Account Code', 'Account Name', 'Amount']);
    
    // Assets
    data.assets.current.items.forEach(item => {
      rows.push(['Asset', 'Current', item.account_code, item.account_name, item.amount.toString()]);
    });
    rows.push(['Asset', 'Current Total', '', '', data.assets.current.total.toString()]);
    
    data.assets.nonCurrent.items.forEach(item => {
      rows.push(['Asset', 'Non-Current', item.account_code, item.account_name, item.amount.toString()]);
    });
    rows.push(['Asset', 'Non-Current Total', '', '', data.assets.nonCurrent.total.toString()]);
    rows.push(['Asset', 'TOTAL ASSETS', '', '', data.assets.total.toString()]);
    
    // Liabilities
    data.liabilities.current.items.forEach(item => {
      rows.push(['Liability', 'Current', item.account_code, item.account_name, item.amount.toString()]);
    });
    rows.push(['Liability', 'Current Total', '', '', data.liabilities.current.total.toString()]);
    
    data.liabilities.nonCurrent.items.forEach(item => {
      rows.push(['Liability', 'Non-Current', item.account_code, item.account_name, item.amount.toString()]);
    });
    rows.push(['Liability', 'Non-Current Total', '', '', data.liabilities.nonCurrent.total.toString()]);
    rows.push(['Liability', 'TOTAL LIABILITIES', '', '', data.liabilities.total.toString()]);
    
    // Equity
    data.equity.items.forEach(item => {
      rows.push(['Equity', '', item.account_code, item.account_name, item.amount.toString()]);
    });
    rows.push(['Equity', 'TOTAL EQUITY', '', '', data.totalEquity.toString()]);
    rows.push(['TOTAL LIABILITIES & EQUITY', '', '', '', data.totalLiabilitiesAndEquity.toString()]);
    
    const csvContent = rows.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `balance-sheet-${asOfDate}.csv`;
    a.click();
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Neraca (Balance Sheet)</h1>
          <p className="text-muted-foreground">Laporan posisi keuangan perusahaan</p>
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
          <CardTitle>Filter Tanggal</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="asOfDate">Per Tanggal</Label>
              <Input
                id="asOfDate"
                type="date"
                value={asOfDate}
                onChange={(e) => setAsOfDate(e.target.value)}
              />
            </div>
            <div className="flex items-end">
              <Button onClick={fetchBalanceSheet} disabled={loading} className="w-full md:w-auto">
                <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                Generate Report
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {data && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">{formatRupiah(data.assets.total)}</div>
                <p className="text-muted-foreground">Total Aset</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">{formatRupiah(data.liabilities.total)}</div>
                <p className="text-muted-foreground">Total Liabilitas</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">{formatRupiah(data.totalEquity)}</div>
                <p className="text-muted-foreground">Total Ekuitas</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* ASET */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Scale className="h-5 w-5" />
                  ASET
                </CardTitle>
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
                    {/* Aset Lancar */}
                    <TableRow className="bg-blue-50 font-semibold">
                      <TableCell>Aset Lancar</TableCell>
                      <TableCell></TableCell>
                    </TableRow>
                    {data.assets.current.items.map((item, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="pl-8">{item.account_name}</TableCell>
                        <TableCell className="text-right">{formatRupiah(item.amount)}</TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="font-bold">
                      <TableCell className="pl-8">Total Aset Lancar</TableCell>
                      <TableCell className="text-right">{formatRupiah(data.assets.current.total)}</TableCell>
                    </TableRow>

                    {/* Aset Tidak Lancar */}
                    <TableRow className="bg-purple-50 font-semibold">
                      <TableCell>Aset Tidak Lancar</TableCell>
                      <TableCell></TableCell>
                    </TableRow>
                    {data.assets.nonCurrent.items.map((item, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="pl-8">{item.account_name}</TableCell>
                        <TableCell className="text-right">{formatRupiah(item.amount)}</TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="font-bold">
                      <TableCell className="pl-8">Total Aset Tidak Lancar</TableCell>
                      <TableCell className="text-right">{formatRupiah(data.assets.nonCurrent.total)}</TableCell>
                    </TableRow>

                    {/* TOTAL ASET */}
                    <TableRow className="bg-gray-100 font-bold text-lg border-t-2">
                      <TableCell>TOTAL ASET</TableCell>
                      <TableCell className="text-right">{formatRupiah(data.assets.total)}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* LIABILITAS & EKUITAS */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Scale className="h-5 w-5" />
                  LIABILITAS & EKUITAS
                </CardTitle>
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
                    {/* Liabilitas Jangka Pendek */}
                    <TableRow className="bg-red-50 font-semibold">
                      <TableCell>Liabilitas Jangka Pendek</TableCell>
                      <TableCell></TableCell>
                    </TableRow>
                    {data.liabilities.current.items.map((item, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="pl-8">{item.account_name}</TableCell>
                        <TableCell className="text-right">{formatRupiah(item.amount)}</TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="font-bold">
                      <TableCell className="pl-8">Total Liabilitas Jangka Pendek</TableCell>
                      <TableCell className="text-right">{formatRupiah(data.liabilities.current.total)}</TableCell>
                    </TableRow>

                    {/* Liabilitas Jangka Panjang */}
                    <TableRow className="bg-orange-50 font-semibold">
                      <TableCell>Liabilitas Jangka Panjang</TableCell>
                      <TableCell></TableCell>
                    </TableRow>
                    {data.liabilities.nonCurrent.items.map((item, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="pl-8">{item.account_name}</TableCell>
                        <TableCell className="text-right">{formatRupiah(item.amount)}</TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="font-bold">
                      <TableCell className="pl-8">Total Liabilitas Jangka Panjang</TableCell>
                      <TableCell className="text-right">{formatRupiah(data.liabilities.nonCurrent.total)}</TableCell>
                    </TableRow>

                    <TableRow className="font-bold">
                      <TableCell>Total Liabilitas</TableCell>
                      <TableCell className="text-right">{formatRupiah(data.liabilities.total)}</TableCell>
                    </TableRow>

                    {/* Ekuitas */}
                    <TableRow className="bg-green-50 font-semibold">
                      <TableCell>Ekuitas</TableCell>
                      <TableCell></TableCell>
                    </TableRow>
                    {data.equity.items.map((item, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="pl-8">{item.account_name}</TableCell>
                        <TableCell className="text-right">{formatRupiah(item.amount)}</TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="font-bold">
                      <TableCell className="pl-8">Total Ekuitas</TableCell>
                      <TableCell className="text-right">{formatRupiah(data.totalEquity)}</TableCell>
                    </TableRow>

                    {/* TOTAL LIABILITAS & EKUITAS */}
                    <TableRow className="bg-gray-100 font-bold text-lg border-t-2">
                      <TableCell>TOTAL LIABILITAS & EKUITAS</TableCell>
                      <TableCell className="text-right">{formatRupiah(data.totalLiabilitiesAndEquity)}</TableCell>
                    </TableRow>

                    {/* Check Balance */}
                    <TableRow className={data.assets.total === data.totalLiabilitiesAndEquity ? 'bg-green-50' : 'bg-red-50'}>
                      <TableCell className="font-bold">
                        {data.assets.total === data.totalLiabilitiesAndEquity ? '✓ BALANCED' : '✗ UNBALANCED'}
                      </TableCell>
                      <TableCell className="text-right font-bold">
                        {formatRupiah(Math.abs(data.assets.total - data.totalLiabilitiesAndEquity))}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {!data && !loading && (
        <Card>
          <CardContent className="pt-6 text-center text-muted-foreground">
            Pilih tanggal dan klik &quot;Generate Report&quot; untuk melihat neraca
          </CardContent>
        </Card>
      )}
    </div>
  );
}
