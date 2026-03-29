import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { invoiceAPI, customerAPI, productAPI, companyAPI } from '../services/api';
import { getIndustryConfig } from '../lib/industryConfig';
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
import { ArrowLeft, Plus, Trash2, Save, Calendar, Wallet } from 'lucide-react';
import { Switch } from '../components/ui/switch';
import { toast } from 'sonner';

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2
  }).format(amount || 0);
};

export const CreateInvoicePage = ({ isEdit = false }) => {
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [industry, setIndustry] = useState('General Store');
  const [industryConfig, setIndustryConfig] = useState(getIndustryConfig('General Store'));
  
  const [formData, setFormData] = useState({
    customer_id: '',
    invoice_date: new Date().toISOString().split('T')[0],
    due_date: '',
    discount: 0,
    discount_type: 'fixed',
    notes: '',
    terms: 'Payment is due within 30 days.',
    items: [],
    extra_fields: {},
    industry_metadata: {},
    eway_bill_number: '',
    use_wallet_balance: false,
    wallet_amount: 0,
    apply_tds: false,
    tds_rate: 0,
    apply_tcs: false,
    tcs_rate: 0
  });

  const [selectedCustomer, setSelectedCustomer] = useState(null);

  useEffect(() => {
    if (formData.customer_id) {
      const cust = customers.find(c => c.id === formData.customer_id);
      setSelectedCustomer(cust);
    } else {
      setSelectedCustomer(null);
    }
  }, [formData.customer_id, customers]);

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
        setIndustry(selectedIndustry);
        setIndustryConfig(getIndustryConfig(selectedIndustry));

        if (companyRes.data.terms_conditions) {
          setFormData(prev => ({ ...prev, terms: companyRes.data.terms_conditions }));
        }

        if (isEdit && id) {
          const invoiceRes = await invoiceAPI.get(id);
          const inv = invoiceRes.data;
          setInvoiceNumber(inv.invoice_number);
          setFormData({
            customer_id: inv.customer_id,
            invoice_date: inv.invoice_date.split('T')[0],
            due_date: inv.due_date ? inv.due_date.split('T')[0] : '',
            discount: inv.discount || 0,
            discount_type: inv.discount_type || 'fixed',
            notes: inv.notes || '',
            terms: inv.terms || companyRes.data.terms_conditions,
            items: inv.items.map(item => ({
              product_id: item.product_id,
              quantity: item.quantity,
              unit_price: item.unit_price,
              discount: item.discount || 0,
              tax_rate: item.tax_rate || 18,
              description: item.description || ''
            })),
            extra_fields: inv.extra_fields || {},
            industry_metadata: inv.industry_metadata || {},
            eway_bill_number: inv.eway_bill_number || '',
            apply_tds: parseFloat(inv.tds_rate) > 0,
            tds_rate: inv.tds_rate || 0,
            apply_tcs: parseFloat(inv.tcs_rate) > 0,
            tcs_rate: inv.tcs_rate || 0
          });
        } else {
          const nextNumberRes = await invoiceAPI.getNextNumber();
          setInvoiceNumber(nextNumberRes.data.invoice_number);

          // If coming from Quotation, pre-populate data
          if (location.state?.fromQuotation && location.state?.quotationData) {
            const q = location.state.quotationData;
            setFormData(prev => ({
              ...prev,
              customer_id: q.customer_id,
              notes: q.notes || prev.notes,
              terms: q.terms || prev.terms,
              industry_metadata: q.industry_metadata || prev.industry_metadata,
              items: q.items.map(item => ({
                product_id: item.product_id,
                quantity: item.quantity,
                unit_price: item.unit_price,
                tax_rate: item.tax_rate || 18,
                discount: 0,
                description: item.description || ''
              }))
            }));
          }
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
        { product_id: '', quantity: 1, unit_price: 0, discount: 0, tax_rate: 18 }
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

  const calculateItemTotal = (item) => {
    const qty = parseFloat(item.quantity) || 0;
    const price = parseFloat(item.unit_price) || 0;
    const discount = parseFloat(item.discount) || 0;
    const taxRate = parseFloat(item.tax_rate) || 0;
    
    const subtotal = qty * price;
    const afterDiscount = subtotal - discount;
    const tax = (afterDiscount * taxRate) / 100;
    return afterDiscount + tax;
  };

  const calculateTotals = () => {
    const items = formData.items;
    let subtotal = 0;
    let taxAmount = 0;
    
    items.forEach(item => {
      const qty = parseFloat(item.quantity) || 0;
      const price = parseFloat(item.unit_price) || 0;
      const itemDiscount = parseFloat(item.discount) || 0;
      const taxRate = parseFloat(item.tax_rate) || 0;
      
      const itemSubtotal = (qty * price) - itemDiscount;
      const itemTax = (itemSubtotal * taxRate) / 100;
      
      subtotal += itemSubtotal;
      taxAmount += itemTax;
    });

    let discountAmount = 0;
    if (formData.discount_type === 'percentage') {
      discountAmount = (subtotal * parseFloat(formData.discount || 0)) / 100;
    } else {
      discountAmount = parseFloat(formData.discount || 0);
    }

    const amountWithGst = subtotal + taxAmount - discountAmount;
    
    let tdsAmount = 0;
    if (formData.apply_tds) {
      tdsAmount = (amountWithGst * parseFloat(formData.tds_rate || 0)) / 100;
    }

    let tcsAmount = 0;
    if (formData.apply_tcs) {
      tcsAmount = (amountWithGst * parseFloat(formData.tcs_rate || 0)) / 100;
    }

    const total = amountWithGst + tcsAmount - tdsAmount;
    const roundOff = Math.round(total) - total;
    
    let finalTotal = Math.round(total);
    let walletUsed = 0;

    if (formData.use_wallet_balance) {
      walletUsed = Math.min(parseFloat(selectedCustomer?.wallet_balance || 0), finalTotal);
      finalTotal -= walletUsed;
    }

    return {
      subtotal,
      taxAmount,
      discountAmount,
      tdsAmount,
      tcsAmount,
      roundOff,
      total: finalTotal,
      walletUsed
    };
  };

  const totals = calculateTotals();

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    
    if (!formData.customer_id || formData.customer_id === "") {
      toast.error('Please select a customer');
      return;
    }
    
    if (formData.items.length === 0) {
      toast.error('Please add at least one item');
      return;
    }

    const invalidItems = formData.items.filter(item => 
      !item.product_id || item.product_id === "" ||
      (industryConfig.fields.showQty && !item.quantity) || 
      !item.unit_price
    );
    if (invalidItems.length > 0) {
      toast.error('Please fill all item details');
      return;
    }

    setLoading(true);
    try {
      const data = {
        ...formData,
        customer_id: formData.customer_id || null,
        godown_id: formData.godown_id || null,
        wallet_amount: totals.walletUsed,
        tds_rate: formData.apply_tds ? parseFloat(formData.tds_rate) : 0,
        tcs_rate: formData.apply_tcs ? parseFloat(formData.tcs_rate) : 0,
        items: formData.items.map(item => ({
          product_id: item.product_id,
          quantity: industryConfig.fields.showQty ? parseFloat(item.quantity) : 1,
          unit_price: parseFloat(item.unit_price),
          discount: parseFloat(item.discount) || 0,
          tax_rate: parseFloat(item.tax_rate) || 0,
          description: item.description || ''
        }))
      };
      
      if (isEdit) {
        await invoiceAPI.update(id, data);
        toast.success('Invoice updated successfully');
        navigate(`/invoices/${id}`);
      } else {
        const res = await invoiceAPI.create(data);
        toast.success('Invoice created successfully');
        navigate(`/invoices/${res.data.invoice.id}`);
      }
    } catch (error) {
      toast.error(error.response?.data?.error || `Failed to ${isEdit ? 'update' : 'create'} invoice`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in" data-testid="create-invoice-page">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate('/invoices')} data-testid="back-btn">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="font-heading text-2xl md:text-3xl font-bold text-slate-900">{isEdit ? 'Edit' : 'Create'} Sales</h1>
          <p className="text-slate-600">Invoice #{invoiceNumber}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Invoice Details */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Invoice Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Customer *</Label>
                  <Select
                    value={formData.customer_id}
                    onValueChange={(value) => setFormData({ ...formData, customer_id: value })}
                  >
                    <SelectTrigger data-testid="customer-select">
                      <SelectValue placeholder="Select customer" />
                    </SelectTrigger>
                    <SelectContent>
                      {customers.map((customer) => (
                        <SelectItem key={customer.id} value={customer.id}>
                          {customer.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {selectedCustomer && parseFloat(selectedCustomer.wallet_balance) > 0 && (
                    <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-lg mt-2 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Wallet className="w-4 h-4 text-emerald-600" />
                        <div>
                          <p className="text-[10px] uppercase font-bold text-emerald-600 leading-none">Wallet Balance Available</p>
                          <p className="text-sm font-black text-emerald-700">{formatCurrency(selectedCustomer.wallet_balance)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Label htmlFor="use-wallet" className="text-xs cursor-pointer">Use Wallet?</Label>
                        <Switch 
                          id="use-wallet"
                          checked={formData.use_wallet_balance}
                          onCheckedChange={(checked) => setFormData({
                            ...formData, 
                            use_wallet_balance: checked,
                            wallet_amount: checked ? Math.min(parseFloat(selectedCustomer.wallet_balance), totals.total) : 0
                          })}
                        />
                      </div>
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Invoice Date</Label>
                  <Input
                    type="date"
                    value={formData.invoice_date}
                    onChange={(e) => setFormData({ ...formData, invoice_date: e.target.value })}
                    data-testid="invoice-date-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Due Date</Label>
                  <Input
                    type="date"
                    value={formData.due_date}
                    onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                    data-testid="due-date-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label>E-Way Bill Number</Label>
                  <Input
                    type="text"
                    placeholder="Enter E-Way Bill Number"
                    value={formData.eway_bill_number}
                    onChange={(e) => setFormData({ ...formData, eway_bill_number: e.target.value })}
                    data-testid="eway-bill-input"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Industry Specific Fields */}
          {industryConfig.extraFields && industryConfig.extraFields.length > 0 && (
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>{industry} Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
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
                </div>
              </CardContent>
            </Card>
          )}

          {/* Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Subtotal</span>
                <span className="font-mono">{formatCurrency(totals.subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Tax</span>
                <span className="font-mono">{formatCurrency(totals.taxAmount)}</span>
              </div>
              {totals.walletUsed > 0 && (
                <div className="flex justify-between text-sm text-emerald-600 font-bold">
                  <span>Wallet Used</span>
                  <span className="font-mono">-{formatCurrency(totals.walletUsed)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Discount</span>
                <span className="font-mono text-red-600">-{formatCurrency(totals.discountAmount)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Round Off</span>
                <span className="font-mono">{formatCurrency(totals.roundOff)}</span>
              </div>
              {formData.apply_tds && (
                <div className="flex justify-between text-sm text-red-600 font-medium">
                  <span>TDS ({formData.tds_rate}%)</span>
                  <span className="font-mono">-{formatCurrency(totals.tdsAmount)}</span>
                </div>
              )}
              {formData.apply_tcs && (
                <div className="flex justify-between text-sm text-emerald-600 font-medium">
                  <span>TCS ({formData.tcs_rate}%)</span>
                  <span className="font-mono">+{formatCurrency(totals.tcsAmount)}</span>
                </div>
              )}
              <div className="border-t pt-3 flex justify-between font-semibold">
                <span>Total</span>
                <span className="text-xl font-mono">{formatCurrency(totals.total)}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Items */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Items</CardTitle>
            <Button type="button" variant="outline" onClick={addItem} data-testid="add-item-btn">
              <Plus className="w-4 h-4 mr-2" />
              Add Item
            </Button>
          </CardHeader>
          <CardContent>
            {formData.items.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <p>No items added yet</p>
                <div className="mt-4 flex flex-col items-center gap-2">
                  <Button type="button" variant="outline" onClick={addItem} data-testid="add-item-btn-empty">
                    <Plus className="w-4 h-4 mr-2" />
                    Add First Item
                  </Button>
                  <p className="text-xs text-slate-400">Press Enter to add first item</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-1/3">{industryConfig.labels.itemName}</TableHead>
                      {industryConfig.fields.showQty && <TableHead>{industryConfig.labels.qty}</TableHead>}
                      <TableHead>{industryConfig.labels.price}</TableHead>
                      <TableHead>GST%</TableHead>
                      {industryConfig.fields.showDiscount && <TableHead>Discount</TableHead>}
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {formData.items.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <div className="space-y-2">
                            <Select
                              value={item.product_id}
                              onValueChange={(value) => updateItem(index, 'product_id', value)}
                            >
                              <SelectTrigger data-testid={`item-product-${index}`}>
                                <SelectValue placeholder={`Select ${industryConfig.labels.itemName.toLowerCase()}`} />
                              </SelectTrigger>
                              <SelectContent>
                                {products.map((product) => (
                                  <SelectItem key={product.id} value={product.id}>
                                    {product.name} ({formatCurrency(product.sale_price)})
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            {industryConfig.fields.showDescription && (
                              <Textarea
                                placeholder="Description"
                                value={item.description || ''}
                                onChange={(e) => updateItem(index, 'description', e.target.value)}
                                className="text-xs min-h-[60px]"
                              />
                            )}
                          </div>
                        </TableCell>
                        {industryConfig.fields.showQty && (
                          <TableCell>
                            <Input
                              type="number"
                              min="1"
                              step="0.01"
                              value={item.quantity}
                              onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  addItem();
                                }
                              }}
                              className="w-20"
                              data-testid={`item-qty-${index}`}
                            />
                          </TableCell>
                        )}
                        <TableCell>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.unit_price}
                            onChange={(e) => updateItem(index, 'unit_price', e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                if (index === formData.items.length - 1) {
                                  addItem();
                                }
                              }
                            }}
                            className="w-24"
                            data-testid={`item-price-${index}`}
                          />
                        </TableCell>
                        <TableCell>
                          <Select
                            value={String(item.tax_rate)}
                            onValueChange={(value) => updateItem(index, 'tax_rate', value)}
                          >
                            <SelectTrigger className="w-20">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="0">0%</SelectItem>
                              <SelectItem value="5">5%</SelectItem>
                              <SelectItem value="12">12%</SelectItem>
                              <SelectItem value="18">18%</SelectItem>
                              <SelectItem value="28">28%</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        {industryConfig.fields.showDiscount && (
                          <TableCell>
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              value={item.discount}
                              onChange={(e) => updateItem(index, 'discount', e.target.value)}
                              className="w-20"
                            />
                          </TableCell>
                        )}
                        <TableCell className="text-right font-mono">
                          {formatCurrency(calculateItemTotal(item))}
                        </TableCell>
                        <TableCell>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeItem(index)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                
                <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                  <div className="flex items-center gap-4">
                    <Button type="button" variant="outline" size="sm" onClick={addItem}>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Another Item
                    </Button>
                    <p className="text-xs text-slate-400">Press Enter on Price/Qty to add next</p>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400 italic">Press Alt+S to save</span>
                    <Button 
                      type="button" 
                      variant="default" 
                      className="bg-emerald-600 hover:bg-emerald-700"
                      onClick={() => handleSubmit()}
                      disabled={loading}
                    >
                      <Save className="w-4 h-4 mr-2" />
                      Create Invoice (Double Enter)
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Additional Details */}
        <div className="grid md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Discount</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <div className="flex-1">
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.discount}
                    onChange={(e) => setFormData({ ...formData, discount: e.target.value })}
                    placeholder="Discount amount"
                    data-testid="discount-input"
                  />
                </div>
                <Select
                  value={formData.discount_type}
                  onValueChange={(value) => setFormData({ ...formData, discount_type: value })}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fixed">Fixed (₹)</SelectItem>
                    <SelectItem value="percentage">Percent (%)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Tax Adjustments</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Switch 
                    id="apply-tds"
                    checked={formData.apply_tds}
                    onCheckedChange={(checked) => setFormData({ ...formData, apply_tds: checked, tds_rate: checked ? 10 : 0 })}
                  />
                  <Label htmlFor="apply-tds" className="cursor-pointer">Apply TDS</Label>
                </div>
                {formData.apply_tds && (
                  <div className="flex items-center gap-2">
                    <Input 
                      type="number"
                      className="w-20 h-8"
                      value={formData.tds_rate}
                      onChange={(e) => setFormData({ ...formData, tds_rate: e.target.value })}
                    />
                    <span className="text-xs text-slate-500">%</span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Switch 
                    id="apply-tcs"
                    checked={formData.apply_tcs}
                    onCheckedChange={(checked) => setFormData({ ...formData, apply_tcs: checked, tcs_rate: checked ? 1 : 0 })}
                  />
                  <Label htmlFor="apply-tcs" className="cursor-pointer">Apply TCS</Label>
                </div>
                {formData.apply_tcs && (
                  <div className="flex items-center gap-2">
                    <Input 
                      type="number"
                      className="w-20 h-8"
                      value={formData.tcs_rate}
                      onChange={(e) => setFormData({ ...formData, tcs_rate: e.target.value })}
                    />
                    <span className="text-xs text-slate-500">%</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Add any notes for the customer..."
                rows={3}
                data-testid="notes-input"
              />
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={() => navigate('/invoices')}>
            Cancel
          </Button>
          <Button 
            type="submit" 
            className="bg-emerald-600 hover:bg-emerald-700" 
            disabled={loading}
            data-testid="save-invoice-btn"
          >
            <Save className="w-4 h-4 mr-2" />
            {loading ? 'Creating...' : 'Create Invoice'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default CreateInvoicePage;
