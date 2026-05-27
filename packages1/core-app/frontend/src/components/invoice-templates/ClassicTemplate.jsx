import React from "react";
import { Phone, Mail, CreditCard } from "lucide-react";
import { format } from "date-fns";
import { getAssetUrl } from "../../config/api";
import { Building2 } from "lucide-react";
import { cn } from "../../lib/utils";

/**
 * Classic Template — Traditional bordered layout, blue accent, timeless professional feel.
 */
const ClassicTemplate = ({ invoice, company, industryConfig, balanceDue, paymentProgress }) => {
  const totalAmount = parseFloat(invoice.total_amount) || 0;
  const accentColor = "#1a3a6e";
  const lightBlue = "#eef3fb";

  return (
    <div className="p-10 md:p-14 bg-white font-serif" style={{ fontFamily: "'Georgia', serif" }}>
      {/* Top border accent */}
      <div className="h-1.5 w-full mb-8 rounded" style={{ background: `linear-gradient(to right, ${accentColor}, #2563eb)` }}></div>

      {/* Header */}
      <div className="flex flex-row items-start justify-between mb-8">
        <div className="flex items-start gap-5">
          {company?.logo ? (
            <img src={getAssetUrl(company.logo)} alt="Logo" className="h-20 w-auto object-contain border border-slate-200 p-1 rounded" />
          ) : (
            <div className="h-20 w-20 bg-blue-50 rounded flex items-center justify-center border-2 border-blue-100">
              <Building2 className="w-9 h-9 text-blue-300" />
            </div>
          )}
          <div>
            <h2 className="text-2xl font-bold uppercase tracking-wide" style={{ color: accentColor }}>{company?.name}</h2>
            {company?.tagline && <p className="text-xs text-slate-500 mt-1 italic">{company.tagline}</p>}
            <div className="mt-2 text-xs text-slate-600 space-y-0.5">
              <p>{company?.address}</p>
              <p>{company?.city}, {company?.state} - {company?.pincode}</p>
              <p className="flex items-center gap-1"><Phone className="w-3 h-3" /> {company?.phone}</p>
              {company?.gst_number && <p className="font-semibold text-slate-800">GSTIN: {company.gst_number}</p>}
            </div>
          </div>
        </div>

        <div className="text-right">
          <div className="inline-block border-2 px-6 py-2 mb-4 font-bold text-sm uppercase tracking-widest rounded" style={{ borderColor: accentColor, color: accentColor }}>
            Tax Invoice
          </div>
          <div className="space-y-1 text-xs text-slate-700">
            <p><span className="font-bold text-slate-500">Invoice No:</span> <span className="font-bold text-slate-900">{invoice.invoice_number}</span></p>
            <p><span className="font-bold text-slate-500">Date:</span> {format(new Date(invoice.invoice_date), 'dd MMMM yyyy')}</p>
            {invoice.due_date && <p><span className="font-bold text-slate-500">Due Date:</span> {format(new Date(invoice.due_date), 'dd MMMM yyyy')}</p>}
            <p className="mt-2"><span className={cn("inline-block px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
              paymentProgress >= 100 ? "bg-emerald-100 text-emerald-700" :
              paymentProgress > 0 ? "bg-amber-100 text-amber-700" :
              "bg-rose-100 text-rose-700"
            )}>{paymentProgress >= 100 ? "PAID" : paymentProgress > 0 ? "PARTIAL" : "UNPAID"}</span></p>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t-2 border-b-2 py-4 mb-6" style={{ borderColor: accentColor }}>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <p className="text-[10px] uppercase font-bold tracking-widest mb-2" style={{ color: accentColor }}>Bill From</p>
            <p className="text-sm font-bold text-slate-900">{company?.name}</p>
            <p className="text-xs text-slate-600">{company?.address}, {company?.city}</p>
            <p className="text-xs text-slate-600">{company?.email}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold tracking-widest mb-2" style={{ color: accentColor }}>Bill To</p>
            <p className="text-sm font-bold text-slate-900">{invoice.Customer?.name}</p>
            <p className="text-xs text-slate-600">{invoice.Customer?.address}</p>
            <p className="text-xs text-slate-600">{invoice.Customer?.city}, {invoice.Customer?.state}</p>
            <p className="text-xs text-slate-600">{invoice.Customer?.phone}</p>
            {invoice.Customer?.gst_number && <p className="text-xs font-semibold text-slate-800">GSTIN: {invoice.Customer.gst_number}</p>}
          </div>
        </div>
      </div>

      {/* Items Table */}
      <div className="mb-8">
        <table className="w-full text-sm border-collapse border-2" style={{ borderColor: accentColor }}>
          <thead>
            <tr style={{ backgroundColor: accentColor }}>
              <th className="px-4 py-3 text-left text-white font-bold text-xs uppercase tracking-wider">{industryConfig.labels.itemName}</th>
              {industryConfig.fields.showHSN && <th className="px-4 py-3 text-center text-white font-bold text-xs uppercase tracking-wider w-24">HSN</th>}
              {industryConfig.fields.showQty && <th className="px-4 py-3 text-center text-white font-bold text-xs uppercase tracking-wider w-20">{industryConfig.labels.qty}</th>}
              <th className="px-4 py-3 text-right text-white font-bold text-xs uppercase tracking-wider w-28">{industryConfig.labels.price}</th>
              <th className="px-4 py-3 text-right text-white font-bold text-xs uppercase tracking-wider w-28">GST%</th>
              <th className="px-4 py-3 text-right text-white font-bold text-xs uppercase tracking-wider w-28">Amount</th>
            </tr>
          </thead>
          <tbody>
            {invoice.items?.map((item, i) => (
              <tr key={item.id} className="border-b" style={{ backgroundColor: i % 2 === 0 ? "white" : lightBlue }}>
                <td className="px-4 py-3 border-r border-slate-200">
                  <p className="font-semibold text-slate-900">{item.Product?.name}</p>
                  {item.description && <p className="text-[11px] text-slate-500 italic mt-0.5">{item.description}</p>}
                </td>
                {industryConfig.fields.showHSN && <td className="px-4 py-3 text-center text-slate-600 text-xs border-r border-slate-200">{item.Product?.hsn_code || "-"}</td>}
                {industryConfig.fields.showQty && <td className="px-4 py-3 text-center text-slate-700 font-medium border-r border-slate-200">{item.quantity} <span className="text-[10px] text-slate-400">{item.Product?.unit}</span></td>}
                <td className="px-4 py-3 text-right text-slate-700 border-r border-slate-200 tabular-nums">₹{parseFloat(item.unit_price).toLocaleString()}</td>
                <td className="px-4 py-3 text-right text-slate-600 text-xs border-r border-slate-200">{item.tax_rate || 0}%</td>
                <td className="px-4 py-3 text-right font-bold text-slate-900 tabular-nums">₹{parseFloat(item.total).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Totals + Footer */}
      <div className="flex flex-col md:flex-row justify-between gap-8">
        <div className="flex-1 space-y-4">
          {invoice.notes && (
            <div className="border border-slate-200 rounded p-4 bg-blue-50/30">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">Notes</p>
              <p className="text-xs text-slate-600 italic leading-relaxed">{invoice.notes}</p>
            </div>
          )}
          {company?.bank_name && (
            <div className="border border-slate-200 rounded p-4">
              <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: accentColor }}>Banking Details</p>
              <div className="grid grid-cols-2 gap-1 text-xs">
                <span className="text-slate-500">Bank:</span><span className="font-semibold">{company.bank_name}</span>
                <span className="text-slate-500">A/C No:</span><span className="font-mono">{company.account_number}</span>
                <span className="text-slate-500">IFSC:</span><span className="font-mono">{company.ifsc_code}</span>
                <span className="text-slate-500">Branch:</span><span>{company.branch_name}</span>
              </div>
            </div>
          )}
          {company?.terms_conditions && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">Terms & Conditions</p>
              <p className="text-[10px] text-slate-500 italic leading-relaxed whitespace-pre-line">{company.terms_conditions}</p>
            </div>
          )}
        </div>

        <div className="w-64 space-y-2">
          <div className="border border-slate-200 rounded overflow-hidden">
            <div className="px-4 py-2.5 flex justify-between text-xs border-b border-slate-100">
              <span className="text-slate-500">Subtotal</span>
              <span className="font-semibold">₹{parseFloat(invoice.total_amount - (invoice.tax_amount || 0)).toLocaleString()}</span>
            </div>
            <div className="px-4 py-2.5 flex justify-between text-xs border-b border-slate-100">
              <span className="text-slate-500">Tax</span>
              <span className="font-semibold">₹{parseFloat(invoice.tax_amount || 0).toLocaleString()}</span>
            </div>
            <div className="px-4 py-3 flex justify-between text-sm font-bold text-white" style={{ backgroundColor: accentColor }}>
              <span>TOTAL</span>
              <span className="tabular-nums">₹{parseFloat(invoice.total_amount).toLocaleString()}</span>
            </div>
            {parseFloat(invoice.paid_amount || 0) > 0 && (
              <div className="px-4 py-2.5 flex justify-between text-xs border-t border-slate-100 text-emerald-700">
                <span>Paid</span>
                <span className="font-semibold tabular-nums">₹{parseFloat(invoice.paid_amount).toLocaleString()}</span>
              </div>
            )}
            <div className={cn("px-4 py-3 flex justify-between text-sm font-bold",
              paymentProgress >= 100 ? "bg-emerald-100 text-emerald-800" :
              paymentProgress > 0 ? "bg-amber-100 text-amber-800" :
              "bg-rose-100 text-rose-800"
            )}>
              <span>Balance Due</span>
              <span className="tabular-nums">₹{balanceDue.toLocaleString()}</span>
            </div>
          </div>

          {/* Signature */}
          <div className="border-t-2 pt-16 text-center mt-12" style={{ borderColor: accentColor }}>
            {company?.signature && (
              <img src={getAssetUrl(company.signature)} alt="Signature" className="h-14 w-auto mx-auto object-contain mb-2 mix-blend-multiply" />
            )}
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-600">Authorized Signatory</p>
            <p className="text-[10px] text-slate-400 italic">{company?.name}</p>
          </div>
        </div>
      </div>

      {/* Bottom border */}
      <div className="h-1 w-full mt-12 rounded" style={{ background: `linear-gradient(to right, ${accentColor}, #2563eb)` }}></div>
    </div>
  );
};

export default ClassicTemplate;
