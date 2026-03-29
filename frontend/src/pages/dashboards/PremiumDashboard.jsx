import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { 
  IndianRupee, Plus, FileText, Users, Package, 
  ArrowRight, Crown, TrendingUp, Calendar, Clock,
  Truck
} from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency', currency: 'INR', maximumFractionDigits: 0
  }).format(amount || 0);
};

const PremiumDashboard = ({ data }) => {
  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-amber-100 rounded-2xl text-amber-600 shadow-inner">
            <Crown className="w-8 h-8 fill-amber-600" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Premium Dashboard</h1>
            <p className="text-slate-500 font-medium text-sm uppercase tracking-widest">Enhanced Analytics & Multi-Business</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/eway-bills/new">
            <Button variant="outline" className="h-11 border-2 border-indigo-100 text-indigo-600 font-bold px-6">
              <Truck className="w-4 h-4 mr-2" /> E-Way Bill
            </Button>
          </Link>
          <Link to="/invoices/new">
            <Button className="h-11 bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-100 px-6 font-bold">
              <Plus className="w-5 h-5 mr-2" /> New Sales
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { title: "Today's Sales", value: data.todaySales, icon: IndianRupee, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { title: "Monthly Revenue", value: data.monthlySales, icon: Calendar, color: 'text-blue-600', bg: 'bg-blue-50' },
          { title: "Invoices (500 limit)", value: `${data.invoicesCount || 0} / 500`, icon: FileText, color: 'text-amber-600', bg: 'bg-amber-50', isString: true },
          { title: "Products (1000 limit)", value: `${data.productsCount || 0} / 1000`, icon: Package, color: 'text-indigo-600', bg: 'bg-indigo-50', isString: true },
        ].map((stat, i) => (
          <Card key={i} className="border-none shadow-sm overflow-hidden">
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stat.title}</p>
                  <p className="text-xl font-black text-slate-900">{stat.isString ? stat.value : formatCurrency(stat.value)}</p>
                </div>
                <div className={`p-2.5 rounded-lg ${stat.bg} ${stat.color}`}><stat.icon className="w-5 h-5" /></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2 border-none shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-black">Sales Performance</CardTitle>
            <CardDescription>7-day trend analysis</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[280px] w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.salesChartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="date" hide />
                  <YAxis hide />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    formatter={(value) => [formatCurrency(value), 'Sales']}
                  />
                  <Line type="monotone" dataKey="sales" stroke="#10b981" strokeWidth={4} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-slate-900 text-white">
          <CardHeader>
            <CardTitle className="text-lg">Unlocked Premium Modules</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {[
              { label: 'Multi-Business (Up to 2)', link: '/settings', icon: Building2 },
              { label: 'Staff & Payroll (2 Staff + 1 CA)', link: '/staff', icon: Users },
              { label: 'E-Way Bills (50/year)', link: '/eway-bills', icon: Truck },
              { label: 'Custom Invoice Themes', link: '/settings', icon: Crown },
              { label: 'Desktop App Auto-Sync', link: '#', icon: FileText },
              { label: 'Barcode Generation', link: '/products', icon: Package },
            ].map((m, i) => (
              <Link key={i} to={m.link} className="flex items-center justify-between p-3 rounded-xl hover:bg-white/5 transition-colors border border-white/5">
                <span className="text-sm font-medium">{m.label}</span>
                <ArrowRight className="w-4 h-4 text-white/30" />
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

const Building2 = ({ className }) => <Users className={className} />; // Placeholder

export default PremiumDashboard;
