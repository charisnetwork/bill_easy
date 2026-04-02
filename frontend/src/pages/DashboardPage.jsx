import React, { useState, useEffect } from 'react';
import { reportAPI } from '../services/api';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';

import FreeDashboard from './dashboards/FreeDashboard';
import PremiumDashboard from './dashboards/PremiumDashboard';
import EnterpriseDashboard from './dashboards/EnterpriseDashboard';

export const DashboardPage = () => {
  const { subscription, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState({
    todaySales: 0,
    monthlySales: 0,
    pendingPayments: 0,
    monthlyExpenses: 0,
    grossProfit: 0,
    netProfit: 0,
    salesChartData: [],
    invoicesCount: 0,
    productsCount: 0,
    activeBusinessesCount: 1,
    totalBusinessesLimit: 1
  });

  useEffect(() => {
    let isMounted = true;
    const fetchDashboard = async () => {
      try {
        const response = await reportAPI.getDashboard();
        if (isMounted && response.data) {
          setDashboardData(prev => ({
            ...prev,
            ...response.data
          }));
        }
      } catch (error) {
        console.error('Dashboard load error:', error);
        // Don't toast if it's just a 401 (auth context will handle redirect)
        if (error.response?.status !== 401) {
          toast.error('Failed to load dashboard metrics');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    if (!authLoading) {
      fetchDashboard();
    }
    
    return () => { isMounted = false; };
  }, [authLoading]);

  if (authLoading || loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-500 font-black italic tracking-widest uppercase text-xs animate-pulse">Synchronizing Cloud Data...</p>
      </div>
    );
  }

  // Robust plan name detection
  const plan = subscription?.plan || subscription?.Plan;
  const planName = plan?.plan_name || 'Free Account';

  console.log('[Dashboard] Rendering for Plan:', planName);

  try {
    if (planName === 'Enterprise') return <EnterpriseDashboard data={dashboardData} />;
    if (planName === 'Premium') return <PremiumDashboard data={dashboardData} />;
    return <FreeDashboard data={dashboardData} />;
  } catch (err) {
    console.error('Dashboard Render Error:', err);
    return (
      <div className="p-8 text-center bg-white rounded-3xl shadow-sm border border-slate-100 max-w-2xl mx-auto mt-10">
        <h2 className="text-xl font-bold text-slate-800 mb-2">Dashboard Display Error</h2>
        <p className="text-slate-500 mb-4">We encountered a problem while displaying your business metrics.</p>
        <button 
          onClick={() => window.location.reload()}
          className="px-6 py-2 bg-emerald-600 text-white rounded-xl font-bold"
        >
          Refresh Dashboard
        </button>
      </div>
    );
  }
};

export default DashboardPage;
