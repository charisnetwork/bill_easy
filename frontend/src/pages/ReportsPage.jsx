import React, { useState } from 'react';
import { reportAPI } from '../services/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '../components/ui/table';
import {
  BarChart3, FileText, TrendingUp, IndianRupee, Download, Users, Truck, Package
} from 'lucide-react';
import { toast } from 'sonner';

const formatCurrency = (amount) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount || 0);
const formatDate = (date) => new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

const ReportCard = ({ title, description, icon: Icon, onClick, color = 'emerald' }) => {
  const colors = {
    emerald: 'bg-emerald-100 text-emerald-600',
    blue: 'bg-blue-100 text-blue-600',
    amber: 'bg-amber-100 text-amber-600',
    purple: 'bg-purple-100 text-purple-600'
  };
  return (
    <Card className="card-hover cursor-pointer" onClick={onClick}>
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <div className={`p-3 rounded-xl ${colors[color]}`}>
            <Icon className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900">{title}</h3>
            <p className="text-sm text-slate-500">{description}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export const ReportsPage = () => {
  const [activeReport, setActiveReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });

  const fetchReport = async (type) => {
    setLoading(true);
    setActiveReport(type);
    try {
      let response;
      switch (type) {
        case 'sales':
          response = await reportAPI.getSales(dateRange);
          break;
        case 'purchases':
          response = await reportAPI.getPurchases(dateRange);
          break;
        case 'expenses':
          response = await reportAPI.getExpenses(dateRange);
          break;
        case 'profit-loss':
          response = await reportAPI.getProfitLoss(dateRange);
          break;
        case 'gst':
          response = await reportAPI.getGST(dateRange);
          break;
        case 'customer-outstanding':
          response = await reportAPI.getCustomerOutstanding();
          break;
        case 'supplier-outstanding':
          response = await reportAPI.getSupplierOutstanding();
          break;
        case 'stock':
          response = await reportAPI.getStock();
          break;
        default:
          break;
      }
      setReportData(response?.data);
    } catch (error) {
      toast.error('Failed to load report');
    } finally {
      setLoading(false);
    }
  };

  const renderReportContent = () => {
    if (!activeReport || !reportData) return null;

    switch (activeReport) {
      case 'sales':
        return (
          <Card>
            <CardHeader>
              <CardTitle>Sales Report</CardTitle>
              <CardDescription>
                Total Sales: {formatCurrency(reportData.summary?.total_sales)} | 
                Tax: {formatCurrency(reportData.summary?.total_tax)} | 
                Invoices: {reportData.summary?.invoice_count}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice #</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reportData.invoices?.map((inv) => (
                    <TableRow key={inv.id}>
                      <TableCell className="font-mono">{inv.invoice_number}</TableCell>
                      <TableCell>{inv.Customer?.name}</TableCell>
                      <TableCell>{formatDate(inv.invoice_date)}</TableCell>
                      <TableCell className="text-right font-mono">{formatCurrency(inv.total_amount)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        );

      case 'profit-loss':
        return (
          <Card>
            <CardHeader>
              <CardTitle>Profit & Loss Statement</CardTitle>
              <CardDescription>{formatDate(dateRange.startDate)} - {formatDate(dateRange.endDate)}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between py-3 border-b">
                  <span className="font-medium">Total Sales</span>
                  <span className="font-mono text-emerald-600">+{formatCurrency(reportData.totalSales)}</span>
                </div>
                <div className="flex justify-between py-3 border-b">
                  <span className="font-medium">Total Purchases</span>
                  <span className="font-mono text-red-600">-{formatCurrency(reportData.totalPurchases)}</span>
                </div>
                <div className="flex justify-between py-3 border-b bg-slate-50 px-4 rounded">
                  <span className="font-semibold">Gross Profit</span>
                  <span className={`font-mono font-semibold ${reportData.grossProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    {formatCurrency(reportData.grossProfit)}
                  </span>
                </div>
                <div className="flex justify-between py-3 border-b">
                  <span className="font-medium">Total Expenses</span>
                  <span className="font-mono text-red-600">-{formatCurrency(reportData.totalExpenses)}</span>
                </div>
                <div className="flex justify-between py-4 bg-slate-900 text-white px-4 rounded-lg">
                  <span className="font-bold text-lg">Net Profit</span>
                  <span className={`font-mono font-bold text-lg ${reportData.netProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {formatCurrency(reportData.netProfit)}
                  </span>
                </div>
                <div className="text-center text-sm text-slate-500">
                  Profit Margin: {reportData.profitMargin}%
                </div>
              </div>
            </CardContent>
          </Card>
        );

      case 'gst':
        return (
          <Card>
            <CardHeader>
              <CardTitle>GST Report</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between py-3 border-b">
                  <span>Output GST (Sales)</span>
                  <span className="font-mono">{formatCurrency(reportData.outputGST)}</span>
                </div>
                <div className="flex justify-between py-3 border-b">
                  <span>Input GST (Purchases)</span>
                  <span className="font-mono">{formatCurrency(reportData.inputGST)}</span>
                </div>
                <div className="flex justify-between py-3 bg-slate-100 px-4 rounded">
                  <span className="font-semibold">Net GST</span>
                  <span className={`font-mono font-semibold ${reportData.netGST >= 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                    {formatCurrency(reportData.netGST)}
                  </span>
                </div>
                {reportData.gstPayable > 0 && (
                  <div className="flex justify-between py-3 bg-red-50 px-4 rounded text-red-700">
                    <span className="font-semibold">GST Payable</span>
                    <span className="font-mono font-semibold">{formatCurrency(reportData.gstPayable)}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        );

      case 'customer-outstanding':
        return (
          <Card>
            <CardHeader>
              <CardTitle>Customer Outstanding</CardTitle>
              <CardDescription>Total Outstanding: {formatCurrency(reportData.total)}</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead className="text-right">Outstanding</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reportData.customers?.map((cust) => (
                    <TableRow key={cust.id}>
                      <TableCell className="font-medium">{cust.name}</TableCell>
                      <TableCell>{cust.phone || '-'}</TableCell>
                      <TableCell className="text-right font-mono text-amber-600">{formatCurrency(cust.outstanding_balance)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        );

      case 'supplier-outstanding':
        return (
          <Card>
            <CardHeader>
              <CardTitle>Supplier Outstanding</CardTitle>
              <CardDescription>Total Outstanding: {formatCurrency(reportData.total)}</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Supplier</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead className="text-right">Outstanding</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reportData.suppliers?.map((supp) => (
                    <TableRow key={supp.id}>
                      <TableCell className="font-medium">{supp.name}</TableCell>
                      <TableCell>{supp.phone || '-'}</TableCell>
                      <TableCell className="text-right font-mono text-red-600">{formatCurrency(supp.outstanding_balance)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        );

      case 'purchases':
        return (
          <Card>
            <CardHeader>
              <CardTitle>Purchase Report</CardTitle>
              <CardDescription>
                Total Purchases: {formatCurrency(reportData.summary?.total_purchases)} | 
                Tax: {formatCurrency(reportData.summary?.total_tax)} | 
                Bills: {reportData.summary?.purchase_count}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Bill #</TableHead>
                    <TableHead>Supplier</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reportData.purchases?.map((pur) => (
                    <TableRow key={pur.id}>
                      <TableCell className="font-mono">{pur.bill_number}</TableCell>
                      <TableCell>{pur.Supplier?.name}</TableCell>
                      <TableCell>{formatDate(pur.bill_date)}</TableCell>
                      <TableCell className="text-right font-mono">{formatCurrency(pur.total_amount)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        );

      case 'expenses':
        return (
          <Card>
            <CardHeader>
              <CardTitle>Expense Report</CardTitle>
              <CardDescription>
                Total Expenses: {formatCurrency(reportData.totalExpenses)}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <Card className="bg-slate-50 border-none">
                  <CardHeader><CardTitle className="text-sm">By Category</CardTitle></CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {reportData.byCategory?.map((cat, i) => (
                        <div key={i} className="flex justify-between text-sm">
                          <span>{cat.category}</span>
                          <span className="font-mono font-medium">{formatCurrency(cat.total)}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reportData.expenses?.map((exp) => (
                      <TableRow key={exp.id}>
                        <TableCell>{formatDate(exp.date)}</TableCell>
                        <TableCell>{exp.category}</TableCell>
                        <TableCell className="max-w-xs truncate">{exp.description}</TableCell>
                        <TableCell className="text-right font-mono">{formatCurrency(exp.amount)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        );

      case 'stock':
        return (
          <Card>
            <CardHeader>
              <CardTitle>Stock Report</CardTitle>
              <CardDescription>
                Total Stock Value: {formatCurrency(reportData.totalStockValue)} | 
                Low Stock Items: {reportData.lowStock?.length}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead className="text-right">Stock</TableHead>
                    <TableHead className="text-right">Alert Level</TableHead>
                    <TableHead className="text-right">Value</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reportData.products?.map((prod) => (
                    <TableRow key={prod.id} className={parseFloat(prod.stock_quantity) <= parseFloat(prod.low_stock_alert) ? 'bg-amber-50' : ''}>
                      <TableCell className="font-medium">{prod.name}</TableCell>
                      <TableCell className="text-right font-mono">{prod.stock_quantity} {prod.unit}</TableCell>
                      <TableCell className="text-right font-mono text-slate-500">{prod.low_stock_alert}</TableCell>
                      <TableCell className="text-right font-mono">{formatCurrency(prod.stock_quantity * prod.purchase_price)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in" data-testid="reports-page">
      <div>
        <h1 className="font-heading text-2xl md:text-3xl font-bold text-slate-900">Reports</h1>
        <p className="text-slate-600">Analyze your business performance</p>
      </div>

      {/* Date Range Selector */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Label>From:</Label>
              <Input type="date" value={dateRange.startDate} onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })} className="w-40" data-testid="report-start-date" />
            </div>
            <div className="flex items-center gap-2">
              <Label>To:</Label>
              <Input type="date" value={dateRange.endDate} onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })} className="w-40" data-testid="report-end-date" />
            </div>
            {activeReport && (
              <Button onClick={() => fetchReport(activeReport)} className="bg-emerald-600 hover:bg-emerald-700" data-testid="refresh-report-btn">
                Refresh Report
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Report Selection */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        <ReportCard title="Sales Report" description="View all sales invoices" icon={FileText} color="emerald" onClick={() => fetchReport('sales')} />
        <ReportCard title="Profit & Loss" description="Revenue and expenses" icon={TrendingUp} color="blue" onClick={() => fetchReport('profit-loss')} />
        <ReportCard title="GST Report" description="Tax summary" icon={IndianRupee} color="purple" onClick={() => fetchReport('gst')} />
        <ReportCard title="Customer Outstanding" description="Pending receivables" icon={Users} color="amber" onClick={() => fetchReport('customer-outstanding')} />
        <ReportCard title="Supplier Outstanding" description="Pending payables" icon={Truck} color="amber" onClick={() => fetchReport('supplier-outstanding')} />
        <ReportCard title="Stock Report" description="Inventory overview" icon={Package} color="purple" onClick={() => fetchReport('stock')} />
        <ReportCard title="Purchase Report" description="All purchases" icon={FileText} color="blue" onClick={() => fetchReport('purchases')} />
        <ReportCard title="Expense Report" description="Expense breakdown" icon={BarChart3} color="emerald" onClick={() => fetchReport('expenses')} />
      </div>

      {/* Report Content */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        renderReportContent()
      )}
    </div>
  );
};

export default ReportsPage;
