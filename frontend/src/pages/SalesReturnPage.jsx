import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { invoiceAPI, creditNoteAPI, companyAPI } from '../services/api';
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
import { Search, Save, Trash2, ArrowLeft, RefreshCcw, Calendar as CalendarIcon, Phone, User, Hash, Download, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { getIndustryConfig } from '../lib/industryConfig';

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2
  }).format(amount || 0);
};

export const SalesReturnPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [invoices, setInvoices] = useState([]);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [recentCreditNotes, setRecentCreditNotes] = useState([]);
  const [industryConfig, setIndustryConfig] = useState(getIndustryConfig('General Store'));
  
  const [formData, setFormData] = useState({
    invoice_id: '',
    items: [],
    reason: 'Damaged',
    industry_metadata: {}
  });

  const fetchRecentCreditNotes = async () => {
    try {
      const res = await creditNoteAPI.getAll({ limit: 10 });
      setRecentCreditNotes(res.data.creditNotes);
    } catch (e) {
      console.error("Failed to fetch recent CN", e);
    }
  };

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const res = await companyAPI.get();
        setIndustryConfig(getIndustryConfig(res.data.business_category || 'General Store'));
      } catch (e) {}
    };
    fetchConfig();
    fetchRecentCreditNotes();
  }, []);

  const handleSearch = async () => {
    setLoading(true);
    try {
      const params = { 
        search: searchQuery, 
        startDate, 
        endDate,
        limit: 50 
      };
      const res = await invoiceAPI.getAll(params);
      setInvoices(res.data.invoices);
      if (res.data.invoices.length === 0) {
        toast.error("No invoices found matching your criteria");
      } else {
        toast.success(`Found ${res.data.invoices.length} invoices`);
      }
      setSelectedInvoice(null); 
    } catch (error) {
      toast.error("Search failed");
    } finally {
      setLoading(false);
    }
  };

  const selectInvoice = async (inv) => {
    setLoading(true);
    try {
      const fullInv = await invoiceAPI.get(inv.id);
      setSelectedInvoice(fullInv.data);
      setFormData({
        ...formData,
        invoice_id: fullInv.data.id,
        items: fullInv.data.items.map(item => ({
          product_id: item.product_id,
          product_name: item.Product?.name,
          original_quantity: parseFloat(item.quantity),
          quantity: 0, 
          unit_price: parseFloat(item.unit_price),
          tax_rate: parseFloat(item.tax_rate || 0),
          total: 0
        }))
      });
      setInvoices([]); 
    } catch (error) {
      toast.error("Failed to load invoice details");
    } finally {
      setLoading(false);
    }
  };

  const updateItemField = (index, field, value) => {
    const newItems = [...formData.items];
    const item = newItems[index];
    
    if (field === 'quantity') {
      const val = parseFloat(value) || 0;
      if (val > item.original_quantity) {
        toast.error(`Cannot return more than sold (${item.original_quantity})`);
        return;
      }
      item.quantity = val;
    } else {
      item[field] = parseFloat(value) || 0;
    }

    const subtotal = item.quantity * item.unit_price;
    item.total = subtotal * (1 + item.tax_rate / 100);
    
    setFormData({ ...formData, items: newItems });
  };

  const calculateTotals = () => {
    return formData.items.reduce((acc, item) => acc + (item.total || 0), 0);
  };

  const downloadCN = (id) => {
    const token = localStorage.getItem('token');
    window.open(`${process.env.REACT_APP_BACKEND_URL}/api/credit-notes/${id}/pdf?token=${token}`, "_blank");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const returnItems = formData.items.filter(i => i.quantity > 0);
    if (returnItems.length === 0) return toast.error("Please specify at least one item to return");

    setLoading(true);
    try {
      const res = await creditNoteAPI.create({
        ...formData,
        items: returnItems
      });
      toast.success("Sales Return (Credit Note) saved successfully");
      
      // Auto download PDF
      downloadCN(res.data.id);
      
      setSelectedInvoice(null);
      fetchRecentCreditNotes();
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to save return");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate(-1)}><ArrowLeft className="w-4 h-4 mr-2" />Back</Button>
          <h1 className="text-2xl font-bold">Sales Return (Credit Note)</h1>
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 space-y-6">
          <Card className="border-emerald-100 shadow-sm">
            <CardHeader><CardTitle className="text-sm font-semibold flex items-center gap-2"><Search className="w-4 h-4 text-emerald-600" /> Search Original Invoice</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex flex-col md:flex-row gap-4 items-end">
                  <div className="flex-1 space-y-1.5">
                    <Label className="text-[10px] uppercase font-bold text-slate-400">Search Invoice</Label>
                    <Input 
                      placeholder="Invoice #, Name, or Mobile" 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                      className="h-10"
                    />
                  </div>
                  <div className="flex gap-2 items-end">
                    <div className="space-y-1.5">
                      <Label className="text-[10px] uppercase font-bold text-slate-400">From</Label>
                      <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="h-10 text-xs w-32" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[10px] uppercase font-bold text-slate-400">To</Label>
                      <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="h-10 text-xs w-32" />
                    </div>
                  </div>
                  <Button onClick={handleSearch} disabled={loading} className="bg-emerald-600 hover:bg-emerald-700 h-10 px-6">
                    {loading ? <RefreshCcw className="w-4 h-4 animate-spin mr-2" /> : <Search className="w-4 h-4 mr-2" />}
                    Search
                  </Button>
                </div>

                {invoices.length > 0 && (
                  <div className="mt-4 border rounded-lg overflow-hidden max-h-[300px] overflow-y-auto">
                    <Table>
                      <TableHeader className="bg-slate-50 sticky top-0 z-10">
                        <TableRow>
                          <TableHead>Invoice #</TableHead>
                          <TableHead>Customer</TableHead>
                          <TableHead className="text-right">Amount</TableHead>
                          <TableHead></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {invoices.map((inv) => (
                          <TableRow key={inv.id} className="hover:bg-emerald-50/30 cursor-pointer" onClick={() => selectInvoice(inv)}>
                            <TableCell className="font-mono font-bold">{inv.invoice_number}</TableCell>
                            <TableCell>
                              <div className="font-medium">{inv.Customer?.name}</div>
                              {inv.Customer?.phone && <div className="text-[10px] text-slate-400">{inv.Customer.phone}</div>}
                            </TableCell>
                            <TableCell className="text-right font-bold">{formatCurrency(inv.total_amount)}</TableCell>
                            <TableCell className="text-right">
                              <Button size="sm" variant="ghost" className="text-emerald-600 hover:bg-emerald-50">Select</Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {selectedInvoice && (
            <form onSubmit={handleSubmit} className="space-y-6 animate-in slide-in-from-bottom-4 duration-500 pb-20">
              <Card>
                <CardHeader className="bg-slate-50/50 flex flex-row items-center justify-between">
                  <CardTitle className="text-sm">Processing Return for: <span className="font-mono text-emerald-700">{selectedInvoice.invoice_number}</span></CardTitle>
                  <Button type="button" variant="ghost" size="sm" onClick={() => setSelectedInvoice(null)} className="text-rose-500">Cancel Selection</Button>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4 mt-4">
                  <div className="space-y-2">
                    <Label>Reason for Return</Label>
                    <Select value={formData.reason} onValueChange={(v) => setFormData({...formData, reason: v})}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Damaged">Damaged Goods</SelectItem>
                        <SelectItem value="Wrong Item">Wrong Item Sent</SelectItem>
                        <SelectItem value="Customer Dissatisfied">Customer Dissatisfied</SelectItem>
                        <SelectItem value="Expired">Expired Product</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Customer</Label>
                    <div className="p-2 bg-slate-50 rounded-md border text-sm font-medium flex items-center gap-2">
                      <User className="w-3.5 h-3.5 text-slate-400" /> {selectedInvoice.Customer?.name}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Invoice Date</Label>
                    <div className="p-2 bg-slate-50 rounded-md border text-sm flex items-center gap-2">
                      <CalendarIcon className="w-3.5 h-3.5 text-slate-400" /> {new Date(selectedInvoice.invoice_date).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Total Refund (Computed)</Label>
                    <div className="p-2 bg-emerald-50 rounded-md border border-emerald-100 text-sm font-bold text-emerald-700">
                      {formatCurrency(calculateTotals())}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle className="text-sm">Items from Invoice</CardTitle></CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader className="bg-slate-50">
                      <TableRow>
                        <TableHead>Item</TableHead>
                        <TableHead className="text-center">Sold</TableHead>
                        <TableHead className="text-center w-24">Return</TableHead>
                        <TableHead className="text-right w-28">Rate</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {formData.items.map((item, idx) => (
                        <TableRow key={idx}>
                          <TableCell className="text-xs font-medium">{item.product_name}</TableCell>
                          <TableCell className="text-center text-xs">{item.original_quantity}</TableCell>
                          <TableCell>
                            <Input 
                              type="number" 
                              value={item.quantity}
                              onChange={(e) => updateItemField(idx, 'quantity', e.target.value)}
                              className="h-8 text-center font-bold text-emerald-600 px-1"
                            />
                          </TableCell>
                          <TableCell>
                            <Input 
                              type="number" 
                              value={item.unit_price}
                              onChange={(e) => updateItemField(idx, 'unit_price', e.target.value)}
                              className="h-8 text-right px-1"
                            />
                          </TableCell>
                          <TableCell className="text-right text-xs font-mono font-bold">{formatCurrency(item.total)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              <div className="flex justify-end gap-4">
                <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 px-8 py-6" disabled={loading}>
                  <Save className="w-4 h-4 mr-2" />
                  Save Return & Download PDF
                </Button>
              </div>
            </form>
          )}
        </div>

        <div className="lg:col-span-4 space-y-6">
          <Card className="border-blue-100 shadow-sm">
            <CardHeader className="bg-blue-50/50 pb-3">
              <CardTitle className="text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                <FileText className="w-3.5 h-3.5 text-blue-600" />
                Recent Credit Notes
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y max-h-[600px] overflow-y-auto">
                {recentCreditNotes.length === 0 ? (
                  <p className="p-8 text-center text-xs text-slate-400 italic">No recent returns found</p>
                ) : (
                  recentCreditNotes.map((cn) => (
                    <div key={cn.id} className="p-4 hover:bg-slate-50 transition-colors">
                      <div className="flex justify-between items-start mb-1">
                        <span className="text-[11px] font-mono font-black text-slate-900">{cn.credit_note_number}</span>
                        <span className="text-[10px] text-slate-400">{new Date(cn.date).toLocaleDateString()}</span>
                      </div>
                      <div className="text-xs font-bold text-slate-700 mb-2 truncate">{cn.Customer?.name}</div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-black text-emerald-600">{formatCurrency(cn.total_amount)}</span>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-blue-600" onClick={() => downloadCN(cn.id)}>
                          <Download className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SalesReturnPage;
