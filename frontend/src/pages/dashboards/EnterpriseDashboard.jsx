import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { 
  Rocket, Plus, FileText, Users, Package, 
  TrendingUp, TrendingDown, ArrowRight, Truck, 
  Globe, ShieldCheck, Zap
} from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area
} from 'recharts';

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency', currency: 'INR', maximumFractionDigits: 0
  }).format(amount || 0);
};

const EnterpriseDashboard = ({ data }) => {
  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12 animate-fade-in">
      {/* High-End Header */}
      <div className="relative overflow-hidden bg-slate-900 rounded-[2rem] p-8 text-white shadow-2xl">
        <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl" />
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-gradient-to-br from-emerald-400 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Rocket className="w-10 h-10 text-white fill-white/20" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-400">Enterprise Edition</span>
              </div>
              <h1 className="text-4xl font-black tracking-tight">Business Intelligence</h1>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <div className="px-6 py-3 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Active Businesses</p>
              <p className="text-xl font-black">
                {String(data.activeBusinessesCount || 0).padStart(2, '0')} 
                <span className="text-xs font-medium text-slate-500"> / {String(data.totalBusinessesLimit || 0).padStart(2, '0')}</span>
              </p>
            </div>
            <Link to="/invoices/new">
              <Button className="h-14 bg-emerald-500 hover:bg-emerald-400 text-slate-900 px-8 font-black rounded-2xl shadow-xl shadow-emerald-500/20">
                <Plus className="w-6 h-6 mr-2 stroke-[3px]" />
                DIRECT BILLING
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { title: "Revenue Flow", value: data.monthlySales, icon: Zap, color: 'emerald' },
          { title: "Net Profitability", value: data.netProfit, icon: TrendingUp, color: 'blue' },
          { title: "Market Receivables", value: data.pendingPayments, icon: Globe, color: 'amber' },
          { title: "Operating Expenses", value: data.monthlyExpenses, icon: TrendingDown, color: 'rose' },
        ].map((stat, i) => (
          <Card key={i} className="border-none shadow-sm bg-white overflow-hidden">
            <CardContent className="p-6">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] mb-2">{stat.title}</p>
              <div className="flex items-end justify-between">
                <h3 className="text-2xl font-black text-slate-900">{formatCurrency(stat.value)}</h3>
                <div className={`p-2 rounded-lg bg-${stat.color}-50 text-${stat.color}-600`}>
                  <stat.icon className="w-5 h-5" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2 border-none shadow-sm h-full">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-xl font-black">Performance Analytics</CardTitle>
              <CardDescription>Consolidated sales data across all locations</CardDescription>
            </div>
            <Select defaultValue="7d">
              <button className="text-xs font-bold text-slate-400 hover:text-slate-900 transition-colors uppercase tracking-widest flex items-center gap-2">
                Last 7 Days <ArrowRight className="w-3 h-3" />
              </button>
            </Select>
          </CardHeader>
          <CardContent>
            <div className="h-[350px] w-full mt-6">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.salesChartData}>
                  <defs>
                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} hide />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                  />
                  <Area type="monotone" dataKey="sales" stroke="#10b981" strokeWidth={4} fillOpacity={1} fill="url(#colorSales)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="border-none shadow-sm bg-gradient-to-br from-indigo-600 to-blue-700 text-white">
            <CardHeader>
              <CardTitle className="text-lg">Supply Chain</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-white/10 rounded-2xl">
                <div className="flex items-center gap-3">
                  <Truck className="w-5 h-5 text-indigo-200" />
                  <span className="text-sm font-bold tracking-tight">Active E-Way Bills</span>
                </div>
                <span className="px-3 py-1 bg-white/20 rounded-full text-xs font-black italic">12</span>
              </div>
              <Link to="/eway-bills/new">
                <Button className="w-full bg-white text-indigo-600 hover:bg-slate-50 font-black h-12 rounded-xl">
                  MANAGE LOGISTICS
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm">
            <CardHeader><CardTitle className="text-lg font-black italic underline decoration-emerald-500 underline-offset-4">Advanced Modules</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-2 gap-3">
              {[
                { n: 'Reports', i: FileText },
                { n: 'Inventory', i: Package },
                { n: 'Users', i: Users },
                { n: 'Global', i: Globe }
              ].map((m, idx) => (
                <div key={idx} className="flex flex-col items-center justify-center p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:border-emerald-200 hover:bg-emerald-50 transition-all cursor-pointer group">
                  <m.i className="w-6 h-6 text-slate-400 group-hover:text-emerald-600 mb-2" />
                  <span className="text-[10px] font-black uppercase text-slate-500 group-hover:text-emerald-700">{m.n}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

const Select = ({ children }) => <div>{children}</div>; // Placeholder

export default EnterpriseDashboard;
