import React, { useState, useEffect } from 'react';
import { productAPI } from '../services/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardHeader } from '../components/ui/card';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter
} from '../components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '../components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '../components/ui/table';
import { Badge } from '../components/ui/badge';
import { Plus, Search, Edit, Trash2, Package, AlertTriangle, Filter, FileUp, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount || 0);
};
const ProductForm = ({ product, categories, onSave, fetchCategories, onClose }) => {
  const [formData, setFormData] = useState({
    name: product?.name || '',
    sku: product?.sku || '',
    hsn_code: product?.hsn_code || '',
    category_id: product?.category_id || 'none',
    unit: product?.unit || 'pcs',
    gst_rate: product?.gst_rate || 18,
    purchase_price: product?.purchase_price || 0,
    sale_price: product?.sale_price || 0,
    stock_quantity: product?.stock_quantity || 0,
    low_stock_alert: product?.low_stock_alert || 10,
    barcode: product?.barcode || '',
    description: product?.description || '',
    type: product?.type || 'product',
    godown_id: ''
  });
  const [loading, setLoading] = useState(false);
  const [godowns, setGodowns] = useState([]);
  const [newCategoryDialogOpen, setNewCategoryDialogOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [creatingCategory, setCreatingCategory] = useState(false);

  useEffect(() => {
    const fetchGodowns = async () => {
      try {
        const res = await companyAPI.getGodowns();
        setGodowns(res.data);
        if (res.data.length > 0 && !product?.id) {
          const def = res.data.find(g => g.is_default);
          setFormData(prev => ({ ...prev, godown_id: def ? def.id : res.data[0].id }));
        }
      } catch (e) {}
    };
    fetchGodowns();
  }, [product]);

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    
    setCreatingCategory(true);
    try {
      const res = await productAPI.createCategory({ name: newCategoryName });
      toast.success('Category created');
      await fetchCategories();
      setFormData(prev => ({ ...prev, category_id: res.data.category.id }));
      setNewCategoryDialogOpen(false);
      setNewCategoryName('');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to create category');
    } finally {
      setCreatingCategory(false);
    }
  };

  const handleCategoryChange = (value) => {
    if (value === 'add_new') {
      setNewCategoryDialogOpen(true);
    } else {
      setFormData({ ...formData, category_id: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = {
        ...formData,
        gst_rate: parseFloat(formData.gst_rate),
        purchase_price: parseFloat(formData.purchase_price),
        sale_price: parseFloat(formData.sale_price),
        stock_quantity: parseFloat(formData.stock_quantity),
        low_stock_alert: parseFloat(formData.low_stock_alert)
      };
      if (product?.id) {
        await productAPI.update(product.id, data);
        toast.success('Product updated');
      } else {
        await productAPI.create(data);
        toast.success('Product created');
      }
      onSave();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Operation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2 space-y-2">
          <Label>Product Name *</Label>
          <Input
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            data-testid="product-name-input"
          />
        </div>
        <div className="space-y-2">
          <Label>SKU</Label>
          <Input
            value={formData.sku}
            onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
            data-testid="product-sku-input"
          />
        </div>
        <div className="space-y-2">
          <Label>HSN Code</Label>
          <Input
            value={formData.hsn_code}
            onChange={(e) => setFormData({ ...formData, hsn_code: e.target.value })}
            data-testid="product-hsn-input"
          />
        </div>
        <div className="space-y-2">
          <Label>Category</Label>
          <Select
            value={formData.category_id}
            onValueChange={handleCategoryChange}
          >
          <SelectTrigger data-testid="product-category-select">
             <SelectValue placeholder="Select category" />
          </SelectTrigger>

          <SelectContent>
             <SelectItem value="none">No Category</SelectItem>
             {categories.map((cat) => (
             <SelectItem key={cat.id} value={cat.id}>
              {cat.name}
             </SelectItem>
            ))}
            <div className="h-px bg-slate-100 my-1" />
            <SelectItem value="add_new" className="text-indigo-600 font-bold">
              + Add New Category
            </SelectItem>
         </SelectContent>
         </Select>
        </div>

        {/* New Category Dialog */}
        <Dialog open={newCategoryDialogOpen} onOpenChange={setNewCategoryDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Add New Category</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateCategory} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Category Name</Label>
                <Input 
                  value={newCategoryName} 
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="e.g. Electronics, Raw Materials"
                  autoFocus
                />
              </div>
              <DialogFooter>
                <Button type="button" variant="ghost" onClick={() => setNewCategoryDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={creatingCategory}>
                  {creatingCategory ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Save Category
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
        <div className="space-y-2">
          <Label>Unit</Label>
          <Select
            value={formData.unit}
            onValueChange={(value) => setFormData({ ...formData, unit: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pcs">Pieces</SelectItem>
              <SelectItem value="kg">Kilograms</SelectItem>
              <SelectItem value="g">Grams</SelectItem>
              <SelectItem value="l">Liters</SelectItem>
              <SelectItem value="ml">Milliliters</SelectItem>
              <SelectItem value="m">Meters</SelectItem>
              <SelectItem value="box">Box</SelectItem>
              <SelectItem value="dozen">Dozen</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>GST Rate (%)</Label>
          <Select
            value={String(formData.gst_rate)}
            onValueChange={(value) => setFormData({ ...formData, gst_rate: value })}
          >
            <SelectTrigger>
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
        </div>
        {!product?.id && (
          <div className="space-y-2">
            <Label>Initial Godown</Label>
            <Select
              value={formData.godown_id}
              onValueChange={(value) => setFormData({ ...formData, godown_id: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Godown" />
              </SelectTrigger>
              <SelectContent>
                {godowns.map((g) => (
                  <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        <div className="space-y-2">
          <Label>Barcode</Label>
          <Input
            value={formData.barcode}
            onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label>Purchase Price *</Label>
          <Input
            type="number"
            step="0.01"
            value={formData.purchase_price}
            onChange={(e) => setFormData({ ...formData, purchase_price: e.target.value })}
            required
            data-testid="product-purchase-price-input"
          />
        </div>
        <div className="space-y-2">
          <Label>Sale Price *</Label>
          <Input
            type="number"
            step="0.01"
            value={formData.sale_price}
            onChange={(e) => setFormData({ ...formData, sale_price: e.target.value })}
            required
            data-testid="product-sale-price-input"
          />
        </div>
        {!product?.id && (
          <div className="space-y-2">
            <Label>Opening Stock</Label>
            <Input
              type="number"
              step="0.01"
              value={formData.stock_quantity}
              onChange={(e) => setFormData({ ...formData, stock_quantity: e.target.value })}
              data-testid="product-stock-input"
            />
          </div>
        )}
        <div className="space-y-2">
          <Label>Low Stock Alert</Label>
          <Input
            type="number"
            step="0.01"
            value={formData.low_stock_alert}
            onChange={(e) => setFormData({ ...formData, low_stock_alert: e.target.value })}
          />
        </div>
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
        <Button type="submit" disabled={loading} className="bg-emerald-600 hover:bg-emerald-700" data-testid="save-product-btn">
          {loading ? 'Saving...' : 'Save'}
        </Button>
      </DialogFooter>
    </form>
  );
};

export const ProductsPage = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showLowStock, setShowLowStock] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchProducts = async () => {
    try {
      const response = await productAPI.getAll({ search, page, limit: 20, low_stock: showLowStock });
      setProducts(response.data.products);
      setTotalPages(response.data.totalPages);
    } catch (error) {
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await productAPI.getCategories();
      setCategories(response.data);
    } catch (error) {
      console.error('Failed to load categories');
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [search, page, showLowStock]);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    try {
      await productAPI.delete(id);
      toast.success('Product deleted');
      fetchProducts();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Delete failed');
    }
  };

  const handleEdit = (product) => {
    setSelectedProduct(product);
    setDialogOpen(true);
  };

  const handleSave = () => {
    setDialogOpen(false);
    setSelectedProduct(null);
    fetchProducts();
  };

  const handleImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    setImporting(true);
    try {
      const res = await productAPI.importProducts(formData);
      toast.success(res.data.message);
      if (res.data.skipped > 0) {
        toast.info(`${res.data.skipped} duplicate items were skipped.`);
      }
      fetchProducts();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Import failed');
    } finally {
      setImporting(false);
      e.target.value = '';
    }
  };

  const isLowStock = (product) => {
    return parseFloat(product.stock_quantity) <= parseFloat(product.low_stock_alert);
  };

  return (
    <div className="space-y-6 animate-fade-in" data-testid="products-page">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl md:text-3xl font-bold text-slate-900">Products</h1>
          <p className="text-slate-600">Manage your inventory</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <input
              type="file"
              id="import-items"
              className="hidden"
              accept=".xlsx, .xls, .csv"
              onChange={handleImport}
              disabled={importing}
            />
            <Button 
              variant="outline"
              disabled={importing}
              onClick={() => document.getElementById('import-items').click()}
            >
              {importing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileUp className="w-4 h-4 mr-2" />}
              Import
            </Button>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              className="bg-emerald-600 hover:bg-emerald-700"
              onClick={() => setSelectedProduct(null)}
              data-testid="add-product-btn"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Product
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{selectedProduct ? 'Edit Product' : 'Add Product'}</DialogTitle>
            </DialogHeader>
            <ProductForm
              product={selectedProduct}
              categories={categories}
              onSave={handleSave}
              fetchCategories={fetchCategories}
              onClose={() => setDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>
    </div>

    <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search products..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
                data-testid="search-products"
              />
            </div>
            <Button
              variant={showLowStock ? 'default' : 'outline'}
              onClick={() => setShowLowStock(!showLowStock)}
              className={showLowStock ? 'bg-amber-500 hover:bg-amber-600' : ''}
              data-testid="filter-low-stock"
            >
              <AlertTriangle className="w-4 h-4 mr-2" />
              Low Stock
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-600">No products found</p>
              <p className="text-sm text-slate-500">Add your first product to get started</p>
            </div>
          ) : (
            <Table className="data-table">
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Purchase Price</TableHead>
                  <TableHead className="text-right">Sale Price</TableHead>
                  <TableHead className="text-right">Stock</TableHead>
                  <TableHead className="text-center">GST</TableHead>
                  <TableHead className="w-24">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((product) => (
                  <TableRow key={product.id} data-testid={`product-row-${product.id}`}>
                    <TableCell>
                      <div className="font-medium text-slate-900">{product.name}</div>
                      {product.sku && (
                        <div className="text-xs text-slate-500">SKU: {product.sku}</div>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-slate-600">
                      {product.Category?.name || '-'}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {formatCurrency(product.purchase_price)}
                    </TableCell>
                    <TableCell className="text-right font-mono font-medium">
                      {formatCurrency(product.sale_price)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {isLowStock(product) && (
                          <AlertTriangle className="w-4 h-4 text-amber-500" />
                        )}
                        <span className={`font-mono ${isLowStock(product) ? 'text-amber-600' : 'text-slate-900'}`}>
                          {product.stock_quantity} {product.unit}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary">{product.gst_rate}%</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(product)}
                          data-testid={`edit-product-${product.id}`}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(product.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          data-testid={`delete-product-${product.id}`}
                        >
                          <Trash2 className="w-4 h-4" />
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
    </div>
  );
};

export default ProductsPage;
