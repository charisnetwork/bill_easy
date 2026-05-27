import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { 
  IndianRupee, Plus, FileText, Package, 
  Zap, Building2
} from 'lucide-react';
import { toast } from 'sonner';

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency', currency: 'INR', maximumFractionDigits: 0
  }).format(amount || 0);
};

const FreeDashboard = ({ data }) => {
  const navigate = useNavigate();

  const handleRestrictedClick = (feature) => {
    toast.error(`Upgrade to Premium to unlock ${feature}`);
    navigate('/subscription');
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12 animate-fade-in">
      {/* Top Header with Add Business */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Zero Account Dashboard</h1>
          <p className="text-slate-500 font-medium">Manage your growing business</p>
        </div>
        <Button 
          onClick={() => handleRestrictedClick('Multiple Businesses')}
          className="bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-100 font-bold px-6"
        >
          <Building2 className="w-4 h-4 mr-2" />
          Add Business
        </Button>
      </div>

      {/* Promotion Banner */}
      <div className="bg-slate-900 rounded-[2rem] p-8 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
        <div className="relative z-10 space-y-2 text-center md:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-full text-[10px] font-black uppercase tracking-widest mb-2">
            Zero Account Active
          </div>
          <h2 className="text-3xl font-black tracking-tight">Ready to scale?</h2>
          <p className="text-slate-400 font-medium max-w-md">Upgrade to Premium for E-Way Bills, Multi-Business support, and Unlimited Godowns.</p>
        </div>
        <Link to="/subscription" className="relative z-10">
          <Button className="bg-emerald-500 hover:bg-emerald-400 text-slate-900 h-12 px-8 font-black rounded-2xl">
            UPGRADE NOW
          </Button>
        </Link>
      </div>

      {/* Usage Limits Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-none shadow-sm bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-400 flex justify-between">
              Monthly Invoices
              <span className="text-slate-900">{data.invoicesCount || 0} / 50</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
              <div 
                className="bg-emerald-500 h-full transition-all" 
                style={{ width: `${Math.min(((data.invoicesCount || 0) / 50) * 100, 100)}%` }}
              />
            </div>
            <p className="text-[10px] mt-2 text-slate-500 font-bold italic">Limit: 50 Invoices / Month</p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-400 flex justify-between">
              Total Products
              <span className="text-slate-900">{data.productsCount || 0} / 100</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
              <div 
                className="bg-blue-500 h-full transition-all" 
                style={{ width: `${Math.min(((data.productsCount || 0) / 100) * 100, 100)}%` }}
              />
            </div>
            <p className="text-[10px] mt-2 text-slate-500 font-bold italic">Limit: 100 Products total</p>
          </CardContent>
        </Card>
      </div>

      {/* Simplified Quick Actions (Only showing what's allowed) */}
      <div className="grid md:grid-cols-2 gap-6">
        <Link to="/invoices/new">
          <Card className="border-none shadow-sm hover:shadow-md transition-all group cursor-pointer bg-white">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-4 bg-emerald-50 rounded-2xl text-emerald-600 group-hover:scale-110 transition-transform">
                <Plus className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-black text-slate-800 text-lg">Create New Sale</h3>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Generate GST Invoice</p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link to="/products">
          <Card className="border-none shadow-sm hover:shadow-md transition-all group cursor-pointer bg-white">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-4 bg-blue-50 rounded-2xl text-blue-600 group-hover:scale-110 transition-transform">
                <Package className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-black text-slate-800 text-lg">Manage Products</h3>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Inventory Tracking</p>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 opacity-80">
        <Card className="border-none shadow-sm bg-white p-6">
          <div className="flex items-center gap-3">
            <IndianRupee className="w-5 h-5 text-slate-400" />
            <span className="text-xs font-black uppercase tracking-widest text-slate-400">Month Sales:</span>
            <span className="text-sm font-black text-slate-900">{formatCurrency(data.monthlySales)}</span>
          </div>
        </Card>
        <Card className="border-none shadow-sm bg-white p-6">
          <div className="flex items-center gap-3">
            <FileText className="w-5 h-5 text-slate-400" />
            <span className="text-xs font-black uppercase tracking-widest text-slate-400">Receivables:</span>
            <span className="text-sm font-black text-slate-900">{formatCurrency(data.pendingPayments)}</span>
          </div>
        </Card>
        <Card className="border-none shadow-sm bg-white p-6">
          <div className="flex items-center gap-3">
            <Zap className="w-5 h-5 text-slate-400" />
            <span className="text-xs font-black uppercase tracking-widest text-slate-400">Net Profit:</span>
            <span className="text-sm font-black text-slate-900">{formatCurrency(data.netProfit)}</span>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default FreeDashboard;
