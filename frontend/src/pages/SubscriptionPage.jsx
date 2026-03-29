import React, { useState, useEffect } from 'react';
import { subscriptionAPI } from '../services/api';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { CheckCircle2, XCircle, Crown, Zap, Rocket, MonitorSmartphone, Users2, Building2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const formatCurrency = (amount) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount || 0);

export const SubscriptionPage = () => {
  const [plans, setPlans] = useState([]);
  const [currentSubscription, setCurrentSubscription] = useState(null);
  const [usage, setUsage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [validatingCoupon, setValidatingCoupon] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState(null);

  // The master list of all possible features across all plans
  const ALL_FEATURES = [
    { id: 'gst_billing', label: 'GST Invoicing' },
    { id: 'inventory_management', label: 'Inventory Management' },
    { id: 'reports', label: '25+ Reports' },
    { id: 'quotations', label: 'Quotations & Estimates' },
    { id: 'eway_bills', label: 'E-way Bills', premiumLimit: '5/month', enterpriseLimit: 'Unlimited' },
    { id: 'staff_attendance_payroll', label: 'Staff Attendance & Payroll' },
    { id: 'multi_godowns', label: 'Multiple Godowns/Warehouses' },
    { id: 'manage_businesses', label: 'Manage Multiple Businesses' },
    { id: 'user_activity_tracker', label: 'User Activity Tracker' },
    { id: 'priority_support', label: 'Priority Support' },
  ];

  const fetchData = async () => {
    try {
      const plansRes = await subscriptionAPI.getPlans();
      const filtered = plansRes.data.filter(p => ['Free Account', 'Premium', 'Enterprise'].includes(p.plan_name));
      setPlans(filtered);
      
      const subRes = await subscriptionAPI.getCurrent();
      setCurrentSubscription(subRes.data);

      const usageRes = await subscriptionAPI.getUsage();
      setUsage(usageRes.data);
    } catch (error) {
      console.error('Error loading subscription data:', error);
      toast.error('Error loading subscription details');
    } finally {
      setLoading(false);
    }
  };

  const handleValidateCoupon = async (planId) => {
    if (!couponCode) return;
    try {
      setValidatingCoupon(true);
      const res = await subscriptionAPI.validateCoupon({ code: couponCode, plan_id: planId });
      setAppliedCoupon({ ...res.data, planId });
      toast.success('Coupon applied successfully!');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Invalid coupon code');
      setAppliedCoupon(null);
    } finally {
      setValidatingCoupon(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleUpgrade = async (plan) => {
    const couponId = (appliedCoupon && appliedCoupon.planId === plan.id) ? appliedCoupon.coupon_id : null;
    const finalPrice = couponId ? appliedCoupon.finalPrice : plan.price;

    if (plan.price === 0 || finalPrice === 0) {
      try {
        setUpgrading(true);
        await subscriptionAPI.upgrade({ 
          plan_id: plan.id,
          coupon_id: couponId
        });
        toast.success(`Switched to ${plan.plan_name} successfully`);
        setAppliedCoupon(null);
        setCouponCode('');
        fetchData();
      } catch (error) {
        toast.error('Failed to switch plan');
      } finally {
        setUpgrading(false);
      }
      return;
    }

    try {
      setUpgrading(true);
      const res = await subscriptionAPI.processPayment({ 
        plan_id: plan.id,
        coupon_id: couponId
      });
      const { order, key_id } = res.data;

      const options = {
        key: key_id,
        amount: order.amount,
        currency: order.currency,
        name: "BillEasy SaaS",
        description: `Upgrade to ${plan.plan_name} Plan`,
        order_id: order.id,
        handler: async (response) => {
          try {
            await subscriptionAPI.upgrade({
              plan_id: plan.id,
              payment_id: response.razorpay_payment_id,
              order_id: response.razorpay_order_id,
              signature: response.razorpay_signature,
              payment_reference: response.razorpay_payment_id,
              coupon_id: couponId
            });
            toast.success(`Successfully upgraded to ${plan.plan_name}!`);
            setAppliedCoupon(null);
            setCouponCode('');
            fetchData();
          } catch (err) {
            toast.error("Payment verification failed. Please contact support.");
          }
        },
        prefill: {
          name: "",
          email: "",
          contact: ""
        },
        theme: {
          color: "#10b981"
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to initiate payment');
    } finally {
      setUpgrading(false);
    }
  };

  if (loading) return <div className="flex justify-center p-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div></div>;

  return (
    <div className="max-w-[1400px] mx-auto p-4 md:p-10 bg-[#f8fafc]">
      {/* Usage Stats Section */}
      {usage && (
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          <Card className="bg-white border-slate-100">
            <CardContent className="p-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-slate-500">Invoices Used</span>
                <span className="text-xs font-bold text-emerald-600">{Math.round(usage.invoices.percentage)}%</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-emerald-500 h-full transition-all duration-500" 
                  style={{ width: `${Math.min(100, usage.invoices.percentage)}%` }}
                ></div>
              </div>
              <p className="mt-2 text-xs text-slate-400 font-medium">
                {usage.invoices.used} / {usage.invoices.limit} invoices this month
              </p>
            </CardContent>
          </Card>
          <Card className="bg-white border-slate-100">
            <CardContent className="p-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-slate-500">Products</span>
                <span className="text-xs font-bold text-blue-600">{Math.round(usage.products.percentage)}%</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-blue-500 h-full transition-all duration-500" 
                  style={{ width: `${Math.min(100, usage.products.percentage)}%` }}
                ></div>
              </div>
              <p className="mt-2 text-xs text-slate-400 font-medium">
                {usage.products.used} / {usage.products.limit} products total
              </p>
            </CardContent>
          </Card>
          <Card className="bg-white border-slate-100">
            <CardContent className="p-6">
              <span className="text-sm font-medium text-slate-500 block mb-1">Current Plan</span>
              <p className="text-xl font-bold text-slate-800">{currentSubscription?.Plan?.plan_name || 'Free Account'}</p>
              <p className="text-xs text-slate-400 mt-1">
                {currentSubscription?.expiry_date 
                  ? `Expires on ${new Date(currentSubscription.expiry_date).toLocaleDateString()}`
                  : 'Free Forever'}
              </p>
            </CardContent>
          </Card>
          <Card className="bg-white border-slate-100">
            <CardContent className="p-6">
              <span className="text-sm font-medium text-slate-500 block mb-1">Account Status</span>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${currentSubscription?.status === 'active' ? 'bg-emerald-500' : 'bg-orange-500'}`}></div>
                <p className="text-xl font-bold text-slate-800 capitalize">{currentSubscription?.status || 'Active'}</p>
              </div>
              <p className="text-xs text-slate-400 mt-1">Renewal auto-calculated</p>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold text-slate-800">
          {currentSubscription?.Plan?.plan_name === 'Free Account' ? "Choose the best plan to grow your business" : "Upgrade your plan for more features"}
        </h1>
        <p className="text-slate-500 mt-2">Scale your business with advanced billing and inventory tools</p>
        <div className="flex justify-center mt-4">
            <Badge className="bg-emerald-50 text-emerald-600 border-emerald-200">🛡️ 7 days moneyback guarantee</Badge>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {plans.map((plan) => {
          const isFree = plan.plan_name === 'Free Account';
          const isPremium = plan.plan_name === 'Premium';
          const isEnterprise = plan.plan_name === 'Enterprise';
          const isCurrent = currentSubscription?.plan_id === plan.id;

          return (
            <Card key={plan.id} className={`border-t-4 shadow-sm bg-white flex flex-col ${
                isPremium ? 'border-t-orange-500' : isEnterprise ? 'border-t-emerald-500' : 'border-t-slate-300'
            }`}>
              <CardHeader className="p-6 text-left border-b border-slate-50">
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle className="text-2xl font-bold text-slate-800">{plan.plan_name}</CardTitle>
                        <p className={`text-sm mt-1 font-medium ${isPremium ? 'text-orange-600' : isEnterprise ? 'text-emerald-600' : 'text-slate-500'}`}>
                            {isFree ? 'Start for free' : isPremium ? 'More flexibility' : 'Fully customizable'}
                        </p>
                    </div>
                    {isPremium && <Badge className="bg-orange-500 hover:bg-orange-600 text-white">👑 Most Popular</Badge>}
                </div>
                <div className="mt-6">
                  {plan.price > 0 ? (
                    <div className="space-y-1">
                      <div className="flex items-baseline gap-2">
                        {appliedCoupon && appliedCoupon.planId === plan.id && (
                          <span className="text-2xl line-through text-slate-400">{formatCurrency(plan.price)}</span>
                        )}
                        <span className="text-4xl font-black text-slate-900">
                          {appliedCoupon && appliedCoupon.planId === plan.id ? formatCurrency(appliedCoupon.finalPrice) : formatCurrency(plan.price)}
                        </span>
                        <span className="text-slate-500 text-sm font-medium">/3 month</span>
                      </div>
                      <p className="text-xs text-slate-400">Approx. {formatCurrency(Math.round((appliedCoupon && appliedCoupon.planId === plan.id ? appliedCoupon.finalPrice : plan.price)/3))}/month</p>
                    </div>
                  ) : (
                    <div className="h-14 flex items-baseline gap-2">
                        <span className="text-4xl font-black text-slate-900">Free</span>
                        <span className="text-slate-500 text-sm font-medium">Forever</span>
                    </div>
                  )}
                </div>

                {!isFree && !isCurrent && (
                  <div className="mt-4 flex gap-2">
                    <input
                      type="text"
                      placeholder="Coupon Code"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      className="flex-1 px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 border-slate-200"
                    />
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleValidateCoupon(plan.id)}
                      disabled={validatingCoupon}
                      className="border-emerald-600 text-emerald-600 hover:bg-emerald-50"
                    >
                      {validatingCoupon ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Apply'}
                    </Button>
                  </div>
                )}

                <Button 
                  className={`w-full mt-6 py-6 text-lg font-bold border transition-all ${
                    isCurrent 
                      ? 'bg-slate-50 text-slate-400 border-slate-100' 
                      : isPremium 
                        ? 'bg-orange-500 text-white border-orange-500 hover:bg-orange-600' 
                        : 'bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700'
                  }`} 
                  disabled={isCurrent || upgrading}
                  onClick={() => handleUpgrade(plan)}
                >
                    {upgrading ? <Loader2 className="animate-spin h-5 w-5" /> : isCurrent ? 'Active Plan' : `Buy ${plan.plan_name}`}
                </Button>
              </CardHeader>

              <CardContent className="p-6 flex-grow space-y-6">
                {/* Access Details Section */}
                <div className="space-y-4 pb-6 border-b border-slate-100">
                    <div className="flex items-center gap-3 text-sm text-slate-600">
                        <Building2 size={18} className="text-slate-400" />
                        <span>Manage <strong>{plan.granular_features?.find(f => f.feature_key === 'manage_businesses')?.is_enabled ? plan.features?.manage_businesses : (plan.features?.manage_businesses || '1')} Business</strong></span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-slate-600">
                        <Users2 size={18} className="text-slate-400" />
                        <span>Access for <strong>{plan.max_users} Users</strong></span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-slate-600">
                        <Zap size={18} className="text-slate-400" />
                        <span><strong>{plan.max_invoices_per_month} Invoices</strong> /month</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-slate-600">
                        <MonitorSmartphone size={18} className="text-slate-400" />
                        <span>Auto sync across devices</span>
                    </div>
                </div>

                {/* Features Box Section */}
                <div>
                    <h3 className={`text-xs font-bold uppercase tracking-wider mb-4 ${isPremium ? 'text-orange-600' : isEnterprise ? 'text-emerald-600' : 'text-slate-500'}`}>
                        Features included
                    </h3>
                    <div className="space-y-4">
                        {ALL_FEATURES.map((feature) => {
                            const granularFeatures = plan.granular_features || [];
                            const granularFeature = granularFeatures.find(f => f.feature_key === feature.id);
                            
                            // Check both existing features JSON and new PlanFeature table
                            const isEnabled = granularFeature ? granularFeature.is_enabled : !!plan.features?.[feature.id];
                            
                            let label = feature.label;
                            if (feature.id === 'eway_bills' && isEnabled) {
                              label = `${feature.label} (${isPremium ? feature.premiumLimit : feature.enterpriseLimit})`;
                            }

                            return (
                                <div key={feature.id} className="flex items-start gap-3">
                                    {isEnabled ? (
                                        <CheckCircle2 size={18} className="text-emerald-500 mt-0.5 shrink-0" />
                                    ) : (
                                        <div className="flex items-center gap-1">
                                          <Crown size={16} className="text-amber-400 mt-0.5 shrink-0" />
                                          <span className="text-[10px] bg-amber-50 text-amber-600 px-1 rounded font-bold uppercase">Upgrade</span>
                                        </div>
                                    )}
                                    <span className={`text-sm ${!isEnabled ? 'text-slate-400' : 'text-slate-600 font-medium'}`}>
                                        {label}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
      
      <div className="mt-12 text-center text-xs text-slate-400">
        Prices are exclusive of 18% GST. Support: 9986995848
      </div>
    </div>
  );
};

export default SubscriptionPage;
