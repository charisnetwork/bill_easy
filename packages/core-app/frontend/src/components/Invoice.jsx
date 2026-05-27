import React from 'react';
import { format } from 'date-fns';
import { BASE_URL } from '../services/api';
import './Invoice.css';

const Invoice = ({ invoice, company }) => {
  if (!invoice || !company) return null;

  const totalGst = parseFloat(invoice.tax_amount || 0);
  const cgst = totalGst / 2;
  const sgst = totalGst / 2;

  return (
    <div className="invoice-container p-8 md:p-12 bg-white print:p-0 print:m-0">
      {/* 1. Flexbox Header */}
      <header className="invoice-header">
        <div className="flex items-center gap-6">
          {company.logo ? (
            <img 
              src={`${BASE_URL}/uploads${company.logo.startsWith('/') ? '' : '/'}${company.logo}`} 
              alt="Company Logo" 
              className="h-20 w-auto object-contain"
            />
          ) : (
            <div className="h-20 w-20 bg-slate-100 rounded-xl flex items-center justify-center border border-slate-200">
              <span className="text-2xl font-black text-slate-300">{company.name?.charAt(0)}</span>
            </div>
          )}
          <div>
            <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">{company.name}</h2>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">{company.tagline || 'Professional Billing'}</p>
          </div>
        </div>
        <div className="invoice-title">
          <h1>Tax Invoice</h1>
          <div className="mt-4 text-sm font-bold text-slate-600">
            <p>Invoice #: <span className="text-slate-900 font-black">{invoice.invoice_number}</span></p>
            <p>Date: <span className="text-slate-900 font-black">{format(new Date(invoice.invoice_date), 'dd MMM yyyy')}</span></p>
            {company.gst_number && <p>GSTIN: <span className="text-indigo-600 font-black">{company.gst_number}</span></p>}
          </div>
        </div>
      </header>

      {/* 2. 2-Column Grid for Bill To / Ship To */}
      <section className="address-grid">
        <div className="address-box">
          <h3>Bill To</h3>
          <div className="space-y-1 text-sm">
            <p className="font-black text-slate-900 uppercase">{invoice.Customer?.name}</p>
            <p className="text-slate-600 leading-relaxed">{invoice.Customer?.address}</p>
            <p className="text-slate-600">{invoice.Customer?.city}, {invoice.Customer?.state} - {invoice.Customer?.pincode}</p>
            <div className="pt-2 space-y-1">
              {invoice.Customer?.gst_number && (
                <p className="text-xs font-bold"><span className="text-slate-400 mr-2">GSTIN:</span> {invoice.Customer.gst_number}</p>
              )}
              {invoice.industry_metadata?.customer_pan && (
                <p className="text-xs font-bold"><span className="text-slate-400 mr-2">PAN:</span> {invoice.industry_metadata.customer_pan}</p>
              )}
              <p className="text-xs font-bold"><span className="text-slate-400 mr-2">Phone:</span> {invoice.Customer?.phone}</p>
            </div>
          </div>
        </div>

        <div className="address-box">
          <h3>Ship To</h3>
          <div className="space-y-1 text-sm">
            <p className="font-black text-slate-900 uppercase">{invoice.industry_metadata?.shipping_name || invoice.Customer?.name}</p>
            <p className="text-slate-600 leading-relaxed">{invoice.industry_metadata?.shipping_address || invoice.Customer?.address}</p>
            <p className="text-slate-600">
              {invoice.industry_metadata?.shipping_city || invoice.Customer?.city}, 
              {invoice.industry_metadata?.shipping_state || invoice.Customer?.state}
            </p>
            <div className="pt-2 space-y-1">
              {invoice.industry_metadata?.shipping_gstin && (
                <p className="text-xs font-bold"><span className="text-slate-400 mr-2">GSTIN:</span> {invoice.industry_metadata.shipping_gstin}</p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 3. Invoice Table with Vertical Lines */}
      <table className="invoice-table">
        <thead>
          <tr>
            <th style={{ width: '50px' }}>#</th>
            <th>Item Description</th>
            <th style={{ width: '120px' }}>HSN</th>
            <th style={{ width: '80px' }} className="text-center">Qty</th>
            <th style={{ width: '120px' }} className="text-right">Price</th>
            <th style={{ width: '120px' }} className="text-right">Total</th>
          </tr>
        </thead>
        <tbody>
          {invoice.items?.map((item, index) => (
            <tr key={item.id}>
              <td className="text-center font-bold text-slate-400">{index + 1}</td>
              <td>
                <p className="font-black text-slate-900 uppercase">{item.Product?.name}</p>
                {item.description && <p className="text-[10px] text-slate-400 italic mt-1">{item.description}</p>}
              </td>
              <td className="font-mono text-xs">{item.Product?.hsn_code || '-'}</td>
              <td className="text-center font-bold">{item.quantity}</td>
              <td className="text-right font-bold">₹{parseFloat(item.unit_price).toLocaleString()}</td>
              <td className="text-right font-black text-slate-900">₹{parseFloat(item.total).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* 4. Dynamic GST Footer */}
      <div className="invoice-footer">
        <div className="flex-1">
          <div className="gst-breakdown bg-slate-50 p-4 rounded-xl border border-slate-200">
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2">Tax Breakdown</p>
            <div className="gst-row">
              <span className="font-bold text-slate-600">CGST (50%)</span>
              <span className="font-black">₹{cgst.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="gst-row">
              <span className="font-bold text-slate-600">SGST (50%)</span>
              <span className="font-black">₹{sgst.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="gst-row border-none">
              <span className="font-black text-slate-900">Total Tax</span>
              <span className="font-black text-indigo-600">₹{totalGst.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
          </div>
          
          {invoice.notes && (
            <div className="mt-6 max-w-md">
              <p className="text-[10px] font-black uppercase text-slate-400 mb-1">Notes</p>
              <p className="text-xs text-slate-500 italic leading-relaxed">{invoice.notes}</p>
            </div>
          )}
        </div>

        <div className="flex flex-col items-end gap-8">
          <div className="w-64 space-y-2 text-right">
            <div className="flex justify-between text-sm font-bold text-slate-500">
              <span>Subtotal</span>
              <span>₹{parseFloat(invoice.subtotal).toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm font-bold text-slate-500">
              <span>GST Total</span>
              <span>₹{totalGst.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t-2 border-slate-900">
              <span className="text-xs font-black uppercase">Grand Total</span>
              <span className="text-2xl font-black text-slate-900">₹{parseFloat(invoice.total_amount).toLocaleString()}</span>
            </div>
          </div>

          {/* 5. Signature Block */}
          <div className="signature-block">
            {company.signature && (
              <img 
                src={`${BASE_URL}/uploads${company.signature.startsWith('/') ? '' : '/'}${company.signature}`} 
                alt="Signature" 
                className="h-16 w-auto mx-auto mb-2 mix-blend-multiply" 
              />
            )}
            <div className="signature-line">Authorized Signatory</div>
            <p className="text-[9px] font-bold text-slate-400 mt-1 uppercase">{company.name}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Invoice;
