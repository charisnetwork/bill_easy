import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { invoiceAPI, customerAPI, productAPI } from '../services/api';
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
import { Badge } from '../components/ui/badge';
import { 
  Plus, 
  Search, 
  Eye, 
  FileText, 
  Trash2, 
  IndianRupee, 
  Pencil,
  Wallet,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Truck,
  Download
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../components/ui/dialog";
import { toast } from 'sonner';

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount || 0);
};

const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
};

const PaymentStatusBadge = ({ status }) => {
  const styles = {
    paid: 'bg-emerald-100 text-emerald-700',
    partial: 'bg-amber-100 text-amber-700',
    unpaid: 'bg-red-100 text-red-700'
  };
  return (
    <Badge className={styles[status] || 'bg-slate-100 text-slate-700'}>
      {status?.charAt(0).toUpperCase() + status?.slice(1)}
    </Badge>
  );
};

export const InvoicesPage = () => {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Payment Dialog State
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [paymentData, setPaymentData] = useState({
    amount: "",
    payment_method: "Cash",
    payment_date: new Date().toISOString().split("T")[0],
    reference_number: "",
    notes: ""
  });
  const [submittingPayment, setSubmittingPayment] = useState(false);

  const fetchInvoices = async () => {
    try {
      const params = { search, page, limit: 20 };
      if (paymentFilter !== 'all') params.payment_status = paymentFilter;
      const response = await invoiceAPI.getAll(params);
      setInvoices(response.data.invoices);
      setTotalPages(response.data.totalPages);
    } catch (error) {
      toast.error('Failed to load invoices');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, [search, page, paymentFilter]);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this invoice?')) return;
    try {
      await invoiceAPI.delete(id);
      toast.success('Invoice deleted');
      fetchInvoices();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Delete failed');
    }
  };

  const openPaymentDialog = (invoice) => {
    setSelectedInvoice(invoice);
    const balance = parseFloat(invoice.total_amount) - parseFloat(invoice.paid_amount || 0);
    setPaymentData({
      amount: balance.toString(),
      payment_method: "Cash",
      payment_date: new Date().toISOString().split("T")[0],
      reference_number: "",
      notes: ""
    });
    setPaymentDialogOpen(true);
  };

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    if (!paymentData.amount || parseFloat(paymentData.amount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }
    
    setSubmittingPayment(true);
    try {
      await invoiceAPI.recordPayment(selectedInvoice.id, paymentData);
      toast.success("Payment recorded successfully");
      setPaymentDialogOpen(false);
      fetchInvoices();
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to record payment");
    } finally {
      setSubmittingPayment(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in" data-testid="invoices-page">
      <TooltipProvider>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl md:text-3xl font-bold text-slate-900">Sales</h1>
          <p className="text-slate-600">Create and manage your sales invoices</p>
        </div>
        <Link to="/invoices/new">
          <Button className="bg-emerald-600 hover:bg-emerald-700" data-testid="create-invoice-btn">
            <Plus className="w-4 h-4 mr-2" />
            Create Invoice
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search invoices..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
                data-testid="search-invoices"
              />
            </div>
            <Select value={paymentFilter} onValueChange={setPaymentFilter}>
              <SelectTrigger className="w-40" data-testid="filter-payment-status">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="partial">Partial</SelectItem>
                <SelectItem value="unpaid">Unpaid</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : invoices.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-600">No invoices found</p>
              <p className="text-sm text-slate-500">Create your first invoice to get started</p>
            </div>
          ) : (
            <Table className="data-table">
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="w-32">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((invoice) => (
                  <TableRow key={invoice.id} data-testid={`invoice-row-${invoice.id}`}>
                    <TableCell>
                      <span className="font-mono font-medium text-slate-900">
                        {invoice.invoice_number}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-slate-900">{invoice.Customer?.name}</div>
                      {invoice.Customer?.phone && (
                        <div className="text-xs text-slate-500">{invoice.Customer.phone}</div>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-slate-600">
                      {formatDate(invoice.invoice_date)}
                    </TableCell>
                    <TableCell className="text-right font-mono font-medium">
                      {formatCurrency(invoice.total_amount)}
                    </TableCell>
                    <TableCell className="text-center">
                      <PaymentStatusBadge status={invoice.payment_status} />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-slate-500 hover:text-emerald-600"
                              onClick={() => navigate(`/invoices/${invoice.id}`)}
                              data-testid={`view-invoice-${invoice.id}`}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent><p>View Invoice</p></TooltipContent>
                        </Tooltip>

                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-slate-500 hover:text-blue-600"
                              onClick={() => navigate(`/invoices/${invoice.id}/edit`)}
                              data-testid={`edit-invoice-${invoice.id}`}
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent><p>Edit Invoice</p></TooltipContent>
                        </Tooltip>

                        {invoice.payment_status !== 'paid' && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-slate-500 hover:text-amber-600"
                                onClick={() => openPaymentDialog(invoice)}
                                data-testid={`payment-invoice-${invoice.id}`}
                              >
                                <Wallet className="w-4 h-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent><p>Record Payment</p></TooltipContent>
                          </Tooltip>
                        )}

                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-slate-500 hover:text-indigo-600"
                              onClick={() => navigate(`/eway-bills/new?invoice_id=${invoice.id}`)}
                            >
                              <Truck className="w-4 h-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent><p>Generate E-Way Bill</p></TooltipContent>
                        </Tooltip>

                        {invoice.eway_bill_number && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-indigo-600 hover:bg-indigo-50"
                                onClick={() => {
                                  const token = localStorage.getItem('token');
                                  window.open(`${process.env.REACT_APP_BACKEND_URL}/api/invoices/${invoice.id}/pdf?token=${token}`, "_blank");
                                }}
                              >
                                <Download className="w-4 h-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent><p>Download E-Way Bill</p></TooltipContent>
                          </Tooltip>
                        )}

                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-slate-500 hover:text-red-600 hover:bg-red-50"
                              onClick={() => handleDelete(invoice.id)}
                              data-testid={`delete-invoice-${invoice.id}`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent><p>Delete Invoice</p></TooltipContent>
                        </Tooltip>
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
          <Button variant="outline" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
            Previous
          </Button>
          <span className="text-sm text-slate-600">Page {page} of {totalPages}</span>
          <Button variant="outline" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
            Next
          </Button>
        </div>
      )}

      {/* Record Payment Dialog */}
      <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Payment for {selectedInvoice?.invoice_number}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleRecordPayment} className="space-y-4 pt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Amount (₹)</Label>
                <Input 
                  type="number" 
                  value={paymentData.amount} 
                  onChange={(e) => setPaymentData({...paymentData, amount: e.target.value})}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Date</Label>
                <Input 
                  type="date" 
                  value={paymentData.payment_date} 
                  onChange={(e) => setPaymentData({...paymentData, payment_date: e.target.value})}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Payment Method</Label>
              <Select value={paymentData.payment_method} onValueChange={(val) => setPaymentData({...paymentData, payment_method: val})}>
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
                value={paymentData.reference_number} 
                onChange={(e) => setPaymentData({...paymentData, reference_number: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Input 
                placeholder="Optional notes" 
                value={paymentData.notes} 
                onChange={(e) => setPaymentData({...paymentData, notes: e.target.value})}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setPaymentDialogOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={submittingPayment} className="bg-emerald-600 hover:bg-emerald-700">
                {submittingPayment ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <IndianRupee className="w-4 h-4 mr-2" />}
                Save Payment
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      </TooltipProvider>
    </div>
  );
};

export default InvoicesPage;
