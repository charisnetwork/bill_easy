import React, { useState, useEffect } from 'react';
import { paymentAPI, customerAPI, invoiceAPI } from '../services/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '../components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '../components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter
} from '../components/ui/dialog';
import { Badge } from '../components/ui/badge';
import { Plus, Search, Trash2, IndianRupee, Wallet, Calendar, User, FileText, Loader2, RefreshCcw } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount || 0);
};

export const PaymentsInPage = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  
  // Dialog State
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [unpaidInvoices, setUnpaidInvoices] = useState([]);
  
  const [formData, setFormData] = useState({
    customer_id: '',
    invoice_id: '',
    amount: '',
    payment_method: 'Cash',
    payment_date: new Date().toISOString().split('T')[0],
    reference_number: '',
    notes: '',
    payment_type: 'received'
  });

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const res = await paymentAPI.getAll({ 
        page, 
        limit: 20, 
        type: 'received' 
      });
      setPayments(res.data.payments);
      setTotalPages(res.data.pages);
    } catch (error) {
      toast.error("Failed to load payments");
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomers = async () => {
    try {
      const res = await customerAPI.getAll({ limit: 100 });
      setCustomers(res.data.customers);
    } catch (e) {}
  };

  const fetchUnpaidInvoices = async (customerId) => {
    if (!customerId) return;
    try {
      const res = await invoiceAPI.getAll({ 
        customer_id: customerId, 
        payment_status: 'unpaid',
        limit: 50
      });
      // Also get partial ones
      const res2 = await invoiceAPI.getAll({ 
        customer_id: customerId, 
        payment_status: 'partial',
        limit: 50
      });
      setUnpaidInvoices([...res.data.invoices, ...res2.data.invoices]);
    } catch (e) {}
  };

  useEffect(() => {
    fetchPayments();
  }, [page]);

  useEffect(() => {
    if (dialogOpen) {
      fetchCustomers();
    }
  }, [dialogOpen]);

  const handleCustomerChange = (val) => {
    setFormData({ ...formData, customer_id: val, invoice_id: '' });
    fetchUnpaidInvoices(val);
  };

  const handleInvoiceChange = (val) => {
    const inv = unpaidInvoices.find(i => i.id === val);
    if (inv) {
      const balance = parseFloat(inv.total_amount) - parseFloat(inv.paid_amount || 0);
      setFormData({ ...formData, invoice_id: val, amount: balance.toString() });
    } else {
      setFormData({ ...formData, invoice_id: val });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.customer_id || !formData.amount) {
      toast.error("Please fill required fields");
      return;
    }

    setSubmitting(true);
    try {
      await paymentAPI.create(formData);
      toast.success("Payment recorded successfully");
      setDialogOpen(false);
      setFormData({
        customer_id: '',
        invoice_id: '',
        amount: '',
        payment_method: 'Cash',
        payment_date: new Date().toISOString().split('T')[0],
        reference_number: '',
        notes: '',
        payment_type: 'received'
      });
      fetchPayments();
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to record payment");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this payment record? This will revert the invoice balance and customer balance.")) return;
    try {
      await paymentAPI.delete(id);
      toast.success("Payment deleted");
      fetchPayments();
    } catch (error) {
      toast.error("Delete failed");
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Payment In</h1>
          <p className="text-slate-600">Track and record payments received from customers</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-emerald-600 hover:bg-emerald-700">
              <Plus className="w-4 h-4 mr-2" /> Record Payment
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Record Payment In</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Customer *</Label>
                <Select value={formData.customer_id} onValueChange={handleCustomerChange}>
                  <SelectTrigger><SelectValue placeholder="Select Customer" /></SelectTrigger>
                  <SelectContent>
                    {customers.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.name} ({c.phone})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Link to Invoice (Optional)</Label>
                <Select value={formData.invoice_id} onValueChange={handleInvoiceChange} disabled={!formData.customer_id}>
                  <SelectTrigger><SelectValue placeholder={formData.customer_id ? "Select Invoice" : "Select customer first"} /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No specific invoice</SelectItem>
                    {unpaidInvoices.map(inv => (
                      <SelectItem key={inv.id} value={inv.id}>
                        {inv.invoice_number} - Balance: {formatCurrency(parseFloat(inv.total_amount) - parseFloat(inv.paid_amount || 0))}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Amount (₹) *</Label>
                  <Input 
                    type="number" 
                    value={formData.amount} 
                    onChange={(e) => setFormData({...formData, amount: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Date *</Label>
                  <Input 
                    type="date" 
                    value={formData.payment_date} 
                    onChange={(e) => setFormData({...formData, payment_date: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Payment Method</Label>
                <Select value={formData.payment_method} onValueChange={(val) => setFormData({...formData, payment_method: val})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Cash">Cash</SelectItem>
                    <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                    <SelectItem value="UPI/GPay">UPI/GPay</SelectItem>
                    <SelectItem value="Cheque">Cheque</SelectItem>
                    <SelectItem value="Card">Credit/Debit Card</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Reference # / Transaction ID</Label>
                <Input 
                  placeholder="e.g. TXN123456" 
                  value={formData.reference_number} 
                  onChange={(e) => setFormData({...formData, reference_number: e.target.value})}
                />
              </div>

              <DialogFooter className="mt-6">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={submitting} className="bg-emerald-600 hover:bg-emerald-700">
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <IndianRupee className="w-4 h-4 mr-2" />}
                  Save Payment
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <RefreshCcw className="w-4 h-4 text-emerald-600" /> Recent Payments
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={fetchPayments} className="h-8 text-xs">
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : payments.length === 0 ? (
            <div className="text-center py-12">
              <Wallet className="w-12 h-12 text-slate-200 mx-auto mb-4" />
              <p className="text-slate-600">No payment records found</p>
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-slate-50/50">
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="w-20"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="text-sm font-medium text-slate-600">
                      {format(new Date(p.payment_date), 'dd MMM yyyy')}
                    </TableCell>
                    <TableCell>
                      <div className="font-bold text-slate-900">{p.Customer?.name}</div>
                      <div className="text-[10px] text-slate-400">{p.Customer?.phone}</div>
                    </TableCell>
                    <TableCell>
                      {p.Invoice ? (
                        <Badge variant="outline" className="font-mono text-[10px] bg-indigo-50/50 text-indigo-700 border-indigo-100">
                          {p.Invoice.invoice_number}
                        </Badge>
                      ) : (
                        <span className="text-xs text-slate-400 italic">Unlinked</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                        {p.payment_method}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-black text-emerald-600">
                      {formatCurrency(p.amount)}
                    </TableCell>
                    <TableCell>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-rose-500 hover:bg-rose-50"
                        onClick={() => handleDelete(p.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
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
    </div>
  );
};

export default PaymentsInPage;
