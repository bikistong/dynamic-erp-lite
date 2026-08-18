'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Search, CheckCircle, AlertCircle, Package, Truck, Calendar, User } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { createGRN, getPurchaseOrders } from '@/lib/api';
import { useAuth } from '@/lib/auth';

interface PurchaseOrderItem {
  id: string;
  productId: string;
  product: {
    id: string;
    name: string;
    sku: string;
    unitOfMeasure: string;
  };
  quantity: number;
  receivedQuantity: number;
  unitPrice: number;
}

interface PurchaseOrder {
  id: string;
  poNumber: string;
  supplierId: string;
  supplier: {
    id: string;
    name: string;
  };
  orderDate: string;
  expectedDeliveryDate: string | null;
  status: 'draft' | 'submitted' | 'approved' | 'partially_received' | 'completed' | 'cancelled';
  items: PurchaseOrderItem[];
  totalAmount: number;
}

export default function GRNPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null);
  const [grnDialogOpen, setGrnDialogOpen] = useState(false);
  
  // Form state
  const [grnNumber, setGrnNumber] = useState('');
  const [receiptDate, setReceiptDate] = useState(new Date().toISOString().split('T')[0]);
  const [warehouseId, setWarehouseId] = useState('');
  const [notes, setNotes] = useState('');
  const [receivedItems, setReceivedItems] = useState<{itemId: string; receivedQty: number; batchNumber?: string}[]>([]);

  useEffect(() => {
    loadPurchaseOrders();
  }, [searchTerm, statusFilter]);

  const loadPurchaseOrders = async () => {
    try {
      setLoading(true);
      const response = await getPurchaseOrders({
        search: searchTerm,
        status: statusFilter !== 'all' ? statusFilter : undefined,
      });
      setPurchaseOrders(response.data || []);
    } catch (error) {
      console.error('Failed to load purchase orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenGRNDialog = (po: PurchaseOrder) => {
    setSelectedPO(po);
    setGrnNumber(`GRN-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`);
    setReceiptDate(new Date().toISOString().split('T')[0]);
    setNotes('');
    
    // Initialize received items with pending quantities
    const initialReceivedItems = po.items.map(item => ({
      itemId: item.id,
      receivedQty: item.quantity - item.receivedQuantity,
      batchNumber: '',
    }));
    setReceivedItems(initialReceivedItems);
    
    setGrnDialogOpen(true);
  };

  const handleReceivedQtyChange = (itemId: string, qty: number) => {
    setReceivedItems(prev =>
      prev.map(item =>
        item.itemId === itemId ? { ...item, receivedQty: Math.max(0, qty) } : item
      )
    );
  };

  const handleBatchNumberChange = (itemId: string, batchNumber: string) => {
    setReceivedItems(prev =>
      prev.map(item =>
        item.itemId === itemId ? { ...item, batchNumber } : item
      )
    );
  };

  const handleSubmitGRN = async () => {
    if (!selectedPO) return;

    try {
      setLoading(true);
      
      const items = receivedItems.map(item => ({
        purchaseOrderItemId: item.itemId,
        receivedQuantity: item.receivedQty,
        batchNumber: item.batchNumber || undefined,
      }));

      await createGRN({
        purchaseOrderId: selectedPO.id,
        grnNumber,
        receiptDate,
        warehouseId: warehouseId || undefined,
        notes,
        items,
      });

      alert('Goods Receipt Note created successfully!');
      setGrnDialogOpen(false);
      loadPurchaseOrders();
      router.push('/purchasing/grn');
    } catch (error: any) {
      alert(error.message || 'Failed to create GRN');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'submitted': return 'bg-blue-100 text-blue-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'partially_received': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-purple-100 text-purple-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredPOs = purchaseOrders.filter(po => 
    po.status === 'approved' || po.status === 'partially_received'
  );

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Goods Receipt Note</h1>
          <p className="text-muted-foreground">Receive goods from suppliers based on approved purchase orders</p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search PO number or supplier..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="partially_received">Partially Received</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* PO List */}
      <Card>
        <CardHeader>
          <CardTitle>Purchase Orders Ready for Receipt</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : filteredPOs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No purchase orders available for goods receipt
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>PO Number</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Order Date</TableHead>
                  <TableHead>Expected Delivery</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Total Amount</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPOs.map((po) => (
                  <TableRow key={po.id}>
                    <TableCell className="font-medium">{po.poNumber}</TableCell>
                    <TableCell>{po.supplier.name}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        {new Date(po.orderDate).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      {po.expectedDeliveryDate ? (
                        <div className="flex items-center gap-2">
                          <Truck className="h-4 w-4 text-muted-foreground" />
                          {new Date(po.expectedDeliveryDate).toLocaleDateString()}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">Not specified</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(po.status)}>
                        {po.status.replace('_', ' ').toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      Rp {po.totalAmount.toLocaleString('id-ID')}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        onClick={() => handleOpenGRNDialog(po)}
                      >
                        <Package className="h-4 w-4 mr-2" />
                        Create GRN
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* GRN Dialog */}
      <Dialog open={grnDialogOpen} onOpenChange={setGrnDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Goods Receipt Note</DialogTitle>
          </DialogHeader>
          
          {selectedPO && (
            <div className="space-y-6">
              {/* PO Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Purchase Order Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>PO Number</Label>
                      <p className="font-medium">{selectedPO.poNumber}</p>
                    </div>
                    <div>
                      <Label>Supplier</Label>
                      <p className="font-medium">{selectedPO.supplier.name}</p>
                    </div>
                    <div>
                      <Label>Order Date</Label>
                      <p>{new Date(selectedPO.orderDate).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <Label>Expected Delivery</Label>
                      <p>
                        {selectedPO.expectedDeliveryDate 
                          ? new Date(selectedPO.expectedDeliveryDate).toLocaleDateString()
                          : 'Not specified'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* GRN Form */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="grnNumber">GRN Number</Label>
                  <Input
                    id="grnNumber"
                    value={grnNumber}
                    onChange={(e) => setGrnNumber(e.target.value)}
                    placeholder="Auto-generated"
                  />
                </div>
                <div>
                  <Label htmlFor="receiptDate">Receipt Date</Label>
                  <Input
                    id="receiptDate"
                    type="date"
                    value={receiptDate}
                    onChange={(e) => setReceiptDate(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="warehouse">Warehouse (Optional)</Label>
                  <Select value={warehouseId} onValueChange={setWarehouseId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select warehouse" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="main">Main Warehouse</SelectItem>
                      <SelectItem value="secondary">Secondary Warehouse</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="notes">Notes (Optional)</Label>
                  <Input
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Additional notes"
                  />
                </div>
              </div>

              {/* Items Table */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Items to Receive</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead>SKU</TableHead>
                        <TableHead>Ordered Qty</TableHead>
                        <TableHead>Received Qty</TableHead>
                        <TableHead>Pending Qty</TableHead>
                        <TableHead>Receive Qty</TableHead>
                        <TableHead>Batch Number (Optional)</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedPO.items.map((item) => {
                        const pendingQty = item.quantity - item.receivedQuantity;
                        const receivedItem = receivedItems.find(r => r.itemId === item.id);
                        
                        return (
                          <TableRow key={item.id}>
                            <TableCell>{item.product.name}</TableCell>
                            <TableCell>{item.product.sku}</TableCell>
                            <TableCell>{item.quantity} {item.product.unitOfMeasure}</TableCell>
                            <TableCell>{item.receivedQuantity} {item.product.unitOfMeasure}</TableCell>
                            <TableCell>{pendingQty} {item.product.unitOfMeasure}</TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                min="0"
                                max={pendingQty}
                                value={receivedItem?.receivedQty || 0}
                                onChange={(e) => handleReceivedQtyChange(item.id, parseInt(e.target.value) || 0)}
                                className="w-24"
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                value={receivedItem?.batchNumber || ''}
                                onChange={(e) => handleBatchNumberChange(item.id, e.target.value)}
                                placeholder="Batch #"
                                className="w-32"
                              />
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              {/* Actions */}
              <div className="flex justify-end gap-4">
                <Button variant="outline" onClick={() => setGrnDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSubmitGRN} disabled={loading}>
                  {loading ? 'Creating...' : 'Create GRN'}
                  <CheckCircle className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
