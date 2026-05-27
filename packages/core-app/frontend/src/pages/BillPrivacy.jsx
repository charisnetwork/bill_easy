import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { ArrowLeft, Shield, Lock, Eye, Bell, UserCheck } from 'lucide-react';
import Footer from '../components/Footer';

const BillPrivacy = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <div className="bg-white border-b border-slate-200 py-6 px-6 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate(-1)} className="rounded-full">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Shield className="w-5 h-5 text-blue-600" />
              Privacy Policy
            </h1>
          </div>
          <span className="text-xs text-slate-500 font-medium">Last Updated: March 2026</span>
        </div>
      </div>

      <main className="flex-1 max-w-4xl mx-auto py-12 px-6">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-8 md:p-12 space-y-10">
            
            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                  <Eye className="w-4 h-4 text-blue-600" />
                </div>
                Introduction
              </h2>
              <p className="text-slate-600 leading-relaxed">
                At <strong>Bill Easy</strong>, we take your privacy seriously. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our SaaS billing and inventory management platform. We are committed to protecting your business data and personal information through our compliance with this policy.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                  <UserCheck className="w-4 h-4 text-blue-600" />
                </div>
                Information We Collect
              </h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <h3 className="font-bold text-slate-900 mb-2">Personal Data</h3>
                  <p className="text-sm text-slate-600">Name, email address, phone number, and business details provided during registration.</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <h3 className="font-bold text-slate-900 mb-2">Business Data</h3>
                  <p className="text-sm text-slate-600">Inventory records, customer lists, supplier information, and transaction history created on our platform.</p>
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                  <Lock className="w-4 h-4 text-blue-600" />
                </div>
                Data Security
              </h2>
              <p className="text-slate-600 leading-relaxed">
                We implement bank-grade security measures to maintain the safety of your personal information. Your data is encrypted at rest and in transit using Industry-standard SSL technology. We use secure servers and restrict access to personal information to employees who need that information to operate, develop, or improve our services.
              </p>
              <ul className="list-disc pl-6 space-y-2 text-slate-600 text-sm">
                <li>End-to-end encryption for sensitive data.</li>
                <li>Regular automated backups to prevent data loss.</li>
                <li>Multi-factor authentication support for user accounts.</li>
                <li>Continuous monitoring for suspicious activities.</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                  <Bell className="w-4 h-4 text-blue-600" />
                </div>
                Your Rights
              </h2>
              <p className="text-slate-600 leading-relaxed">
                You have the right to access, correct, or delete your data at any time. You can export your business data in various formats (PDF, Excel) through our reporting tools. If you wish to close your account and remove all data, you can do so through the settings panel or by contacting our support team.
              </p>
            </section>

            <section className="pt-8 border-t border-slate-100">
              <p className="text-sm text-slate-500 italic">
                If you have any questions about this Privacy Policy, please contact us at support@billeasy.com
              </p>
            </section>

          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default BillPrivacy;
