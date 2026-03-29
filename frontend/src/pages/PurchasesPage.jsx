import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { purchaseAPI } from '../services/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardHeader } from '../components/ui/card';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '../components/ui/table';
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter, DialogTrigger
} from '../components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import { Plus, Search, ShoppingCart, Edit, ReceiptIndianRupee, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const formatCurrency = (amount) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount || 0);
const formatDate = (date) => new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

const PaymentStatusBadge = ({ status }) => {
  const styles = { paid: 'bg-emerald-100 text-emerald-700', partial: 'bg-amber-100 text-amber-700', unpaid: 'bg-red-100 text-red-700' };
  return <Badge className={styles[status] || 'bg-slate-100 text-slate-700'}>{status?.charAt(0).toUpperCase() + status?.slice(1)}</Badge>;
};

export const PurchasesPage = () => {
  const navigate = useNavigate();
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Payment Recording State
  const [selectedPurchase, setSelectedPurchase] = useState(null);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [paymentData, setPaymentData] = useState({
    amount: '',
    payment_method: 'Cash',
    reference_number: '',
    notes: ''
  });
  const [paymentLoading, setPaymentLoading] = useState(false);

  const fetchData = async () => {
    try {
      const purchasesRes = await purchaseAPI.getAll({ search, page, limit: 20 });
      setPurchases(purchasesRes.data.purchases);
      setTotalPages(purchasesRes.data.totalPages);
    } catch (error) {
      toast.error('Failed to load purchases');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [search, page]);

  const handleOpenPaymentDialog = (purchase) => {
    setSelectedPurchase(purchase);
    const remaining = purchase.total_amount - purchase.paid_amount;
    setPaymentData({
      amount: remaining.toString(),
      payment_method: 'Cash',
      reference_number: '',
      notes: ''
    });
    setPaymentDialogOpen(true);
  };

  const handleRecordPayment = async () => {
    if (!paymentData.amount || parseFloat(paymentData.amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    setPaymentLoading(true);
    try {
      await purchaseAPI.recordPayment(selectedPurchase.id, paymentData);
      toast.success('Payment recorded successfully');
      setPaymentDialogOpen(false);
      fetchData(); // Refresh list
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to record payment');
    } finally {
      setPaymentLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in" data-testid="purchases-page">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl md:text-3xl font-bold text-slate-900">Purchases</h1>
          <p className="text-slate-600">Manage your purchase bills</p>
        </div>
        <Button 
          className="bg-emerald-600 hover:bg-emerald-700" 
          onClick={() => navigate('/purchases/new')}
          data-testid="add-purchase-btn"
        >
          <Plus className="w-4 h-4 mr-2" />Add Purchase
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input placeholder="Search purchases..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" data-testid="search-purchases" />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div></div>
          ) : purchases.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingCart className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-600">No purchases found</p>
            </div>
          ) : (
            <Table className="data-table">
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-6">Bill #</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-right pr-6">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {purchases.map((purchase) => (
                  <TableRow key={purchase.id}>
                    <TableCell className="pl-6 font-mono font-medium">{purchase.bill_number}</TableCell>
                    <TableCell>{purchase.Supplier?.name}</TableCell>
                    <TableCell className="text-sm text-slate-600">{formatDate(purchase.bill_date)}</TableCell>
                    <TableCell className="text-right font-mono">
                      <div>{formatCurrency(purchase.total_amount)}</div>
                      {purchase.paid_amount > 0 && (
                        <div className="text-[10px] text-slate-400">Paid: {formatCurrency(purchase.paid_amount)}</div>
                      )}
                    </TableCell>
                    <TableCell className="text-center"><PaymentStatusBadge status={purchase.payment_status} /></TableCell>
                    <TableCell className="text-right pr-6">
                      <div className="flex justify-end gap-1">
                        {purchase.payment_status !== 'paid' && (
                          <Button variant="ghost" size="icon" onClick={() => handleOpenPaymentDialog(purchase)} title="Record Payment">
                            <ReceiptIndianRupee className="w-4 h-4 text-emerald-600" />
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" onClick={() => navigate(`/purchases/${purchase.id}/edit`)}>
                          <Edit className="w-4 h-4 text-slate-600" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>Previous</Button>
          <span className="text-sm text-slate-600">Page {page} of {totalPages}</span>
          <Button variant="outline" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>Next</Button>
        </div>
      )}

      {/* Record Payment Dialog */}
      <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Payment for {selectedPurchase?.bill_number}</DialogTitle>
            <DialogDescription>
              Enter the amount and payment method to record a payment for this purchase bill.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2 col-span-2">
                <Label>Amount to Pay (Remaining: {formatCurrency(selectedPurchase ? selectedPurchase.total_amount - selectedPurchase.paid_amount : 0)})</Label>
                <Input 
                  type="number" 
                  value={paymentData.amount} 
                  onChange={(e) => setPaymentData({ ...paymentData, amount: e.target.value })} 
                />
              </div>
              <div className="space-y-2">
                <Label>Payment Method</Label>
                <Select value={paymentData.payment_method} onValueChange={(v) => setPaymentData({ ...paymentData, payment_method: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Cash">Cash</SelectItem>
                    <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                    <SelectItem value="UPI">UPI</SelectItem>
                    <SelectItem value="Cheque">Cheque</SelectItem>
                    <SelectItem value="Credit Card">Credit Card</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Reference #</Label>
                <Input 
                  placeholder="TXN ID, Cheque #" 
                  value={paymentData.reference_number} 
                  onChange={(e) => setPaymentData({ ...paymentData, reference_number: e.target.value })} 
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Input 
                placeholder="Optional notes" 
                value={paymentData.notes} 
                onChange={(e) => setPaymentData({ ...paymentData, notes: e.target.value })} 
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPaymentDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleRecordPayment} className="bg-emerald-600 hover:bg-emerald-700" disabled={paymentLoading}>
              {paymentLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Record Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PurchasesPage;
