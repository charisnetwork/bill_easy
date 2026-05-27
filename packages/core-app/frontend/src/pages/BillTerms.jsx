import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { ArrowLeft, FileText, Scale, Zap, Ban, Globe } from 'lucide-react';
import Footer from '../components/Footer';

const BillTerms = () => {
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
              <Scale className="w-5 h-5 text-blue-600" />
              Terms of Service
            </h1>
          </div>
          <span className="text-xs text-slate-500 font-medium">Effective Date: March 2026</span>
        </div>
      </div>

      <main className="flex-1 max-w-4xl mx-auto py-12 px-6">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-8 md:p-12 space-y-10">
            
            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                  <Globe className="w-4 h-4 text-blue-600" />
                </div>
                Agreement to Terms
              </h2>
              <p className="text-slate-600 leading-relaxed">
                By accessing or using the <strong>Bill Easy</strong> platform, you agree to be bound by these Terms of Service. If you disagree with any part of these terms, you may not access our services. These terms apply to all visitors, users, and others who access or use the Service.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                  <Zap className="w-4 h-4 text-blue-600" />
                </div>
                Service Subscription
              </h2>
              <p className="text-slate-600 leading-relaxed">
                Bill Easy provides various subscription plans (Free, Basic, Premium, Enterprise). Some parts of the Service are billed on a subscription basis. You will be billed in advance on a recurring and periodic basis (monthly or annually).
              </p>
              <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                <ul className="space-y-2 text-blue-800 text-sm">
                  <li><strong>Cancellation:</strong> You may cancel your subscription at any time through your account settings.</li>
                  <li><strong>Refunds:</strong> Subscription fees are generally non-refundable except as required by law.</li>
                  <li><strong>Upgrades:</strong> Changes to plans take effect immediately with pro-rated billing.</li>
                </ul>
              </div>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                  <FileText className="w-4 h-4 text-blue-600" />
                </div>
                User Responsibilities
              </h2>
              <p className="text-slate-600 leading-relaxed">
                You are responsible for maintaining the confidentiality of your account and password. You agree to accept responsibility for all activities that occur under your account. You must notify us immediately upon becoming aware of any breach of security or unauthorized use of your account.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                  <Ban className="w-4 h-4 text-blue-600" />
                </div>
                Prohibited Activities
              </h2>
              <p className="text-slate-600 leading-relaxed">
                You agree not to use the Service for any unlawful purpose or to solicit others to perform or participate in any unlawful acts. We reserve the right to terminate your use of the Service for violating any of the prohibited uses.
              </p>
            </section>

            <section className="pt-8 border-t border-slate-100">
              <p className="text-sm text-slate-500 italic text-center">
                Copyright © 2026 Bill Easy. All rights reserved.
              </p>
            </section>

          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default BillTerms;
