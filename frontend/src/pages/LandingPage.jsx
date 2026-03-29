import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import Footer from '../components/Footer';
import { 
  FileText, Package, Users, BarChart3, Shield, Smartphone,
  CheckCircle, ArrowRight, Star, Building2
} from 'lucide-react';

const features = [
  {
    icon: FileText,
    title: 'GST Invoicing',
    description: 'Create professional GST-compliant invoices in seconds with automatic tax calculations.'
  },
  {
    icon: Package,
    title: 'Inventory Management',
    description: 'Track stock levels, set alerts, and manage multiple warehouses effortlessly.'
  },
  {
    icon: Users,
    title: 'Customer & Supplier',
    description: 'Maintain complete records with ledgers, payment history, and outstanding balances.'
  },
  {
    icon: BarChart3,
    title: '25+ Reports',
    description: 'Get insights with sales, purchase, P&L, GST, and stock reports with export options.'
  },
  {
    icon: Shield,
    title: 'Secure & Reliable',
    description: 'Bank-grade security with encrypted data storage and automatic backups.'
  },
  {
    icon: Smartphone,
    title: 'Works Everywhere',
    description: 'Access your business data from desktop, tablet, or mobile anytime, anywhere.'
  }
];

const plans = [
  { 
    name: 'Zero Account', 
    price: '0', 
    period: 'Free Forever',
    features: ['50 Invoices/month', '100 Products', 'Basic Billing', 'Reports'],
    popular: false 
  },
  { 
    name: 'Premium', 
    price: '299', 
    period: '+ tax / 3 Months',
    features: [
      'Manage 3 Businesses',
      '5 Users Access',
      'GST Billing & Inventory',
      'E-Way Bills Generation',
      'Reports & Analytics',
      'Quotations & Estimates'
    ], 
    popular: true 
  },
  { 
    name: 'Enterprise', 
    price: '699', 
    period: '+ tax / 3 Months',
    features: [
      'Manage 10 Businesses',
      '20 Users Access',
      'Unlimited Godowns',
      'Everything in Premium',
      'Priority Support',
      'Advanced Inventory'
    ],
    popular: false
  }
];

