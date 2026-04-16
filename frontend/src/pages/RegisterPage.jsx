import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Building2, Mail, Lock, User, Phone, Eye, EyeOff, MapPin, Search, Check, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { industries } from "../lib/industryConfig";
import api from '../services/api';

const companyTypes = [
  "Sole Proprietorship",
  "Partnership", 
  "LLP",
  "Private Limited",
  "Public Limited",
  "One Person Company",
  "Government Sector",
  "NGO/Trust",
  "HUF",
  "Other"
];

const states = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", 
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", 
  "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", 
  "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", 
  "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", 
  "Uttar Pradesh", "Uttarakhand", "West Bengal", "Andaman and Nicobar Islands", 
  "Chandigarh", "Dadra and Nagar Haveli and Daman and Diu", "Delhi", 
  "Jammu and Kashmir", "Ladakh", "Lakshadweep", "Puducherry"
];

export const RegisterPage = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [gstLoading, setGstLoading] = useState(false);
  const [pincodeLoading, setPincodeLoading] = useState(false);
  const [gstValidated, setGstValidated] = useState(false);
  
  const [formData, setFormData] = useState({
    companyName: '',
    name: '',
    email: '',
    phone: '',
    password: '',
    gstNumber: '',
    address: '',
    pincode: '',
    city: '',
    state: '',
    companyType: 'Sole Proprietorship',
    businessCategory: 'Retail'
  });

  const [errors, setErrors] = useState({});

  // GST Validation
  const validateGST = (gstin) => {
    const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
    return gstRegex.test(gstin);
  };

  // Handle GST Lookup
  const handleGstLookup = async () => {
    const gstin = formData.gstNumber.trim().toUpperCase();
    
    if (!gstin) {
      toast.error("Please enter a GST number");
      return;
    }

    if (!validateGST(gstin)) {
      setErrors({ ...errors, gstNumber: "Invalid GST format. Use: 22AAAAA0000A1Z5" });
      toast.error("Please enter a valid 15-digit GST number");
      return;
    }

    setGstLoading(true);
    setErrors({ ...errors, gstNumber: null });
    
    try {
      const { data } = await api.get(`/utils/gst/${gstin}`);
      
      if (data) {
        toast.success("GST details validated successfully");
        setGstValidated(true);
        
        // Auto-fill company name if empty
        if (!formData.companyName && (data.legal_name || data.trade_name)) {
          setFormData(prev => ({ 
            ...prev, 
            companyName: data.trade_name || data.legal_name 
          }));
        }
        
        // Auto-fill address details
        if (data.address_details) {
          const addr = data.address_details;
          const fullAddr = `${addr.building_name || ''}, ${addr.street || ''}, ${addr.location || ''}`.replace(/^,\s*|,\s*$/g, '').trim();
          
          setFormData(prev => ({
            ...prev,
            address: fullAddr || prev.address,
            city: addr.city || prev.city,
            state: addr.state || prev.state,
            pincode: addr.pincode || prev.pincode
          }));
        }
      }
    } catch (error) {
      console.error("GST Lookup Error:", error);
      setGstValidated(false);
      const errorMsg = error.response?.data?.error || "Could not validate GST number";
      setErrors({ ...errors, gstNumber: errorMsg });
      toast.error(errorMsg);
    } finally {
      setGstLoading(false);
    }
  };

  // Handle Pincode Lookup
  const handlePincodeLookup = async () => {
    const pincode = formData.pincode.trim();
    
    if (!pincode || pincode.length !== 6) {
      setErrors({ ...errors, pincode: "Please enter a valid 6-digit pincode" });
      return;
    }

    setPincodeLoading(true);
    setErrors({ ...errors, pincode: null });
    
    try {
      const { data } = await api.get(`/utils/pincode/${pincode}`);
      
      if (data && data[0] && data[0].Status === "Success" && data[0].PostOffice && data[0].PostOffice.length > 0) {
        const postOffice = data[0].PostOffice[0];
        
        setFormData(prev => ({
          ...prev,
          city: postOffice.District || postOffice.Name,
          state: postOffice.State
        }));
        
        toast.success(`Location found: ${postOffice.District}, ${postOffice.State}`);
      } else {
        setErrors({ ...errors, pincode: "Invalid pincode or no data found" });
        toast.error("Could not find location for this pincode");
      }
    } catch (error) {
      console.error("Pincode Lookup Error:", error);
      setErrors({ ...errors, pincode: "Failed to fetch pincode details" });
      toast.error("Failed to fetch pincode details");
    } finally {
      setPincodeLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    // Validate GST if provided
    if (formData.gstNumber && !validateGST(formData.gstNumber)) {
      setErrors({ gstNumber: "Invalid GST format. Use: 22AAAAA0000A1Z5" });
      setLoading(false);
      toast.error("Please enter a valid GST number");
      return;
    }

    try {
      await register(formData);
      toast.success('Account created successfully!');
      navigate('/settings?firstTime=true');
    } catch (error) {
      const errorMsg = error.response?.data?.message || error.response?.data?.error || 'Registration failed';
      toast.error(errorMsg);
      if (error.response?.data?.error) {
        setErrors({ general: errorMsg });
      }
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
      <div className="flex-1 flex items-center justify-center p-8 bg-white overflow-y-auto">
        <div className="w-full max-w-lg py-8">
          <Link to="/" className="flex items-center gap-2 mb-8">
            <div className="w-10 h-10 bg-emerald-600 rounded-lg flex items-center justify-center">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <span className="font-heading font-bold text-2xl text-slate-900">Bill Easy</span>
          </Link>

          <Card className="border-0 shadow-none">
            <CardHeader className="px-0">
              <CardTitle className="font-heading text-2xl">Create your account</CardTitle>
              <CardDescription>Start your 14-day free trial today</CardDescription>
            </CardHeader>
            <CardContent className="px-0">
              <form onSubmit={handleSubmit} className="space-y-4">
                
                {/* Company Name */}
                <div className="space-y-2">
                  <Label htmlFor="companyName">Company Name *</Label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      id="companyName"
                      placeholder="Your Company Pvt Ltd"
                      value={formData.companyName}
                      onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                      className="pl-10"
                      required
                      data-testid="register-company-input"
                    />
                  </div>
                </div>

                {/* GST Number with Validation */}
                <div className="space-y-2">
                  <Label htmlFor="gstNumber">GST Number (Optional)</Label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Input
                        id="gstNumber"
                        placeholder="22AAAAA0000A1Z5"
                        value={formData.gstNumber}
                        onChange={(e) => {
                          const value = e.target.value.toUpperCase();
                          setFormData({ ...formData, gstNumber: value });
                          setGstValidated(false);
                          if (errors.gstNumber) setErrors({ ...errors, gstNumber: null });
                        }}
                        maxLength={15}
                        className={errors.gstNumber ? "border-red-500" : gstValidated ? "border-green-500" : ""}
                        data-testid="register-gst-input"
                      />
                      {gstValidated && (
                        <Check className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-500" />
                      )}
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleGstLookup}
                      disabled={gstLoading || formData.gstNumber.length < 15}
                      className="whitespace-nowrap"
                    >
                      {gstLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4 mr-1" />}
                      Validate
                    </Button>
                  </div>
                  {errors.gstNumber && (
                    <p className="text-xs text-red-500">{errors.gstNumber}</p>
                  )}
                  <p className="text-xs text-slate-500">Enter 15-digit GSTIN to auto-fill address details</p>
                </div>

                {/* Business Category */}
                <div className="space-y-2">
                  <Label htmlFor="businessCategory">Business Category *</Label>
                  <select
                    id="businessCategory"
                    value={formData.businessCategory}
                    onChange={(e) => setFormData({ ...formData, businessCategory: e.target.value })}
                    className="w-full h-10 px-3 rounded-md border border-slate-200 bg-white text-sm"
                    required
                  >
                    {industries.map((industry) => (
                      <option key={industry.value} value={industry.value}>{industry.label}</option>
                    ))}
                  </select>
                </div>

                {/* Company Type */}
                <div className="space-y-2">
                  <Label htmlFor="companyType">Company Type *</Label>
                  <select
                    id="companyType"
                    value={formData.companyType}
                    onChange={(e) => setFormData({ ...formData, companyType: e.target.value })}
                    className="w-full h-10 px-3 rounded-md border border-slate-200 bg-white text-sm"
                    required
                  >
                    {companyTypes.map((type) => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>

                {/* Your Name */}
                <div className="space-y-2">
                  <Label htmlFor="name">Your Name *</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      id="name"
                      placeholder="John Doe"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="pl-10"
                      required
                      data-testid="register-name-input"
                    />
                  </div>
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@company.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="pl-10"
                      required
                      data-testid="register-email-input"
                    />
                  </div>
                </div>

                {/* Phone */}
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      id="phone"
                      placeholder="9876543210"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="pl-10"
                      data-testid="register-phone-input"
                    />
                  </div>
                </div>

                {/* Address */}
                <div className="space-y-2">
                  <Label htmlFor="address">Business Address</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                    <textarea
                      id="address"
                      placeholder="123 Business Street"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      className="w-full min-h-[80px] px-3 py-2 pl-10 rounded-md border border-slate-200 text-sm resize-none"
                      rows={3}
                    />
                  </div>
                </div>

                {/* Pincode with Auto-fetch */}
                <div className="space-y-2">
                  <Label htmlFor="pincode">Pincode</Label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Input
                        id="pincode"
                        placeholder="560001"
                        value={formData.pincode}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                          setFormData({ ...formData, pincode: value });
                          if (errors.pincode) setErrors({ ...errors, pincode: null });
                        }}
                        maxLength={6}
                        className={errors.pincode ? "border-red-500" : ""}
                      />
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handlePincodeLookup}
                      disabled={pincodeLoading || formData.pincode.length !== 6}
                      className="whitespace-nowrap"
                    >
                      {pincodeLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4 mr-1" />}
                      Fetch
                    </Button>
                  </div>
                  {errors.pincode && (
                    <p className="text-xs text-red-500">{errors.pincode}</p>
                  )}
                </div>

                {/* City & State */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      placeholder="Mumbai"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state">State</Label>
                    <select
                      id="state"
                      value={formData.state}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                      className="w-full h-10 px-3 rounded-md border border-slate-200 bg-white text-sm"
                    >
                      <option value="">Select State</option>
                      {states.map((state) => (
                        <option key={state} value={state}>{state}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Password */}
                <div className="space-y-2">
                  <Label htmlFor="password">Password *</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Min 6 characters"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="pl-10 pr-10"
                      required
                      minLength={6}
                      data-testid="register-password-input"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {errors.general && (
                  <p className="text-sm text-red-500 text-center">{errors.general}</p>
                )}

                <Button 
                  type="submit" 
                  className="w-full bg-emerald-600 hover:bg-emerald-700"
                  disabled={loading}
                  data-testid="register-submit-btn"
                >
                  {loading ? 'Creating Account...' : 'Create Account'}
                </Button>
              </form>

              <p className="text-center text-sm text-slate-600 mt-6">
                Already have an account?{' '}
                <Link to="/login" className="text-emerald-600 hover:underline font-medium" data-testid="login-link">
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
