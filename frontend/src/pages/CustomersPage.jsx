import React, { useState, useEffect } from 'react';
import { customerAPI, creditNoteAPI, utilityAPI } from '../services/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter
} from '../components/ui/dialog';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription
} from '../components/ui/sheet';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '../components/ui/table';
import { Plus, Search, Edit, Trash2, Users, Phone, Mail, IndianRupee, Wallet, FileText, Download, Calendar, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2
  }).format(amount || 0);
};

const CustomerForm = ({ customer, onSave, onClose }) => {
  const [formData, setFormData] = useState({
    name: customer?.name || '',
    phone: customer?.phone || '',
    email: customer?.email || '',
    gst_number: customer?.gst_number || '',
    address: customer?.address || '',
    city: customer?.city || '',
    state: customer?.state || '',
    pincode: customer?.pincode || ''
  });
  const [loading, setLoading] = useState(false);
  const [gstLoading, setGstLoading] = useState(false);

  const handleGstLookup = async () => {
    const gstin = formData.gst_number;
    if (!gstin || gstin.length !== 15) {
      toast.error("Please enter a valid 15-digit GSTIN");
      return;
    }

    setGstLoading(true);
    try {
      const { data } = await utilityAPI.getGST(gstin);
      if (data) {
        toast.success("GST details fetched successfully");
        const addr = data.address_details || {};
        const fullAddr = `${addr.building_name || ''}, ${addr.street || ''}, ${addr.location || ''}`.replace(/^, /, '').replace(/, , /g, ', ');
        
        setFormData(prev => ({
          ...prev,
          gst_number: data.gstin,
          name: data.legal_name || data.trade_name || prev.name,
          address: fullAddr || prev.address,
          city: addr.city || prev.city,
          state: addr.state || prev.state,
          pincode: addr.pincode || prev.pincode
        }));
      }
    } catch (error) {
      console.error("GST Lookup Error:", error);
      toast.error(error.response?.data?.error || "Could not find details for this GSTIN. Please enter manually.");
    } finally {
      setGstLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (customer?.id) {
        await customerAPI.update(customer.id, formData);
        toast.success('Customer updated');
      } else {
        await customerAPI.create(formData);
        toast.success('Customer created');
      }
      onSave();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Operation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2 space-y-2">
          <Label>Name *</Label>
          <Input
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
        </div>
        <div className="space-y-2">
          <Label>Phone</Label>
          <Input
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label>Email</Label>
          <Input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />
        </div>
        <div className="col-span-2 space-y-2">
          <Label>GST Number</Label>
          <div className="relative">
            <Input
              value={formData.gst_number}
              onChange={(e) => setFormData({ ...formData, gst_number: e.target.value.toUpperCase() })}
              className="pr-12 font-mono"
              placeholder="22AAAAA0000A1Z5"
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1 h-8 w-8 p-0 text-emerald-600 hover:text-emerald-700"
              onClick={handleGstLookup}
              disabled={gstLoading}
            >
              {gstLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
        <div className="col-span-2 space-y-2">
          <Label>Address</Label>
          <Input
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label>City</Label>
          <Input
            value={formData.city}
            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label>State</Label>
          <Input
            value={formData.state}
            onChange={(e) => setFormData({ ...formData, state: e.target.value })}
          />
        </div>
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
        <Button type="submit" disabled={loading} className="bg-emerald-600 hover:bg-emerald-700">
          {loading ? 'Saving...' : 'Save'}
        </Button>
      </DialogFooter>
    </form>
  );
};

const CustomerDetails = ({ customer, onClose }) => {
  const [creditNotes, setCreditNotes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCN = async () => {
      try {
        const res = await creditNoteAPI.getAll({ customer_id: customer.id, limit: 100 });
        setCreditNotes(res.data.creditNotes);
      } catch (e) {
        toast.error("Failed to load credit notes");
      } finally {
        setLoading(false);
      }
    };
    if (customer?.id) fetchCN();
  }, [customer]);

  const downloadCN = (id) => {
    const token = localStorage.getItem('token');
    window.open(`${process.env.REACT_APP_BACKEND_URL}/api/credit-notes/${id}/pdf?token=${token}`, "_blank");
  };

  return (
    <div className="space-y-8 py-6 h-full overflow-y-auto pr-2">
      <div className="space-y-1">
        <h2 className="text-2xl font-bold text-slate-900">{customer.name}</h2>
        <div className="flex items-center gap-4 text-sm text-slate-500">
          {customer.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {customer.phone}</span>}
          {customer.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {customer.email}</span>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card className="bg-amber-50 border-amber-100">
          <CardHeader className="pb-2"><CardTitle className="text-xs uppercase tracking-wider text-amber-700">Outstanding</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-black text-amber-600 font-mono">{formatCurrency(customer.outstanding_balance)}</p></CardContent>
        </Card>
        <Card className="bg-emerald-50 border-emerald-100">
          <CardHeader className="pb-2"><CardTitle className="text-xs uppercase tracking-wider text-emerald-700">Wallet Balance</CardTitle></CardHeader>
          <CardContent>
            <p className="text-2xl font-black text-emerald-600 font-mono">{formatCurrency(customer.wallet_balance)}</p>
            <p className="text-[10px] text-emerald-600 mt-1 italic">Can be used for future billing</p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-widest flex items-center gap-2 text-slate-400 border-b pb-2">
          <FileText className="w-4 h-4" /> Credit Notes (Sales Returns)
        </h3>
        
        {loading ? (
          <div className="flex justify-center p-8"><RefreshCcw className="w-6 h-6 animate-spin text-slate-200" /></div>
        ) : creditNotes.length === 0 ? (
          <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-200">
            <p className="text-sm text-slate-400">No returns recorded for this customer</p>
          </div>
        ) : (
          <div className="space-y-3">
            {creditNotes.map((cn) => (
              <div key={cn.id} className="p-4 bg-white border border-slate-100 rounded-lg shadow-sm hover:shadow-md transition-all flex items-center justify-between group">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded">{cn.credit_note_number}</span>
                    <span className="text-[10px] text-slate-400 flex items-center gap-1"><Calendar className="w-2.5 h-2.5" /> {new Date(cn.date).toLocaleDateString()}</span>
                  </div>
                  <div className="text-[10px] text-slate-500">Ref Invoice: <span className="font-mono">{cn.Invoice?.invoice_number}</span></div>
                  <div className="text-sm font-black text-emerald-600">{formatCurrency(cn.total_amount)}</div>
                </div>
                <Button variant="ghost" size="icon" className="text-slate-400 group-hover:text-blue-600" onClick={() => downloadCN(cn.id)}>
                  <Download className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-widest flex items-center gap-2 text-slate-400 border-b pb-2">
          Address & GST
        </h3>
        <div className="text-sm text-slate-600 space-y-2">
          <div><Label className="text-[10px] uppercase text-slate-400">GSTIN</Label><p className="font-medium text-slate-900">{customer.gst_number || 'N/A'}</p></div>
          <div><Label className="text-[10px] uppercase text-slate-400">Full Address</Label><p className="font-medium text-slate-900 leading-relaxed">{customer.address || 'N/A'}<br/>{customer.city}, {customer.state} - {customer.pincode}</p></div>
        </div>
      </div>
    </div>
  );
};

const RefreshCcw = ({ className }) => <FileText className={className} />; // Placeholder for missing import fix

export const CustomersPage = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [viewingCustomer, setViewCustomer] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchCustomers = async () => {
    try {
      const response = await customerAPI.getAll({ search, page, limit: 20 });
      setCustomers(response.data.customers);
      setTotalPages(response.data.totalPages);
    } catch (error) {
      toast.error('Failed to load customers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [search, page]);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this customer?')) return;
    try {
      await customerAPI.delete(id);
      toast.success('Customer deleted');
      fetchCustomers();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Delete failed');
    }
  };

  const handleEdit = (customer) => {
    setSelectedCustomer(customer);
    setDialogOpen(true);
  };

  const openDetails = (customer) => {
    setViewCustomer(customer);
    setDetailsOpen(true);
  };

  const handleSave = () => {
    setDialogOpen(false);
    setSelectedCustomer(null);
    fetchCustomers();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl md:text-3xl font-bold text-slate-900">Customers</h1>
          <p className="text-slate-600">Manage your customer database</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              className="bg-emerald-600 hover:bg-emerald-700"
              onClick={() => setSelectedCustomer(null)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Customer
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{selectedCustomer ? 'Edit Customer' : 'Add Customer'}</DialogTitle>
            </DialogHeader>
            <CustomerForm
              customer={selectedCustomer}
              onSave={handleSave}
              onClose={() => setDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search customers..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : customers.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-600">No customers found</p>
            </div>
          ) : (
            <Table className="data-table">
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead className="text-right">Outstanding</TableHead>
                  <TableHead className="text-right">Wallet</TableHead>
                  <TableHead className="w-24 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customers.map((customer) => (
                  <TableRow key={customer.id}>
                    <TableCell>
                      <button 
                        onClick={() => openDetails(customer)}
                        className="text-left group hover:bg-emerald-50/50 p-1 -m-1 rounded-lg transition-colors"
                      >
                        <div className="font-bold text-slate-900 group-hover:text-emerald-700 underline underline-offset-4 decoration-emerald-200">{customer.name}</div>
                        {customer.city && (
                          <div className="text-[10px] text-slate-400">{customer.city}</div>
                        )}
                      </button>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {customer.phone && (
                          <div className="flex items-center gap-1 text-[11px] text-slate-600 font-medium">
                            <Phone className="w-2.5 h-2.5 text-slate-400" />
                            {customer.phone}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className={`font-mono font-bold ${parseFloat(customer.outstanding_balance) > 0 ? 'text-amber-600' : 'text-slate-900'}`}>
                        {formatCurrency(customer.outstanding_balance)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className={`font-mono font-bold ${parseFloat(customer.wallet_balance || 0) > 0 ? 'text-emerald-600' : 'text-slate-900'}`}>
                        {formatCurrency(customer.wallet_balance || 0)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-blue-600"
                          onClick={() => handleEdit(customer)}
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                          onClick={() => handleDelete(customer.id)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
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

      <Sheet open={detailsOpen} onOpenChange={setDetailsOpen}>
        <SheetContent className="sm:max-w-xl">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2"><Users className="w-5 h-5 text-emerald-600" /> Customer Account Statement</SheetTitle>
            <SheetDescription>View complete history, wallet balance, and credit notes.</SheetDescription>
          </SheetHeader>
          {viewingCustomer && <CustomerDetails customer={viewingCustomer} onClose={() => setDetailsOpen(false)} />}
        </SheetContent>
      </Sheet>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Previous
          </Button>
          <span className="text-xs text-slate-500 font-medium">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
};

export default CustomersPage;
