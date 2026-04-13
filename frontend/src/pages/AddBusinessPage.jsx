import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { 
  Building2, 
  ArrowRight, 
  ArrowLeft, 
  CheckCircle2, 
  Globe, 
  Phone, 
  Mail, 
  MapPin,
  Loader2,
  Search,
  Briefcase
} from 'lucide-react';
import { industries } from "../lib/industryConfig";
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '../components/ui/card';
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage,
  FormDescription
} from '../components/ui/form';
import { companyAPI, utilityAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';

const formSchema = z.object({
  name: z.string().min(2, "Business name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(10, "Valid phone number is required"),
  address: z.string().min(5, "Address is required"),
  city: z.string().min(2, "City is required"),
  state: z.string().min(2, "State is required"),
  pincode: z.string().length(6, "Pincode must be 6 digits"),
  gst_number: z.string().optional().or(z.literal("")),
  company_type: z.string().min(1, "Company type is required"),
  business_category: z.string().min(1, "Business category is required"),
});

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

const AddBusinessPage = () => {
  const navigate = useNavigate();
  const { refreshProfile } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [gstLoading, setGstLoading] = useState(false);

  // GST Lookup Handler
  const handleGstLookup = async () => {
    const gstin = form.getValues('gst_number');
    if (!gstin || gstin.length !== 15) {
      toast.error("Please enter a valid 15-digit GSTIN");
      return;
    }

    setGstLoading(true);
    try {
      const { data } = await utilityAPI.getGST(gstin);
      
      if (data) {
        toast.success("GST details fetched successfully");
        form.setValue('gst_number', data.gstin);
        form.setValue('name', data.legal_name || data.trade_name);
        
        if (data.address_details) {
          const addr = data.address_details;
          const fullAddr = `${addr.building_name}, ${addr.street}, ${addr.location}, ${addr.city}`;
          form.setValue('address', fullAddr);
          form.setValue('city', addr.city);
          form.setValue('state', addr.state);
          form.setValue('pincode', addr.pincode);
        }
      }
    } catch (error) {
      console.error("GST Lookup Error:", error);
      toast.error(error.response?.data?.error || "Could not find details for this GSTIN. Please enter manually.");
    } finally {
      setGstLoading(false);
    }
  };

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      address: '',
      city: '',
      state: '',
      pincode: '',
      gst_number: '',
      company_type: 'Sole Proprietorship',
      business_category: 'Retail',
    },
  });

  const onSubmit = async (values) => {
    setLoading(true);
    try {
      await companyAPI.addBusiness(values);
      toast.success('Business added successfully!');
      await refreshProfile();
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to add business');
    } finally {
      setLoading(false);
    }
  };

  const nextStep = async () => {
    let fields = [];
    if (step === 1) fields = ['name', 'email', 'phone', 'company_type', 'business_category'];
    if (step === 2) fields = ['address', 'city', 'state', 'pincode'];
    
    const isValid = await form.trigger(fields);
    if (isValid) setStep(step + 1);
  };

  return (
    <div className="max-w-2xl mx-auto py-10 px-4">
      <div className="mb-8 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100 mb-4">
          <Building2 className="w-8 h-8 text-emerald-600" />
        </div>
        <h1 className="text-3xl font-bold text-slate-900">Add New Business</h1>
        <p className="text-slate-500 mt-2">Expand your operations with another business profile</p>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-center mb-10 gap-4">
        {[1, 2, 3].map((i) => (
          <React.Fragment key={i}>
            <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors ${
              step >= i ? 'bg-emerald-600 border-emerald-600 text-white' : 'bg-white border-slate-200 text-slate-400'
            }`}>
              {step > i ? <CheckCircle2 className="w-6 h-6" /> : i}
            </div>
            {i < 3 && <div className={`w-12 h-0.5 ${step > i ? 'bg-emerald-600' : 'bg-slate-200'}`} />}
          </React.Fragment>
        ))}
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <Card className="border-none shadow-xl shadow-slate-200/50">
            <CardContent className="pt-8">
              
              {step === 1 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold">Basic Details</h3>
                    <p className="text-sm text-slate-500">Let's start with the basics of your business.</p>
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Business Name *</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <Input className="pl-10" placeholder="e.g. Acme Solutions" {...field} />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Business Email *</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                              <Input className="pl-10" placeholder="contact@acme.com" {...field} />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone Number *</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                              <Input className="pl-10" placeholder="+91 98765 43210" {...field} />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="company_type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Company Type *</FormLabel>
                          <FormControl>
                            <select 
                              className="w-full h-10 px-3 rounded-md border border-slate-200 bg-white text-sm"
                              {...field}
                            >
                              {companyTypes.map((type) => (
                                <option key={type} value={type}>{type}</option>
                              ))}
                            </select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="business_category"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Business Category *</FormLabel>
                          <FormControl>
                            <select 
                              className="w-full h-10 px-3 rounded-md border border-slate-200 bg-white text-sm"
                              {...field}
                            >
                              {industries.map((industry) => (
                                <option key={industry.value} value={industry.value}>{industry.label}</option>
                              ))}
                            </select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold">Address & Location</h3>
                    <p className="text-sm text-slate-500">Where is your business located?</p>
                  </div>

                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Street Address *</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <MapPin className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                            <Input className="pl-10" placeholder="Plot No. 123, Street Name..." {...field} />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="city"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>City *</FormLabel>
                          <FormControl>
                            <Input placeholder="Mumbai" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="pincode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Pincode *</FormLabel>
                          <FormControl>
                            <Input placeholder="400001" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="state"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>State *</FormLabel>
                        <FormControl>
                          <Input placeholder="Maharashtra" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              {step === 3 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 text-center">
                  <div className="space-y-2 mb-8">
                    <h3 className="text-lg font-semibold text-center">Almost Done!</h3>
                    <p className="text-sm text-slate-500">Any last details?</p>
                  </div>

                  <div className="max-w-md mx-auto">
                    <FormField
                      control={form.control}
                      name="gst_number"
                      render={({ field }) => (
                        <FormItem className="text-left">
                          <FormLabel>GST Number (Optional)</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                              <Input className="pl-10 pr-12 uppercase font-mono" placeholder="27AAAAA0000A1Z5" {...field} />
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="absolute right-1 top-1 h-9 w-9 p-0 text-emerald-600 hover:text-emerald-700"
                                onClick={handleGstLookup}
                                disabled={gstLoading}
                              >
                                {gstLoading ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Search className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                          </FormControl>
                          <FormDescription>Enter 15-digit GSTIN to auto-fill business details.</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mt-8 text-left">
                    <div className="flex gap-3">
                      <div className="w-5 h-5 rounded-full bg-blue-500 text-white flex items-center justify-center text-[10px] shrink-0">i</div>
                      <p className="text-xs text-blue-700 leading-relaxed">
                        This business will be added to your account. You can switch between businesses using the selector in the sidebar. Each business maintains its own data independently.
                      </p>
                    </div>
                  </div>
                </div>
              )}

            </CardContent>
            <CardFooter className="flex justify-between border-t bg-slate-50/50 rounded-b-lg py-6 px-8">
              {step > 1 ? (
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setStep(step - 1)}
                  disabled={loading}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Previous
                </Button>
              ) : (
                <Button 
                  type="button" 
                  variant="ghost" 
                  onClick={() => navigate('/dashboard')}
                  disabled={loading}
                >
                  Cancel
                </Button>
              )}

              {step < 3 ? (
                <Button 
                  type="button" 
                  className="bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-100" 
                  onClick={nextStep}
                >
                  Next Step
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button 
                  type="submit" 
                  className="bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-100 min-w-[140px]"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      Create Business
                      <CheckCircle2 className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              )}
            </CardFooter>
          </Card>
        </form>
      </Form>
    </div>
  );
};

export default AddBusinessPage;
