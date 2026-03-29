import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { productAPI, companyAPI } from '../services/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '../components/ui/select';
import { Textarea } from '../components/ui/textarea';
import { ArrowLeft, RefreshCcw, Save, Package, ArrowRightLeft } from 'lucide-react';
import { toast } from 'sonner';

export const StockTransferPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [godowns, setGodowns] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [sourceStock, setSourceStock] = useState(0);

  const [formData, setFormData] = useState({
    product_id: '',
    from_godown_id: '',
    to_godown_id: '',
    quantity: 0,
    notes: ''
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [gRes, pRes] = await Promise.all([
          companyAPI.getGodowns(),
          productAPI.getAll({ limit: 1000 })
        ]);
        setGodowns(gRes.data);
        setProducts(pRes.data.products);
      } catch (e) {
        toast.error("Failed to load data");
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (formData.product_id && formData.from_godown_id) {
      const prod = products.find(p => p.id === formData.product_id);
      if (prod && prod.StockLevels) {
        const level = prod.StockLevels.find(l => l.godown_id === formData.from_godown_id);
        setSourceStock(level ? parseFloat(level.quantity) : 0);
      } else {
        setSourceStock(0);
      }
    } else {
      setSourceStock(0);
    }
  }, [formData.product_id, formData.from_godown_id, products]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.product_id || !formData.from_godown_id || !formData.to_godown_id) {
      return toast.error("Please fill all required fields");
    }
    if (parseFloat(formData.quantity) <= 0) {
      return toast.error("Quantity must be greater than 0");
    }
    if (parseFloat(formData.quantity) > sourceStock) {
      return toast.error("Insufficient stock in source godown");
    }

    setLoading(true);
    try {
      await productAPI.transferStock(formData);
      toast.success("Stock transferred successfully");
      navigate('/products');
    } catch (error) {
      toast.error(error.response?.data?.error || "Transfer failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate(-1)}><ArrowLeft className="w-4 h-4 mr-2" />Back</Button>
        <h1 className="text-2xl font-bold flex items-center gap-2"><ArrowRightLeft className="w-6 h-6 text-emerald-600" /> Internal Stock Transfer</h1>
      </div>

      <div className="max-w-2xl mx-auto">
        <form onSubmit={handleSubmit}>
          <Card className="shadow-lg border-emerald-100">
            <CardHeader className="bg-emerald-50/50">
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-emerald-800">Transfer Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <div className="space-y-2">
                <Label>Select Product *</Label>
                <Select value={formData.product_id} onValueChange={(v) => setFormData({...formData, product_id: v})}>
                  <SelectTrigger><SelectValue placeholder="Select product to move" /></SelectTrigger>
                  <SelectContent>
                    {products.map(p => <SelectItem key={p.id} value={p.id}>{p.name} (SKU: {p.sku || 'N/A'})</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Source Godown *</Label>
                  <Select value={formData.from_godown_id} onValueChange={(v) => setFormData({...formData, from_godown_id: v})}>
                    <SelectTrigger><SelectValue placeholder="Move from..." /></SelectTrigger>
                    <SelectContent>
                      {godowns.map(g => <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  {formData.product_id && formData.from_godown_id && (
                    <p className="text-[10px] font-bold text-slate-500 uppercase mt-1">Available: <span className="text-emerald-600">{sourceStock} units</span></p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Destination Godown *</Label>
                  <Select value={formData.to_godown_id} onValueChange={(v) => setFormData({...formData, to_godown_id: v})}>
                    <SelectTrigger><SelectValue placeholder="Move to..." /></SelectTrigger>
                    <SelectContent>
                      {godowns.map(g => <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Quantity to Transfer *</Label>
                <div className="relative">
                  <Package className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input 
                    type="number" 
                    step="0.01"
                    min="0.01"
                    max={sourceStock}
                    placeholder="0.00"
                    className="pl-10 font-bold text-lg"
                    value={formData.quantity}
                    onChange={(e) => setFormData({...formData, quantity: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Notes (Optional)</Label>
                <Textarea 
                  placeholder="Reason for transfer, person responsible, etc."
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                />
              </div>

              <div className="pt-4">
                <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 py-6 text-lg font-bold" disabled={loading}>
                  {loading ? <RefreshCcw className="w-5 h-5 animate-spin mr-2" /> : <Save className="w-5 h-5 mr-2" />}
                  Confirm Stock Transfer
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      </div>
    </div>
  );
};

export default StockTransferPage;
