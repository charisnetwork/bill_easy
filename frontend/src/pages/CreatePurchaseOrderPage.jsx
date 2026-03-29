import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supplierAPI, productAPI, purchaseOrderAPI } from '../services/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '../components/ui/card';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '../components/ui/table';
import {
  Popover, PopoverContent, PopoverTrigger
} from '../components/ui/popover';
import {
  Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList
} from '../components/ui/command';
import { Plus, Trash2, Save, Loader2, ArrowLeft, Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '../lib/utils';
import { toast } from 'sonner';

const CreatePurchaseOrderPage = ({ isEdit = false }) => {
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
    po_date: new Date().toISOString().split('T')[0],
    expected_date: '',
    po_number: '',
    items: [],
    notes: '',
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
          const poRes = await purchaseOrderAPI.get(id);
          const p = poRes.data;
          setFormData({
            supplier_id: p.supplier_id,
            po_date: p.po_date.split('T')[0],
            expected_date: p.expected_date ? p.expected_date.split('T')[0] : '',
            po_number: p.po_number,
            items: p.items.map(item => ({
              product_id: item.product_id,
              quantity: item.quantity,
              unit_price: item.unit_price,
              tax_rate: item.tax_rate,
              total: item.total
            })),
            notes: p.notes || '',
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

  const calculateTotal = () => {
    return formData.items.reduce((sum, item) => sum + (parseFloat(item.total) || 0), 0);
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
        await purchaseOrderAPI.update(id, formData);
        toast.success('Purchase Order updated successfully');
      } else {
        await purchaseOrderAPI.create(formData);
        toast.success('Purchase Order created successfully');
      }
      navigate('/purchase/po-list');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to save PO');
    } finally {
      setLoading(false);
    }
  };

  if (fetchingData) return <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin" /></div>;

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/purchase/po-list')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">{isEdit ? 'Edit Purchase Order' : 'New Purchase Order'}</h1>
            <p className="text-slate-500">Create a request for items from your supplier</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">PO Details</CardTitle>
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
                <Label>PO Number</Label>
                <Input placeholder="Auto-generated if empty" value={formData.po_number} onChange={(e) => setFormData({ ...formData, po_number: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>PO Date</Label>
                <Input 
                  type="date" 
                  value={formData.po_date} 
                  onChange={(e) => setFormData({...formData, po_date: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label>Expected Delivery Date</Label>
                <Input type="date" value={formData.expected_date} onChange={(e) => setFormData({ ...formData, expected_date: e.target.value })} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Items to Order</CardTitle>
              <Button type="button" onClick={() => addItem()} size="sm" className="bg-indigo-600 hover:bg-indigo-700">
                <Plus className="w-4 h-4 mr-1" /> Add Row
              </Button>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-6 w-[45%]">Product</TableHead>
                    <TableHead className="w-[15%] text-right">Qty</TableHead>
                    <TableHead className="w-[20%] text-right">Estimated Price</TableHead>
                    <TableHead className="w-[15%] text-right">Total</TableHead>
                    <TableHead className="w-[5%]"></TableHead>
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
                                        {p.name}
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
                          ₹{parseFloat(item.total || 0).toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right pr-6">
                          <Button variant="ghost" size="icon" onClick={() => removeItem(index)} className="text-red-500 hover:text-red-700">
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
              <CardTitle className="text-lg">PO Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="pt-4 border-t border-slate-200">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-900">Total Amount</span>
                  <span className="text-xl font-bold text-indigo-700 font-mono">
                    ₹{calculateTotal().toFixed(2)}
                  </span>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-3">
              <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 py-6 text-lg" disabled={loading}>
                {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Save className="w-5 h-5 mr-2" />}
                Generate PO
              </Button>
              <Button type="button" variant="ghost" className="w-full text-slate-500" onClick={() => navigate('/purchase/po-list')}>
                Cancel
              </Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Terms & Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <textarea
                className="w-full h-32 p-3 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
                placeholder="Standard terms and conditions..."
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

export default CreatePurchaseOrderPage;
