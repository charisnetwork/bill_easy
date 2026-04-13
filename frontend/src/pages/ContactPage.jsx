import { BASE_URL } from '../services/api';
import React, { useState } from 'react';
import { Phone, MessageSquare, Mail, MapPin, Send, Globe, Instagram, Facebook, Linkedin, ArrowRight } from 'lucide-react';
import { industries } from '../lib/industryConfig';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { useToast } from '../hooks/use-toast';

const ContactPage = () => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const formData = new FormData(e.target);
    const data = {
      name: formData.get('fullName'),
      email: formData.get('email'),
      phone: formData.get('phone'),
      business_type: formData.get('businessType'),
      message: formData.get('message')
    };

    try {
      const response = await fetch(`${BASE_URL}/api/enquiries`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      if (response.ok) {
        toast({
          title: "Enquiry Sent!",
          description: "Our team will get back to you within 24 hours.",
        });
        e.target.reset();
      } else {
        throw new Error('Failed to send enquiry');
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Something went wrong. Please try again later.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Hero Section */}
      <div className="bg-slate-900 text-white py-20 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">How can we help?</h1>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            Whether you have a question about features, pricing, or anything else, our team is ready to answer all your questions.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 -mt-12 mb-20 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Side: Contact Info */}
          <div className="lg:col-span-1 space-y-6">
            <Card className="p-8 border-none shadow-xl bg-white/80 backdrop-blur-sm">
              <h2 className="text-2xl font-bold text-slate-900 mb-8">Reach Us</h2>
              
              <div className="space-y-8">
                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center shrink-0">
                    <Phone className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">Call Us</p>
                    <p className="text-lg font-bold text-slate-900">+91 99869 95848</p>
                    <p className="text-xs text-slate-400">Mon-Sat, 9am to 7pm</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center shrink-0">
                    <MessageSquare className="w-6 h-6 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">WhatsApp</p>
                    <a 
                      href="https://wa.me/919986995848" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-lg font-bold text-slate-900 hover:text-emerald-600 transition-colors flex items-center gap-2"
                    >
                      +91 99869 95848 <ArrowRight className="w-4 h-4" />
                    </a>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center shrink-0">
                    <Mail className="w-6 h-6 text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">Email Support</p>
                    <p className="text-lg font-bold text-slate-900">support@billeasy.com</p>
                  </div>
                </div>
              </div>

              <div className="mt-12 pt-12 border-t border-slate-100">
                <p className="text-sm font-bold text-slate-900 mb-4">Follow Our Updates</p>
                <div className="flex gap-3">
                  {[Instagram, Facebook, Linkedin, Globe].map((Icon, i) => (
                    <button key={i} className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-blue-600 hover:text-white transition-all">
                      <Icon className="w-5 h-5" />
                    </button>
                  ))}
                </div>
              </div>
            </Card>

            <Card className="p-6 border-none shadow-lg bg-gradient-to-br from-blue-600 to-indigo-700 text-white">
              <h3 className="font-bold mb-2">Technical Support</h3>
              <p className="text-sm text-blue-100 mb-4">Need help with your account? Visit our help center for guides and tutorials.</p>
              <Button variant="secondary" className="w-full bg-white/10 hover:bg-white/20 border-none text-white font-bold">
                Visit Help Center
              </Button>
            </Card>
          </div>

          {/* Right Side: Professional Form */}
          <div className="lg:col-span-2">
            <Card className="p-8 md:p-12 border-none shadow-2xl bg-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50 rounded-full blur-3xl -mr-32 -mt-32 opacity-50"></div>
              
              <div className="relative z-10">
                <div className="mb-10">
                  <h2 className="text-3xl font-bold text-slate-900 mb-2">Send us a message</h2>
                  <p className="text-slate-500">We'll get back to you as soon as possible.</p>
                </div>

                <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Full Name</label>
                    <Input name="fullName" placeholder="Enter your name" required className="h-12 bg-slate-50 border-slate-200 focus:ring-blue-500" />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Email Address</label>
                    <Input name="email" type="email" placeholder="email@business.com" required className="h-12 bg-slate-50 border-slate-200 focus:ring-blue-500" />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Phone Number</label>
                    <Input name="phone" type="tel" placeholder="Your phone number" required className="h-12 bg-slate-50 border-slate-200 focus:ring-blue-500" />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Business Type</label>
                    <select 
                      name="businessType"
                      required
                      className="w-full h-12 bg-slate-50 border border-slate-200 rounded-md px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select your industry</option>
                      {industries.map(ind => (
                        <option key={ind.value} value={ind.value}>{ind.label}</option>
                      ))}
                    </select>
                  </div>

                  <div className="md:col-span-2 space-y-2">
                    <label className="text-sm font-bold text-slate-700">Message</label>
                    <Textarea 
                      name="message" 
                      placeholder="How can we help you?" 
                      className="min-h-[150px] bg-slate-50 border-slate-200 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div className="md:col-span-2 pt-4">
                    <Button 
                      type="submit" 
                      disabled={isSubmitting}
                      className="w-full md:w-auto px-12 h-14 bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg shadow-lg shadow-blue-200 rounded-xl flex items-center gap-2"
                    >
                      {isSubmitting ? "Sending..." : "Send Enquiry"}
                      <Send className="w-5 h-5" />
                    </Button>
                  </div>
                </form>
              </div>
            </Card>
          </div>

        </div>
      </div>
    </div>
  );
};

export default ContactPage;