export const LandingPage = () => {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass">
        <div className="container mx-auto px-4 md:px-6 max-w-7xl">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
                <Building2 className="w-5 h-5 text-white" />
              </div>
              <span className="font-heading font-bold text-xl text-slate-900">Bill Easy</span>
            </Link>
            
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-sm text-slate-600 hover:text-slate-900 transition-colors">Features</a>
              <a href="#pricing" className="text-sm text-slate-600 hover:text-slate-900 transition-colors">Pricing</a>
            </div>

            <div className="flex items-center gap-3">
              <Link to="/login">
                <Button variant="ghost" data-testid="login-btn">Login</Button>
              </Link>
              <Link to="/register">
                <Button className="bg-emerald-600 hover:bg-emerald-700" data-testid="get-started-btn">
                  Get Started Free
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 hero-gradient relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-72 h-72 bg-emerald-500 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-blue-500 rounded-full blur-3xl"></div>
        </div>
        
        <div className="container mx-auto px-4 md:px-6 max-w-7xl relative">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="text-left animate-fade-in">
              <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-2 mb-6">
                <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                <span className="text-sm text-slate-300">Trusted by 10,000+ businesses</span>
              </div>
              
              <h1 className="font-heading text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6">
                Billing made easy
                <span className="text-emerald-400"> Streamline your invoicing process.</span>
              </h1>
              
              <p className="text-lg text-slate-300 mb-8 max-w-lg">
                All-in-one billing software for Indian SMBs. Create GST invoices, manage inventory, 
                track expenses, and grow your business.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link to="/register">
                  <Button size="lg" className="bg-emerald-500 hover:bg-emerald-600 text-white px-8 w-full sm:w-auto" data-testid="hero-cta-btn">
                    Start Free Trial
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </Link>
                <Button size="lg" variant="outline" className="border-slate-500 text-white hover:bg-white/10">
                  Watch Demo
                </Button>
              </div>

              <div className="flex items-center gap-6 mt-8 text-sm text-slate-400">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  <span>No credit card required</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  <span>14-day free trial</span>
                </div>
              </div>
            </div>

            <div className="hidden md:block">
              <div className="relative">
                <div className="bg-white rounded-2xl shadow-2xl p-6 transform rotate-2 hover:rotate-0 transition-transform duration-300">
                  <div className="flex items-center justify-between mb-4">
                    <span className="font-heading font-semibold text-slate-900">Dashboard Overview</span>
                    <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded">Live</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-50 rounded-lg p-4">
                      <p className="text-xs text-slate-500 mb-1">Today's Sales</p>
                      <p className="text-2xl font-bold text-slate-900 font-mono">₹45,250</p>
                    </div>
                    <div className="bg-slate-50 rounded-lg p-4">
                      <p className="text-xs text-slate-500 mb-1">Monthly Revenue</p>
                      <p className="text-2xl font-bold text-emerald-600 font-mono">₹3.2L</p>
                    </div>
                    <div className="bg-slate-50 rounded-lg p-4">
                      <p className="text-xs text-slate-500 mb-1">Pending</p>
                      <p className="text-2xl font-bold text-amber-600 font-mono">₹28,400</p>
                    </div>
                    <div className="bg-slate-50 rounded-lg p-4">
                      <p className="text-xs text-slate-500 mb-1">Net Profit</p>
                      <p className="text-2xl font-bold text-slate-900 font-mono">₹1.8L</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-slate-50">
        <div className="container mx-auto px-4 md:px-6 max-w-7xl">
          <div className="text-center mb-16">
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              Everything You Need to Run Your Business
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              From invoicing to inventory, get all the tools you need in one powerful platform.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div 
                key={index}
                className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow duration-200 card-hover"
                data-testid={`feature-card-${index}`}
              >
                <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-emerald-600" />
                </div>
                <h3 className="font-heading text-xl font-semibold text-slate-900 mb-2">{feature.title}</h3>
                <p className="text-slate-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20">
        <div className="container mx-auto px-4 md:px-6 max-w-7xl">
          <div className="text-center mb-16">
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Start free and upgrade as your business grows. No hidden fees.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {plans.map((plan, index) => (
              <div 
                key={index}
                className={`bg-white rounded-xl p-6 border-2 transition-all duration-200 ${
                  plan.popular 
                    ? 'border-emerald-500 shadow-lg scale-105' 
                    : 'border-slate-200 hover:border-slate-300'
                }`}
                data-testid={`pricing-card-${plan.name.toLowerCase()}`}
              >
                {plan.popular && (
                  <span className="bg-emerald-500 text-white text-xs font-semibold px-3 py-1 rounded-full">
                    Most Popular
                  </span>
                )}
                <h3 className="font-heading text-xl font-semibold text-slate-900 mt-4">{plan.name}</h3>
                <div className="flex items-baseline gap-1 mt-2 mb-6">
                  <span className="text-4xl font-bold text-slate-900">₹{plan.price}</span>
                  <span className="text-slate-500 text-xs font-medium">{plan.period}</span>
                </div>
                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-slate-600">
                      <CheckCircle className="w-4 h-4 text-emerald-500" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Link to="/register">
                  <Button 
                    className={`w-full ${plan.popular ? 'bg-emerald-600 hover:bg-emerald-700' : ''}`}
                    variant={plan.popular ? 'default' : 'outline'}
                  >
                    Get Started
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 hero-gradient">
        <div className="container mx-auto px-4 md:px-6 max-w-7xl text-center">
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Simplify Your Business?
          </h2>
          <p className="text-lg text-slate-300 mb-8 max-w-2xl mx-auto">
            Join thousands of businesses already using Bill Easy App to manage their billing and inventory.
          </p>
          <Link to="/register">
            <Button size="lg" className="bg-emerald-500 hover:bg-emerald-600 text-white px-8">
              Start Your Free Trial
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <Footer />

    </div>
  );
};

export default LandingPage;
