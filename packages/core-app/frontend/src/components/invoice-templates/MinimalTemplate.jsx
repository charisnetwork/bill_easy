import React from "react";
import { format } from "date-fns";
import { getAssetUrl } from "../../config/api";
import { cn } from "../../lib/utils";

/**
 * Minimal Template — Clean whitespace, left-aligned, no colored headers.
 * Monochrome, elegant, startup feel.
 */
const MinimalTemplate = ({ invoice, company, industryConfig, balanceDue, paymentProgress }) => {
  return (
    <div className="p-12 md:p-16 bg-white" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>

      {/* Header */}
      <div className="flex flex-row items-start justify-between mb-12">
        <div>
          {company?.logo ? (
            <img src={getAssetUrl(company.logo)} alt="Logo" className="h-14 w-auto object-contain mb-3" />
          ) : (
            <p className="text-2xl font-bold text-slate-900 tracking-tight mb-1">{company?.name}</p>
          )}
          {company?.logo && <p className="text-xl font-bold text-slate-900 tracking-tight">{company?.name}</p>}
          <p className="text-xs text-slate-400 mt-1">{company?.address}, {company?.city}, {company?.state}</p>
          <p className="text-xs text-slate-400">{company?.phone} · {company?.email}</p>
          {company?.gst_number && <p className="text-xs text-slate-500 font-medium mt-1">GSTIN: {company.gst_number}</p>}
        </div>

        <div className="text-right">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1">Invoice</p>
          <p className="text-3xl font-black text-slate-900 tabular-nums">#{invoice.invoice_number}</p>
          <p className="text-xs text-slate-400 mt-2">{format(new Date(invoice.invoice_date), 'MMMM dd, yyyy')}</p>
          {invoice.due_date && <p className="text-xs text-slate-400">Due: {format(new Date(invoice.due_date), 'MMMM dd, yyyy')}</p>}
          <span className={cn("inline-block mt-3 px-3 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider",
            paymentProgress >= 100 ? "bg-emerald-50 text-emerald-600" :
            paymentProgress > 0 ? "bg-amber-50 text-amber-600" :
            "bg-red-50 text-red-600"
          )}>{paymentProgress >= 100 ? "Paid" : paymentProgress > 0 ? "Partial" : "Unpaid"}</span>
        </div>
      </div>

      {/* Bill To */}
      <div className="mb-12">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-2">Billed To</p>
        <p className="text-sm font-bold text-slate-900">{invoice.Customer?.name}</p>
        <p className="text-xs text-slate-500">{invoice.Customer?.address}</p>
        <p className="text-xs text-slate-500">{invoice.Customer?.city}, {invoice.Customer?.state}</p>
        <p className="text-xs text-slate-500">{invoice.Customer?.phone}</p>
        {invoice.Customer?.gst_number && <p className="text-xs text-slate-500 font-medium">GSTIN: {invoice.Customer.gst_number}</p>}
      </div>

      {/* Thin divider */}
      <div className="h-px bg-slate-200 mb-8"></div>

      {/* Items Table */}
      <table className="w-full text-sm mb-8">
        <thead>
          <tr className="border-b border-slate-200">
            <th className="pb-3 text-left text-[10px] font-semibold uppercase tracking-widest text-slate-400">{industryConfig.labels.itemName}</th>
            {industryConfig.fields.showQty && <th className="pb-3 text-center text-[10px] font-semibold uppercase tracking-widest text-slate-400 w-20">{industryConfig.labels.qty}</th>}
            <th className="pb-3 text-right text-[10px] font-semibold uppercase tracking-widest text-slate-400 w-28">Rate</th>
            <th className="pb-3 text-right text-[10px] font-semibold uppercase tracking-widest text-slate-400 w-28">Amount</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {invoice.items?.map((item) => (
            <tr key={item.id}>
              <td className="py-4">
                <p className="font-medium text-slate-900">{item.Product?.name}</p>
                {item.description && <p className="text-xs text-slate-400 mt-0.5">{item.description}</p>}
                {item.Product?.hsn_code && industryConfig.fields.showHSN && (
                  <p className="text-[10px] text-slate-300 mt-1">HSN: {item.Product.hsn_code}</p>
                )}
              </td>
              {industryConfig.fields.showQty && (
                <td className="py-4 text-center text-slate-600">
                  {item.quantity} <span className="text-[10px] text-slate-400">{item.Product?.unit}</span>
                </td>
              )}
              <td className="py-4 text-right text-slate-600 tabular-nums">₹{parseFloat(item.unit_price).toLocaleString()}</td>
              <td className="py-4 text-right font-semibold text-slate-900 tabular-nums">₹{parseFloat(item.total).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Thin divider */}
      <div className="h-px bg-slate-200 mb-6"></div>

      {/* Totals */}
      <div className="flex flex-col md:flex-row justify-between gap-8">
        <div className="flex-1 space-y-4">
          {invoice.notes && (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-1">Notes</p>
              <p className="text-xs text-slate-500 italic leading-relaxed">{invoice.notes}</p>
            </div>
          )}
          {company?.bank_name && (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-2">Bank Details</p>
              <div className="text-xs text-slate-600 space-y-0.5">
                <p>{company.bank_name} · {company.branch_name}</p>
                <p>A/C: <span className="font-mono">{company.account_number}</span></p>
                <p>IFSC: <span className="font-mono">{company.ifsc_code}</span></p>
              </div>
            </div>
          )}
          {company?.terms_conditions && (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-1">Terms</p>
              <p className="text-[10px] text-slate-400 leading-relaxed whitespace-pre-line">{company.terms_conditions}</p>
            </div>
          )}
        </div>

        <div className="w-56 space-y-2 text-sm">
          <div className="flex justify-between text-slate-500">
            <span>Subtotal</span>
            <span className="tabular-nums">₹{parseFloat(invoice.total_amount - (invoice.tax_amount || 0)).toLocaleString()}</span>
          </div>
          {parseFloat(invoice.tax_amount || 0) > 0 && (
            <div className="flex justify-between text-slate-500">
              <span>Tax</span>
              <span className="tabular-nums">₹{parseFloat(invoice.tax_amount).toLocaleString()}</span>
            </div>
          )}
          <div className="h-px bg-slate-200"></div>
          <div className="flex justify-between font-bold text-slate-900 text-base">
            <span>Total</span>
            <span className="tabular-nums">₹{parseFloat(invoice.total_amount).toLocaleString()}</span>
          </div>
          {parseFloat(invoice.paid_amount || 0) > 0 && (
            <div className="flex justify-between text-emerald-600 text-xs">
              <span>Paid</span>
              <span className="tabular-nums">₹{parseFloat(invoice.paid_amount).toLocaleString()}</span>
            </div>
          )}
          <div className="flex justify-between font-semibold text-sm">
            <span className="text-slate-500">Balance</span>
            <span className={cn("tabular-nums",
              paymentProgress >= 100 ? "text-emerald-600" :
              paymentProgress > 0 ? "text-amber-600" :
              "text-rose-600"
            )}>₹{balanceDue.toLocaleString()}</span>
          </div>

          {/* QR */}
          {company?.qr_code && (
            <div className="pt-4 flex flex-col items-end gap-1">
              <img src={getAssetUrl(company.qr_code)} alt="QR" className="w-20 h-20 object-contain" />
              <p className="text-[9px] text-slate-400">Scan to Pay</p>
            </div>
          )}

          {/* Signature */}
          <div className="pt-12 border-t border-slate-200 text-center">
            {company?.signature && (
              <img src={getAssetUrl(company.signature)} alt="Signature" className="h-12 w-auto mx-auto mb-2 object-contain mix-blend-multiply" />
            )}
            <p className="text-[10px] text-slate-400 uppercase tracking-widest">Authorized Signatory</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MinimalTemplate;
