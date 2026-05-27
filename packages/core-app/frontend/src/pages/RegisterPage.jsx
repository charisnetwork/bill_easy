import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { InputGroup } from '../components/ui/input-group';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Building2, Mail, Lock, User, Phone, Eye, EyeOff, MapPin, Hash, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { getErrorMessage } from '../config/api';

export const RegisterPage = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    companyName: '',
    name: '',
    email: '',
    phone: '',
    password: '',
    gstNumber: '',
    address: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await register(formData);
      toast.success('Account created successfully!');
      navigate('/settings?firstTime=true');
    } catch (error) {
      const message = getErrorMessage(error, 'Registration failed');
      toast.error(message);
      console.error('Registration error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left side - Branding */}
      <div className="hidden lg:flex flex-1 hero-gradient items-center justify-center p-12">
        <div className="max-w-md text-center">
          <h2 className="font-heading text-3xl font-bold text-white mb-4">
            Start Your Business Journey
          </h2>
          <p className="text-slate-300 text-lg">
            Join thousands of businesses using Bill Easy to streamline their billing and inventory management.
          </p>
          
          <div className="mt-12 space-y-4 text-left">
            <div className="flex items-center gap-4 bg-white/10 rounded-lg p-4">
              <div className="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">1</span>
              </div>
              <div>
                <p className="font-semibold text-white">Create Your Account</p>
                <p className="text-sm text-slate-300">Enter your business details</p>
              </div>
            </div>
            <div className="flex items-center gap-4 bg-white/10 rounded-lg p-4">
              <div className="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">2</span>
              </div>
              <div>
                <p className="font-semibold text-white">Set Up Your Products</p>
                <p className="text-sm text-slate-300">Add your inventory items</p>
              </div>
            </div>
            <div className="flex items-center gap-4 bg-white/10 rounded-lg p-4">
              <div className="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">3</span>
              </div>
              <div>
                <p className="font-semibold text-white">Start Creating Invoices</p>
                <p className="text-sm text-slate-300">Generate professional bills instantly</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Form */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-gradient-to-br from-slate-50 to-slate-100 overflow-y-auto">
        <div className="w-full max-w-2xl py-4 sm:py-6">
          <Link to="/" className="flex items-center gap-2 mb-6 sm:mb-8">
            <div className="w-10 h-10 bg-emerald-600 rounded-lg flex items-center justify-center">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <span className="font-heading font-bold text-2xl text-slate-900">Bill Easy</span>
          </Link>

          {/* Glassmorphism Card */}
          <Card className="glass-card border-0 shadow-xl">
            <CardHeader className="px-5 sm:px-8 pb-4">
              <CardTitle className="font-heading text-2xl sm:text-3xl">Create your account</CardTitle>
              <CardDescription className="text-sm sm:text-base mt-1">Start your 14-day free trial today</CardDescription>
            </CardHeader>
            <CardContent className="px-5 sm:px-8 pb-6 sm:pb-8">
              <form onSubmit={handleSubmit}>
                {/* 2-Column Grid Layout */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5">
                  
                  {/* Company Name - Full Width */}
                  <div className="sm:col-span-2 space-y-2">
                    <Label htmlFor="companyName" className="text-sm font-semibold text-slate-700">
                      Company Name <span className="text-red-500">*</span>
                    </Label>
                    <InputGroup
                      id="companyName"
                      placeholder="Your Company Pvt Ltd"
                      value={formData.companyName}
                      onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                      leftIcon={<Building2 className="w-[18px] h-[18px]" />}
                      required
                      data-testid="register-company-input"
                    />
                  </div>

                  {/* Your Name */}
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-sm font-semibold text-slate-700">
                      Your Name <span className="text-red-500">*</span>
                    </Label>
                    <InputGroup
                      id="name"
                      placeholder="John Doe"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      leftIcon={<User className="w-[18px] h-[18px]" />}
                      required
                      data-testid="register-name-input"
                    />
                  </div>

                  {/* Email */}
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-semibold text-slate-700">
                      Email <span className="text-red-500">*</span>
                    </Label>
                    <InputGroup
                      id="email"
                      type="email"
                      placeholder="you@company.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      leftIcon={<Mail className="w-[18px] h-[18px]" />}
                      required
                      data-testid="register-email-input"
                    />
                  </div>

                  {/* Phone */}
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-sm font-semibold text-slate-700">
                      Phone
                    </Label>
                    <InputGroup
                      id="phone"
                      type="tel"
                      placeholder="9876543210"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      leftIcon={<Phone className="w-[18px] h-[18px]" />}
                      data-testid="register-phone-input"
                    />
                  </div>

                  {/* GST Number */}
                  <div className="space-y-2">
                    <Label htmlFor="gstNumber" className="text-sm font-semibold text-slate-700">
                      GST Number <span className="text-slate-400 font-normal">(Optional)</span>
                    </Label>
                    <InputGroup
                      id="gstNumber"
                      placeholder="22AAAAA0000A1Z5"
                      value={formData.gstNumber}
                      onChange={(e) => setFormData({ ...formData, gstNumber: e.target.value })}
                      leftIcon={<Hash className="w-[18px] h-[18px]" />}
                      data-testid="register-gst-input"
                    />
                  </div>

                  {/* Password */}
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-sm font-semibold text-slate-700">
                      Password <span className="text-red-500">*</span>
                    </Label>
                    <InputGroup
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Min 6 characters"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      leftIcon={<Lock className="w-[18px] h-[18px]" />}
                      rightElement={
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="w-9 h-9 flex items-center justify-center rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all focus:outline-none focus:ring-2 focus:ring-[#1E40AF]/20"
                          aria-label={showPassword ? 'Hide password' : 'Show password'}
                        >
                          {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      }
                      required
                      minLength={6}
                      data-testid="register-password-input"
                    />
                  </div>

                  {/* Business Address - Full Width */}
                  <div className="sm:col-span-2 space-y-2">
                    <Label htmlFor="address" className="text-sm font-semibold text-slate-700">
                      Business Address
                    </Label>
                    <InputGroup
                      id="address"
                      placeholder="123 Business Street, City, State - PIN"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      leftIcon={<MapPin className="w-[18px] h-[18px]" />}
                      data-testid="register-address-input"
                    />
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className="w-full h-12 mt-8 text-base font-semibold bg-[#1E40AF] hover:bg-[#1E3A8A] hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center gap-2"
                  disabled={loading}
                  data-testid="register-submit-btn"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Creating Account...</span>
                    </>
                  ) : 'Create Account'}
                </Button>
              </form>

              <p className="text-center text-sm text-slate-600 mt-6">
                Already have an account?{' '}
                <Link to="/login" className="text-[#1E40AF] hover:text-[#1E3A8A] font-semibold hover:underline transition-colors" data-testid="login-link">
                  Sign in
                </Link>
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
