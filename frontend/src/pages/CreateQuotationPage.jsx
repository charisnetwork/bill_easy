import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { quotationAPI, customerAPI, productAPI, companyAPI } from '../services/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Textarea } from '../components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '../components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '../components/ui/table';
import { ArrowLeft, Plus, Trash2, Save } from 'lucide-react';
import { toast } from 'sonner';
import { getIndustryConfig } from '../lib/industryConfig';

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2
  }).format(amount || 0);
};

export const CreateQuotationPage = ({ isEdit = false }) => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [industryConfig, setIndustryConfig] = useState(getIndustryConfig('General Store'));
  
  const [formData, setFormData] = useState({
    customer_id: '',
    quotation_number: '',
    quotation_date: new Date().toISOString().split('T')[0],
    valid_until: '',
    notes: '',
    terms: '',
    items: [],
    industry_metadata: {}
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [customersRes, productsRes, companyRes] = await Promise.all([
          customerAPI.getAll({ limit: 1000 }),
          productAPI.getAll({ limit: 1000 }),
          companyAPI.get()
        ]);
        setCustomers(customersRes.data.customers);
        setProducts(productsRes.data.products);
        
        const selectedIndustry = companyRes.data.business_category || 'General Store';
        setIndustryConfig(getIndustryConfig(selectedIndustry));

        if (companyRes.data.terms_conditions) {
          setFormData(prev => ({ ...prev, terms: companyRes.data.terms_conditions }));
        }

        if (isEdit && id) {
          const res = await quotationAPI.get(id);
          const q = res.data;
          setFormData({
            customer_id: q.customer_id,
            quotation_number: q.quotation_number,
            quotation_date: q.quotation_date.split('T')[0],
            valid_until: q.valid_until ? q.valid_until.split('T')[0] : '',
            notes: q.notes || '',
            terms: q.terms || '',
            industry_metadata: q.industry_metadata || {},
            items: q.items.map(item => ({
              product_id: item.product_id,
              quantity: item.quantity,
              unit_price: item.unit_price,
              tax_rate: item.tax_rate || 18,
              description: item.description || ''
            }))
          });
        } else {
          const nextNumRes = await quotationAPI.getNextNumber();
          setFormData(prev => ({ ...prev, quotation_number: nextNumRes.data.quotation_number }));
        }
      } catch (error) {
        toast.error('Failed to load data');
      }
    };
    fetchData();
  }, [id, isEdit]);

  const addItem = () => {
    setFormData({
      ...formData,
      items: [
        ...formData.items,
        { product_id: '', quantity: 1, unit_price: 0, tax_rate: 18, description: '' }
      ]
    });
  };

  const removeItem = (index) => {
    setFormData({
      ...formData,
      items: formData.items.filter((_, i) => i !== index)
    });
  };

  const updateItem = (index, field, value) => {
    const newItems = [...formData.items];
    
    if (field === 'product_id') {
      const product = products.find(p => p.id === value);
      if (product) {
        if (product.type === 'product' && parseFloat(product.stock_quantity) <= 0) {
          toast.error(`${product.name} is out of stock!`);
          return;
        }
        newItems[index][field] = value;
        newItems[index].unit_price = parseFloat(product.sale_price);
        newItems[index].tax_rate = parseFloat(product.gst_rate);
      }
    } else if (field === 'quantity') {
      const product = products.find(p => p.id === newItems[index].product_id);
      if (product && product.type === 'product') {
        if (parseFloat(value) > parseFloat(product.stock_quantity)) {
          toast.error(`Only ${product.stock_quantity} units available in stock`);
          newItems[index][field] = product.stock_quantity;
        } else {
          newItems[index][field] = value;
        }
      } else {
        newItems[index][field] = value;
      }
    } else {
      newItems[index][field] = value;
    }
    
    setFormData({ ...formData, items: newItems });
  };

  const calculateTotals = () => {
    const items = formData.items;
    let subtotal = 0;
    let taxAmount = 0;
    
    items.forEach(item => {
      const qty = parseFloat(item.quantity) || 0;
      const price = parseFloat(item.unit_price) || 0;
      const taxRate = parseFloat(item.tax_rate) || 0;
      
      const itemSubtotal = (qty * price);
      const itemTax = (itemSubtotal * taxRate) / 100;
      
      subtotal += itemSubtotal;
      taxAmount += itemTax;
    });

    return {
      subtotal,
      taxAmount,
      total: subtotal + taxAmount
    };
  };

  const totals = calculateTotals();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.customer_id) return toast.error('Please select a customer');
    if (formData.items.length === 0) return toast.error('Please add at least one item');

    setLoading(true);
    try {
      const payload = {
        ...formData,
        customer_id: formData.customer_id || null,
        godown_id: formData.godown_id || null,
      };

      if (isEdit) {
        await quotationAPI.update(id, payload);
        toast.success('Quotation updated');
      } else {
        await quotationAPI.create(payload);
        toast.success('Quotation created');
      }
      navigate('/quotations');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to save quotation');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate('/quotations')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <h1 className="font-heading text-2xl md:text-3xl font-bold text-slate-900">{isEdit ? 'Edit' : 'Create'} Quotation</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader><CardTitle>Quotation Details</CardTitle></CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{industryConfig.labels.customer} *</Label>
                <Select value={formData.customer_id} onValueChange={(v) => setFormData({ ...formData, customer_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Select customer" /></SelectTrigger>
                  <SelectContent>
                    {customers.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Quotation #</Label>
                <Input value={formData.quotation_number} onChange={(e) => setFormData({ ...formData, quotation_number: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Date</Label>
                <Input type="date" value={formData.quotation_date} onChange={(e) => setFormData({ ...formData, quotation_date: e.target.value })} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Summary</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between"><span>Subtotal</span><span className="font-mono">{formatCurrency(totals.subtotal)}</span></div>
              <div className="flex justify-between"><span>Tax</span><span className="font-mono">{formatCurrency(totals.taxAmount)}</span></div>
              <div className="border-t pt-3 flex justify-between font-bold"><span>Total</span><span className="text-xl font-mono">{formatCurrency(totals.total)}</span></div>
            </CardContent>
          </Card>
        </div>

        {/* Industry Specific Extra Fields */}
        {industryConfig.extraFields.length > 0 && (
          <Card>
            <CardHeader><CardTitle>Additional Information</CardTitle></CardHeader>
            <CardContent className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {industryConfig.extraFields.map((field) => (
                <div key={field.name} className="space-y-2">
                  <Label>{field.label}</Label>
                  {field.type === 'textarea' ? (
                    <Textarea
                      value={formData.industry_metadata[field.name] || ''}
                      onChange={(e) => setFormData({
                        ...formData,
                        industry_metadata: { ...formData.industry_metadata, [field.name]: e.target.value }
                      })}
                      placeholder={field.label}
                    />
                  ) : (
                    <Input
                      type={field.type}
                      value={formData.industry_metadata[field.name] || ''}
                      onChange={(e) => setFormData({
                        ...formData,
                        industry_metadata: { ...formData.industry_metadata, [field.name]: e.target.value }
                      })}
                      placeholder={field.label}
                    />
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Items</CardTitle>
            <Button type="button" variant="outline" onClick={addItem}><Plus className="w-4 h-4 mr-2" />Add Item</Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{industryConfig.labels.itemName}</TableHead>
                  <TableHead>{industryConfig.labels.qty}</TableHead>
                  <TableHead>{industryConfig.labels.price}</TableHead>
                  <TableHead>Tax%</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {formData.items.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <Select value={item.product_id} onValueChange={(v) => updateItem(index, 'product_id', v)}>
                        <SelectTrigger><SelectValue placeholder="Select product" /></SelectTrigger>
                        <SelectContent>
                          {products.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell><Input type="number" value={item.quantity} onChange={(e) => updateItem(index, 'quantity', e.target.value)} className="w-20" /></TableCell>
                    <TableCell><Input type="number" value={item.unit_price} onChange={(e) => updateItem(index, 'unit_price', e.target.value)} className="w-24" /></TableCell>
                    <TableCell>
                      <Select value={String(item.tax_rate)} onValueChange={(v) => updateItem(index, 'tax_rate', v)}>
                        <SelectTrigger className="w-20"><SelectValue /></SelectTrigger>
                        <SelectContent><SelectItem value="0">0%</SelectItem><SelectItem value="5">5%</SelectItem><SelectItem value="12">12%</SelectItem><SelectItem value="18">18%</SelectItem><SelectItem value="28">28%</SelectItem></SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-right font-mono">{formatCurrency((parseFloat(item.quantity || 0) * parseFloat(item.unit_price || 0)) * (1 + parseFloat(item.tax_rate || 0)/100))}</TableCell>
                    <TableCell><Button type="button" variant="ghost" size="icon" onClick={() => removeItem(index)}><Trash2 className="w-4 h-4 text-red-500" /></Button></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={() => navigate('/quotations')}>Cancel</Button>
          <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700" disabled={loading}>
            <Save className="w-4 h-4 mr-2" />
            {loading ? 'Saving...' : (isEdit ? 'Update Quotation' : 'Create Quotation')}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default CreateQuotationPage;
