import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { purchaseAPI, supplierAPI, productAPI, companyAPI } from '../services/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '../components/ui/card';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '../components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '../components/ui/table';
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter, DialogTrigger
} from '../components/ui/dialog';
import {
  Popover, PopoverContent, PopoverTrigger
} from '../components/ui/popover';
import {
  Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList
} from '../components/ui/command';
import { Plus, Trash2, Camera, FileText, Upload, Save, X, Loader2, ArrowLeft, Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '../lib/utils';
import { toast } from 'sonner';

const CreatePurchasePage = ({ isEdit = false }) => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(true);
  const [openIndex, setOpenIndex] = useState(null);
  const [supplierOpen, setSupplierOpen] = useState(false);

  const [formData, setFormData] = useState({
    supplier_id: '',
    bill_date: new Date().toISOString().split('T')[0],
    due_date: '',
    bill_number: '',
    items: [],
    discount_amount: 0,
    notes: '',
    paid_amount: 0,
    payment_method: 'Cash'
  });

  // For "Add New Item" dialog
  const [newItemDialogOpen, setNewItemDialogOpen] = useState(false);
  const [newItemData, setNewItemData] = useState({
    name: '',
    purchase_price: 0,
    sale_price: 0,
    gst_rate: 18,
    unit: 'pcs'
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [suppliersRes, productsRes] = await Promise.all([
          supplierAPI.getAll({ limit: 1000 }),
          productAPI.getAll({ limit: 1000 })
        ]);
        setSuppliers(suppliersRes.data.suppliers || []);
        setProducts(productsRes.data.products || []);

        if (isEdit && id) {
          const purchaseRes = await purchaseAPI.get(id);
          const p = purchaseRes.data;
          setFormData({
            supplier_id: p.supplier_id,
            bill_date: p.bill_date.split('T')[0],
            due_date: p.due_date ? p.due_date.split('T')[0] : '',
            bill_number: p.bill_number,
            items: p.items.map(item => ({
              product_id: item.product_id,
              quantity: item.quantity,
              unit_price: item.unit_price,
              tax_rate: item.tax_rate,
              total: item.total
            })),
            discount_amount: p.discount_amount,
            notes: p.notes || '',
            paid_amount: p.paid_amount,
            payment_method: 'Cash'
          });
        }
      } catch (error) {
        toast.error('Failed to load initial data');
      } finally {
        setFetchingData(false);
      }
    };
    fetchData();
  }, [id, isEdit]);

  const addItem = (productData = null) => {
    const newItem = productData 
      ? { 
          product_id: productData.id, 
          quantity: 1, 
          unit_price: parseFloat(productData.purchase_price) || 0, 
          tax_rate: parseFloat(productData.gst_rate) || 18, 
          total: (parseFloat(productData.purchase_price) || 0) * (1 + (parseFloat(productData.gst_rate) || 18) / 100) 
        }
      : { product_id: '', quantity: 1, unit_price: 0, tax_rate: 18, total: 0 };

    setFormData(prev => ({
      ...prev,
      items: [...prev.items, newItem]
    }));
  };

  const removeItem = (index) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const updateItem = (index, field, value) => {
    const newItems = [...formData.items];
    newItems[index][field] = value;

    if (field === 'product_id') {
      const product = products.find(p => p.id === value);
      if (product) {
        newItems[index].unit_price = parseFloat(product.purchase_price) || 0;
        newItems[index].tax_rate = parseFloat(product.gst_rate) || 0;
      }
    }

    // Recalculate item total
    const qty = parseFloat(newItems[index].quantity) || 0;
    const price = parseFloat(newItems[index].unit_price) || 0;
    const tax = (qty * price * (parseFloat(newItems[index].tax_rate) || 0)) / 100;
    newItems[index].total = (qty * price) + tax;

    setFormData(prev => ({ ...prev, items: newItems }));
  };

  const calculateSubtotal = () => {
    return formData.items.reduce((sum, item) => {
      const qty = parseFloat(item.quantity) || 0;
      const price = parseFloat(item.unit_price) || 0;
      return sum + (qty * price);
    }, 0);
  };

  const calculateTax = () => {
    return formData.items.reduce((sum, item) => {
      const qty = parseFloat(item.quantity) || 0;
      const price = parseFloat(item.unit_price) || 0;
      const taxRate = parseFloat(item.tax_rate) || 0;
      return sum + (qty * price * taxRate / 100);
    }, 0);
  };

  const calculateTotal = () => {
    return calculateSubtotal() + calculateTax() - parseFloat(formData.discount_amount || 0);
  };

  const handleCreateNewItem = async () => {
    if (!newItemData.name || !newItemData.sale_price) {
      toast.error('Name and Sale Price are required');
      return;
    }
    try {
      const res = await productAPI.create(newItemData);
      const newProduct = res.data.product;
      setProducts(prev => [...prev, newProduct]);
      
      // Automatically add the new item to the purchase list
      addItem(newProduct);
      
      toast.success('New product added to catalog and purchase list');
      setNewItemDialogOpen(false);
      setNewItemData({ name: '', purchase_price: 0, sale_price: 0, gst_rate: 18, unit: 'pcs' });
    } catch (error) {
      toast.error('Failed to create product');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.supplier_id) {
      toast.error('Please select a supplier');
      return;
    }
    if (formData.items.length === 0) {
      toast.error('Please add at least one item');
      return;
    }
    setLoading(true);
    try {
      if (isEdit) {
        await purchaseAPI.update(id, formData);
        toast.success('Purchase bill updated successfully');
      } else {
        await purchaseAPI.create(formData);
        toast.success('Purchase bill recorded successfully');
      }
      navigate('/purchases');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to save purchase');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const parseLoading = toast.loading(`Parsing ${file.name}...`);
    try {
      const uploadFormData = new FormData();
      uploadFormData.append('file', file);
      
      const res = await purchaseAPI.parsePDF(uploadFormData);
      const { items: parsedItems, bill_number, bill_date } = res.data;
      
      // Robust Date Parsing Helper
      const safeParseDate = (dateStr) => {
        if (!dateStr) return new Date();
        
        try {
          // Attempt standard parsing
          let d = new Date(dateStr);
          
          // Handle Indian Formats (DD-MM-YYYY or DD/MM/YYYY) if standard fails or is ambiguous
          if (isNaN(d.getTime()) || dateStr.includes('-') || dateStr.includes('/')) {
            const parts = dateStr.split(/[-/]/);
            if (parts.length === 3) {
              // Assume DD-MM-YYYY if first part is <= 31 and last is 4 digits
              if (parseInt(parts[0]) <= 31 && parts[2].length === 4) {
                d = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
              }
            }
          }
          
          if (isNaN(d.getTime())) throw new Error("Invalid Date");
          return d;
        } catch (e) {
          console.warn("Date detection failed, falling back to today:", dateStr);
          toast.info("Could not detect date, please verify manually.", { duration: 5000 });
          return new Date();
        }
      };

      const finalDate = safeParseDate(bill_date);
      
      setFormData(prev => ({
        ...prev,
        bill_number: bill_number || prev.bill_number,
        bill_date: finalDate.toISOString().split('T')[0],
        items: [...prev.items, ...(parsedItems || [])]
      }));

      if (parsedItems && parsedItems.length > 0) {
        toast.success(res.data.message, { id: parseLoading });
      } else {
        toast.info(res.data.message, { id: parseLoading });
      }
    } catch (error) {
      console.error('PDF parsing error:', error);
      toast.error('Failed to parse PDF', { id: parseLoading });
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/purchases')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">{isEdit ? 'Edit Purchase Bill' : 'New Purchase Bill'}</h1>
            <p className="text-slate-500">{isEdit ? 'Update existing purchase record' : 'Record a new purchase from your supplier'}</p>
          </div>
        </div>
        {!isEdit && (
          <div className="flex gap-2">
            <div className="relative">
              <Button variant="outline" asChild>
                <label className="cursor-pointer">
                  <Upload className="w-4 h-4 mr-2" /> Upload PDF Bill
                  <input type="file" accept="application/pdf,image/*" className="hidden" onChange={handleFileUpload} />
                </label>
              </Button>
            </div>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Bill Details</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Supplier *</Label>
                <Popover open={supplierOpen} onOpenChange={setSupplierOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" role="combobox" aria-expanded={supplierOpen} className="w-full justify-between font-normal">
                      {formData.supplier_id 
                        ? suppliers.find(s => s.id === formData.supplier_id)?.name 
                        : "Select supplier..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[400px] p-0">
                    <Command>
                      <CommandInput placeholder="Search supplier..." />
                      <CommandList>
                        <CommandEmpty>No supplier found.</CommandEmpty>
                        <CommandGroup>
                          {suppliers.map((s) => (
                            <CommandItem
                              key={s.id}
                              value={s.name}
                              onSelect={() => {
                                setFormData({ ...formData, supplier_id: s.id });
                                setSupplierOpen(false);
                              }}
                            >
                              <Check className={cn("mr-2 h-4 w-4", formData.supplier_id === s.id ? "opacity-100" : "opacity-0")} />
                              {s.name}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label>Bill Number (Optional)</Label>
                <Input placeholder="Enter supplier's bill #" value={formData.bill_number} onChange={(e) => setFormData({ ...formData, bill_number: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Bill Date</Label>
                <Input 
                  type="date" 
                  value={formData.bill_date} 
                  onChange={(e) => setFormData({...formData, bill_date: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label>Due Date</Label>
                <Input type="date" value={formData.due_date} onChange={(e) => setFormData({ ...formData, due_date: e.target.value })} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Line Items</CardTitle>
              <div className="flex gap-2">
                <Dialog open={newItemDialogOpen} onOpenChange={setNewItemDialogOpen}>
                  <DialogTrigger asChild>
                    <Button type="button" variant="outline" size="sm">
                      <Plus className="w-4 h-4 mr-1" /> New Item
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add New Product to Catalog</DialogTitle>
                      <DialogDescription>
                        Create a new product entry to add it to your inventory and this purchase bill.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label>Product Name</Label>
                        <Input value={newItemData.name} onChange={(e) => setNewItemData({ ...newItemData, name: e.target.value })} placeholder="e.g. Blue Pen" />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Purchase Price</Label>
                          <Input type="number" value={newItemData.purchase_price} onChange={(e) => setNewItemData({ ...newItemData, purchase_price: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                          <Label>Sale Price</Label>
                          <Input type="number" value={newItemData.sale_price} onChange={(e) => setNewItemData({ ...newItemData, sale_price: e.target.value })} />
                        </div>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setNewItemDialogOpen(false)}>Cancel</Button>
                      <Button onClick={handleCreateNewItem}>Create Product</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
                <Button type="button" onClick={() => addItem()} size="sm" className="bg-emerald-600 hover:bg-emerald-700">
                  <Plus className="w-4 h-4 mr-1" /> Add Row
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-6 w-[40%]">Product</TableHead>
                    <TableHead className="w-[15%] text-right">Qty</TableHead>
                    <TableHead className="w-[20%] text-right">Price</TableHead>
                    <TableHead className="w-[15%] text-right">Total</TableHead>
                    <TableHead className="w-[10%]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {formData.items.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-slate-500">
                        No items added. Click "Add Row" to start.
                      </TableCell>
                    </TableRow>
                  ) : (
                    formData.items.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell className="pl-6">
                          <Popover open={openIndex === index} onOpenChange={(open) => setOpenIndex(open ? index : null)}>
                            <PopoverTrigger asChild>
                              <Button variant="ghost" role="combobox" aria-expanded={openIndex === index} className="w-full justify-between font-normal px-0 hover:bg-transparent">
                                <span className="truncate">
                                  {item.product_id 
                                    ? products.find(p => p.id === item.product_id)?.name 
                                    : "Search product..."}
                                </span>
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[400px] p-0" align="start">
                              <Command>
                                <CommandInput placeholder="Search product..." />
                                <CommandList>
                                  <CommandEmpty>No product found.</CommandEmpty>
                                  <CommandGroup>
                                    {products.map((p) => (
                                      <CommandItem
                                        key={p.id}
                                        value={p.name}
                                        onSelect={() => {
                                          updateItem(index, 'product_id', p.id);
                                          setOpenIndex(null);
                                        }}
                                      >
                                        <Check className={cn("mr-2 h-4 w-4", item.product_id === p.id ? "opacity-100" : "opacity-0")} />
                                        <div className="flex flex-col">
                                          <span>{p.name}</span>
                                          <span className="text-xs text-slate-500">Price: ₹{p.purchase_price} | Stock: {p.stock_quantity}</span>
                                        </div>
                                      </CommandItem>
                                    ))}
                                  </CommandGroup>
                                </CommandList>
                              </Command>
                            </PopoverContent>
                          </Popover>
                        </TableCell>
                        <TableCell>
                          <Input type="number" className="text-right border-none shadow-none" value={item.quantity} onChange={(e) => updateItem(index, 'quantity', e.target.value)} />
                        </TableCell>
                        <TableCell>
                          <Input type="number" className="text-right border-none shadow-none" value={item.unit_price} onChange={(e) => updateItem(index, 'unit_price', e.target.value)} />
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm">
                          ₹{item.total.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right pr-6">
                          <Button variant="ghost" size="icon" onClick={() => removeItem(index)} className="text-red-500 hover:text-red-700 hover:bg-red-50">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="bg-slate-50 border-slate-200">
            <CardHeader>
              <CardTitle className="text-lg">Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Subtotal</span>
                <span className="font-mono">₹{calculateSubtotal().toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Tax Amount</span>
                <span className="font-mono">₹{calculateTax().toFixed(2)}</span>
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Discount</Label>
                <Input type="number" value={formData.discount_amount} onChange={(e) => setFormData({ ...formData, discount_amount: e.target.value })} />
              </div>
              <div className="pt-4 border-t border-slate-200 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-900">Grand Total</span>
                  <span className="text-xl font-bold text-emerald-700 font-mono">
                    ₹{calculateTotal().toFixed(2)}
                  </span>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-xs">Amount Paid</Label>
                  <Input 
                    type="number" 
                    value={formData.paid_amount} 
                    onChange={(e) => setFormData({ ...formData, paid_amount: e.target.value })} 
                    className="bg-white border-emerald-200 focus:border-emerald-500"
                  />
                </div>

                {parseFloat(formData.paid_amount) > 0 && (
                  <div className="space-y-2">
                    <Label className="text-xs">Payment Method</Label>
                    <Select value={formData.payment_method} onValueChange={(v) => setFormData({ ...formData, payment_method: v })}>
                      <SelectTrigger className="bg-white">
                        <SelectValue placeholder="Select method" />
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
                )}
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-3">
              <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 py-6 text-lg shadow-lg shadow-emerald-100" disabled={loading}>
                {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Save className="w-5 h-5 mr-2" />}
                Save Purchase Bill
              </Button>
              <Button type="button" variant="ghost" className="w-full text-slate-500" onClick={() => navigate('/purchases')}>
                Discard & Cancel
              </Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Additional Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <textarea
                className="w-full h-32 p-3 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-all"
                placeholder="Any specific remarks about this purchase..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </CardContent>
          </Card>
        </div>
      </form>
    </div>
  );
};

export default CreatePurchasePage;
