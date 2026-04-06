import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { invoiceAPI, customerAPI, productAPI, companyAPI } from '../services/api';
import { getIndustryConfig, INDUSTRY_GROUPS } from '../lib/industryConfig';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { ArrowLeft, Plus, Trash2, Save, Calendar, Wallet, Wrench, Package } from 'lucide-react';
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
  const [services, setServices] = useState([]);
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
    service_items: [],
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
        
        // Separate products and services
        const allProducts = productsRes.data.products || [];
        setProducts(allProducts.filter(p => p.type === 'product' || !p.type));
        setServices(allProducts.filter(p => p.type === 'service'));
        
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
          
          // Separate product and service items
          const productItems = inv.items?.filter(item => item.item_type !== 'service') || [];
          const serviceItems = inv.items?.filter(item => item.item_type === 'service') || [];
          
          setFormData({
            customer_id: inv.customer_id,
            invoice_date: inv.invoice_date.split('T')[0],
            due_date: inv.due_date ? inv.due_date.split('T')[0] : '',
            discount: inv.discount || 0,
            discount_type: inv.discount_type || 'fixed',
            notes: inv.notes || '',
            terms: inv.terms || companyRes.data.terms_conditions,
            items: productItems.map(item => ({
              product_id: item.product_id,
              quantity: item.quantity,
              unit_price: item.unit_price,
              discount: item.discount || 0,
              tax_rate: item.tax_rate || 18,
              description: item.description || '',
              item_type: 'product',
              batch_number: item.batch_number || '',
              expiry_date: item.expiry_date || ''
            })),
            service_items: serviceItems.map(item => ({
              product_id: item.product_id,
              quantity: item.quantity,
              unit_price: item.unit_price,
              discount: item.discount || 0,
              tax_rate: item.tax_rate || 18,
              description: item.description || '',
              item_type: 'service'
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
                description: item.description || '',
                item_type: 'product'
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

  // Product Items
  const addProductItem = () => {
    setFormData({
      ...formData,
      items: [
        ...formData.items,
        { product_id: '', quantity: 1, unit_price: 0, discount: 0, tax_rate: 18, item_type: 'product' }
      ]
    });
  };

  const removeProductItem = (index) => {
    setFormData({
      ...formData,
      items: formData.items.filter((_, i) => i !== index)
    });
  };

  const updateProductItem = (index, field, value) => {
    const newItems = [...formData.items];
    
    if (field === 'product_id') {
      const product = products.find(p => p.id === value);
      if (product) {
        if (parseFloat(product.stock_quantity) <= 0) {
          toast.error(`${product.name} is out of stock!`);
          return;
        }
        newItems[index][field] = value;
        newItems[index].unit_price = parseFloat(product.sale_price);
        newItems[index].tax_rate = parseFloat(product.gst_rate);
        newItems[index].hsn_code = product.hsn_code || '';
        newItems[index].sku = product.sku || '';
      }
    } else if (field === 'quantity') {
      const product = products.find(p => p.id === newItems[index].product_id);
      if (product && parseFloat(value) > parseFloat(product.stock_quantity)) {
        toast.error(`Only ${product.stock_quantity} units available in stock`);
        newItems[index][field] = product.stock_quantity;
      } else {
        newItems[index][field] = value;
      }
    } else {
      newItems[index][field] = value;
    }
    
    setFormData({ ...formData, items: newItems });
  };

  // Service Items
  const addServiceItem = () => {
    setFormData({
      ...formData,
      service_items: [
        ...formData.service_items,
        { product_id: '', quantity: 1, unit_price: 0, discount: 0, tax_rate: 18, item_type: 'service' }
      ]
    });
  };

  const removeServiceItem = (index) => {
    setFormData({
      ...formData,
      service_items: formData.service_items.filter((_, i) => i !== index)
    });
  };

  const updateServiceItem = (index, field, value) => {
    const newItems = [...formData.service_items];
    
    if (field === 'product_id') {
      const service = services.find(s => s.id === value);
      if (service) {
        newItems[index][field] = value;
        newItems[index].unit_price = parseFloat(service.sale_price);
        newItems[index].tax_rate = parseFloat(service.gst_rate);
      }
    } else {
      newItems[index][field] = value;
    }
    
    setFormData({ ...formData, service_items: newItems });
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
    // Calculate product totals
    let productSubtotal = 0;
    let productTax = 0;
    formData.items.forEach(item => {
      const qty = parseFloat(item.quantity) || 0;
      const price = parseFloat(item.unit_price) || 0;
      const itemDiscount = parseFloat(item.discount) || 0;
      const taxRate = parseFloat(item.tax_rate) || 0;
      
      const itemSubtotal = (qty * price) - itemDiscount;
      const itemTax = (itemSubtotal * taxRate) / 100;
      
      productSubtotal += itemSubtotal;
      productTax += itemTax;
    });

    // Calculate service totals
    let serviceSubtotal = 0;
    let serviceTax = 0;
    formData.service_items.forEach(item => {
      const qty = parseFloat(item.quantity) || 0;
      const price = parseFloat(item.unit_price) || 0;
      const itemDiscount = parseFloat(item.discount) || 0;
      const taxRate = parseFloat(item.tax_rate) || 0;
      
      const itemSubtotal = (qty * price) - itemDiscount;
      const itemTax = (itemSubtotal * taxRate) / 100;
      
      serviceSubtotal += itemSubtotal;
      serviceTax += itemTax;
    });

    const subtotal = productSubtotal + serviceSubtotal;
    const taxAmount = productTax + serviceTax;

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
      productSubtotal,
      productTax,
      serviceSubtotal,
      serviceTax,
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
    
    // Validate items
    const allItems = [...formData.items, ...formData.service_items];
    if (allItems.length === 0) {
      toast.error('Please add at least one item or service');
      return;
    }

    const invalidItems = allItems.filter(item => 
      !item.product_id || item.product_id === "" ||
      !item.quantity || 
      !item.unit_price
    );
    if (invalidItems.length > 0) {
      toast.error('Please fill all item details');
      return;
    }

    setLoading(true);
    try {
      // Combine product and service items
      const combinedItems = [
        ...formData.items.map(item => ({
          ...item,
          quantity: parseFloat(item.quantity),
          unit_price: parseFloat(item.unit_price),
          discount: parseFloat(item.discount) || 0,
          tax_rate: parseFloat(item.tax_rate) || 0,
          item_type: 'product'
        })),
        ...formData.service_items.map(item => ({
          ...item,
          quantity: parseFloat(item.quantity),
          unit_price: parseFloat(item.unit_price),
          discount: parseFloat(item.discount) || 0,
          tax_rate: parseFloat(item.tax_rate) || 0,
          item_type: 'service'
        }))
      ];

      const data = {
        ...formData,
        customer_id: formData.customer_id || null,
        godown_id: formData.godown_id || null,
        wallet_amount: totals.walletUsed,
        tds_rate: formData.apply_tds ? parseFloat(formData.tds_rate) : 0,
        tcs_rate: formData.apply_tcs ? parseFloat(formData.tcs_rate) : 0,
        items: combinedItems
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

  // Render item table based on industry
  const renderItemTable = () => {
    const isAutomobile = industryConfig.group === INDUSTRY_GROUPS.AUTOMOBILE_SERVICE;
    
    if (isAutomobile) {
      return (
        <Tabs defaultValue="products" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="products" className="flex items-center gap-2">
              <Package className="w-4 h-4" />
              Spare Parts ({formData.items.length})
            </TabsTrigger>
            <TabsTrigger value="services" className="flex items-center gap-2">
              <Wrench className="w-4 h-4" />
              Services ({formData.service_items.length})
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="products">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Spare Parts & Materials</CardTitle>
                <Button type="button" variant="outline" onClick={addProductItem}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Part
                </Button>
              </CardHeader>
              <CardContent>
                {formData.items.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">
                    <p>No parts added yet</p>
                    <Button type="button" variant="outline" onClick={addProductItem} className="mt-4">
                      <Plus className="w-4 h-4 mr-2" />
                      Add First Part
                    </Button>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Part Name</TableHead>
                        <TableHead>Part No</TableHead>
                        <TableHead>Qty</TableHead>
                        <TableHead>Rate</TableHead>
                        <TableHead>GST%</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead className="w-12"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {formData.items.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            <Select
                              value={item.product_id}
                              onValueChange={(value) => updateProductItem(index, 'product_id', value)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select part" />
                              </SelectTrigger>
                              <SelectContent>
                                {products.map((product) => (
                                  <SelectItem key={product.id} value={product.id}>
                                    {product.name} (₹{product.sale_price})
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <Input
                              type="text"
                              value={item.sku || ''}
                              onChange={(e) => updateProductItem(index, 'sku', e.target.value)}
                              placeholder="Part No"
                              className="w-24"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) => updateProductItem(index, 'quantity', e.target.value)}
                              className="w-16"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              value={item.unit_price}
                              onChange={(e) => updateProductItem(index, 'unit_price', e.target.value)}
                              className="w-24"
                            />
                          </TableCell>
                          <TableCell>
                            <Select
                              value={String(item.tax_rate)}
                              onValueChange={(value) => updateProductItem(index, 'tax_rate', value)}
                            >
                              <SelectTrigger className="w-16">
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
                          <TableCell className="text-right font-mono">
                            {formatCurrency(calculateItemTotal(item))}
                          </TableCell>
                          <TableCell>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => removeProductItem(index)}
                              className="text-red-600"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
                
                {formData.items.length > 0 && (
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                    <div className="flex justify-between text-sm">
                      <span className="text-blue-700 font-medium">Parts Subtotal:</span>
                      <span className="font-mono font-bold">{formatCurrency(totals.productSubtotal + totals.productTax)}</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="services">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Services & Labour</CardTitle>
                <Button type="button" variant="outline" onClick={addServiceItem}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Service
                </Button>
              </CardHeader>
              <CardContent>
                {formData.service_items.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">
                    <p>No services added yet</p>
                    <Button type="button" variant="outline" onClick={addServiceItem} className="mt-4">
                      <Plus className="w-4 h-4 mr-2" />
                      Add First Service
                    </Button>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Service Description</TableHead>
                        <TableHead>Hours</TableHead>
                        <TableHead>Rate</TableHead>
                        <TableHead>GST%</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead className="w-12"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {formData.service_items.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            <Select
                              value={item.product_id}
                              onValueChange={(value) => updateServiceItem(index, 'product_id', value)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select service" />
                              </SelectTrigger>
                              <SelectContent>
                                {services.length > 0 ? services.map((service) => (
                                  <SelectItem key={service.id} value={service.id}>
                                    {service.name} (₹{service.sale_price}/hr)
                                  </SelectItem>
                                )) : (
                                  <SelectItem value="custom">Custom Service</SelectItem>
                                )}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min="0.5"
                              step="0.5"
                              value={item.quantity}
                              onChange={(e) => updateServiceItem(index, 'quantity', e.target.value)}
                              className="w-16"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              value={item.unit_price}
                              onChange={(e) => updateServiceItem(index, 'unit_price', e.target.value)}
                              className="w-24"
                            />
                          </TableCell>
                          <TableCell>
                            <Select
                              value={String(item.tax_rate)}
                              onValueChange={(value) => updateServiceItem(index, 'tax_rate', value)}
                            >
                              <SelectTrigger className="w-16">
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
                          <TableCell className="text-right font-mono">
                            {formatCurrency(calculateItemTotal(item))}
                          </TableCell>
                          <TableCell>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => removeServiceItem(index)}
                              className="text-red-600"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
                
                {formData.service_items.length > 0 && (
                  <div className="mt-4 p-3 bg-emerald-50 rounded-lg">
                    <div className="flex justify-between text-sm">
                      <span className="text-emerald-700 font-medium">Services Subtotal:</span>
                      <span className="font-mono font-bold">{formatCurrency(totals.serviceSubtotal + totals.serviceTax)}</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      );
    }
    
    // Standard single-table view for other industries
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Items</CardTitle>
          <Button type="button" variant="outline" onClick={addProductItem}>
            <Plus className="w-4 h-4 mr-2" />
            Add Item
          </Button>
        </CardHeader>
        <CardContent>
          {formData.items.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <p>No items added yet</p>
              <Button type="button" variant="outline" onClick={addProductItem} className="mt-4">
                <Plus className="w-4 h-4 mr-2" />
                Add First Item
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-1/3">{industryConfig.labels.itemName}</TableHead>
                  {industryConfig.fields.showBatch && <TableHead>Batch</TableHead>}
                  {industryConfig.fields.showExpiry && <TableHead>Expiry</TableHead>}
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
                          onValueChange={(value) => updateProductItem(index, 'product_id', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder={`Select ${industryConfig.labels.itemName.toLowerCase()}`} />
                          </SelectTrigger>
                          <SelectContent>
                            {products.map((product) => (
                              <SelectItem key={product.id} value={product.id}>
                                {product.name} (₹{product.sale_price})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {industryConfig.fields.showDescription && (
                          <Textarea
                            placeholder="Description"
                            value={item.description || ''}
                            onChange={(e) => updateProductItem(index, 'description', e.target.value)}
                            className="text-xs min-h-[60px]"
                          />
                        )}
                      </div>
                    </TableCell>
                    {industryConfig.fields.showBatch && (
                      <TableCell>
                        <Input
                          type="text"
                          value={item.batch_number || ''}
                          onChange={(e) => updateProductItem(index, 'batch_number', e.target.value)}
                          placeholder="Batch#"
                          className="w-20"
                        />
                      </TableCell>
                    )}
                    {industryConfig.fields.showExpiry && (
                      <TableCell>
                        <Input
                          type="date"
                          value={item.expiry_date || ''}
                          onChange={(e) => updateProductItem(index, 'expiry_date', e.target.value)}
                          className="w-28"
                        />
                      </TableCell>
                    )}
                    {industryConfig.fields.showQty && (
                      <TableCell>
                        <Input
                          type="number"
                          min="1"
                          step="0.01"
                          value={item.quantity}
                          onChange={(e) => updateProductItem(index, 'quantity', e.target.value)}
                          className="w-20"
                        />
                      </TableCell>
                    )}
                    <TableCell>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.unit_price}
                        onChange={(e) => updateProductItem(index, 'unit_price', e.target.value)}
                        className="w-24"
                      />
                    </TableCell>
                    <TableCell>
                      <Select
                        value={String(item.tax_rate)}
                        onValueChange={(value) => updateProductItem(index, 'tax_rate', value)}
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
                          onChange={(e) => updateProductItem(index, 'discount', e.target.value)}
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
                        onClick={() => removeProductItem(index)}
                        className="text-red-600"
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
    );
  };

  return (
    <div className="space-y-6 animate-fade-in" data-testid="create-invoice-page">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate('/invoices')} data-testid="back-btn">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="font-heading text-2xl md:text-3xl font-bold text-slate-900">
            {isEdit ? 'Edit' : 'Create'} {industryConfig.labels.total}
          </h1>
          <p className="text-slate-600">Invoice #{invoiceNumber} • {industry}</p>
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
                <div className="grid md:grid-cols-3 gap-4">
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
              {/* Show separate totals for automobile */}
              {industryConfig.group === INDUSTRY_GROUPS.AUTOMOBILE_SERVICE && (
                <>
                  <div className="flex justify-between text-sm">
                    <span className="text-blue-600">Parts Subtotal</span>
                    <span className="font-mono">{formatCurrency(totals.productSubtotal + totals.productTax)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-emerald-600">Services Subtotal</span>
                    <span className="font-mono">{formatCurrency(totals.serviceSubtotal + totals.serviceTax)}</span>
                  </div>
                  <div className="border-t border-dashed pt-2"></div>
                </>
              )}
              
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

        {/* Items - Industry Specific */}
        {renderItemTable()}

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
            {loading ? 'Creating...' : `Create ${industryConfig.labels.total}`}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default CreateInvoicePage;
