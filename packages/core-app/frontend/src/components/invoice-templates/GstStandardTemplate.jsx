import React from "react";
import { format } from "date-fns";
import { getAssetUrl } from "../../config/api";
import { Building2, CreditCard } from "lucide-react";
import { cn } from "../../lib/utils";

/**
 * GST Standard Template — Government-compliant layout with full CGST/SGST breakdown per line item.
 * Green accent, tabular format as per GST invoice rules.
 */
const GstStandardTemplate = ({ invoice, company, industryConfig, balanceDue, paymentProgress }) => {
  const totalAmount = parseFloat(invoice.total_amount) || 0;
  const totalTax = parseFloat(invoice.tax_amount || 0);
  const subtotal = totalAmount - totalTax;

  return (
    <div className="p-8 md:p-12 bg-white" style={{ fontFamily: "'Arial', sans-serif" }}>

      {/* Top Green Bar */}
      <div className="h-2 w-full bg-emerald-600 rounded mb-6"></div>

      {/* Header */}
      <div className="text-center mb-6 pb-4 border-b-2 border-slate-200">
        <div className="flex items-center justify-center gap-4 mb-2">
          {company?.logo ? (
            <img src={getAssetUrl(company.logo)} alt="Logo" className="h-16 w-auto object-contain" />
          ) : (
            <Building2 className="w-12 h-12 text-emerald-600" />
          )}
          <div className="text-left">
            <h1 className="text-2xl font-bold text-slate-900 uppercase tracking-tight">{company?.name}</h1>
            {company?.tagline && <p className="text-xs text-slate-500 italic">{company.tagline}</p>}
          </div>
        </div>
        <p className="text-xs text-slate-600">{company?.address}, {company?.city}, {company?.state} - {company?.pincode}</p>
        <p className="text-xs text-slate-600">Ph: {company?.phone} | Email: {company?.email}</p>
        {company?.gst_number && (
          <p className="text-sm font-bold text-emerald-700 mt-1 uppercase tracking-wider">GSTIN: {company.gst_number}</p>
        )}

        <div className="mt-4 inline-block bg-emerald-700 text-white text-sm font-bold px-8 py-1.5 tracking-widest uppercase rounded">
          Tax Invoice
        </div>
      </div>

      {/* Invoice Details Grid */}
      <div className="grid grid-cols-2 gap-0 mb-6 border-2 border-slate-300 rounded overflow-hidden text-xs">
        <div className="p-4 border-r border-b border-slate-200">
          <p className="font-bold text-slate-500 uppercase text-[9px] tracking-wider mb-1">Invoice Number</p>
          <p className="font-bold text-slate-900 text-base">{invoice.invoice_number}</p>
        </div>
        <div className="p-4 border-b border-slate-200">
          <p className="font-bold text-slate-500 uppercase text-[9px] tracking-wider mb-1">Invoice Date</p>
          <p className="font-bold text-slate-900">{format(new Date(invoice.invoice_date), 'dd-MM-yyyy')}</p>
        </div>
        <div className="p-4 border-r border-slate-200">
          <p className="font-bold text-slate-500 uppercase text-[9px] tracking-wider mb-1">Billed To</p>
          <p className="font-bold text-slate-900">{invoice.Customer?.name}</p>
          <p className="text-slate-600 mt-0.5">{invoice.Customer?.address}</p>
          <p className="text-slate-600">{invoice.Customer?.city}, {invoice.Customer?.state}</p>
          <p className="text-slate-600">Ph: {invoice.Customer?.phone}</p>
          {invoice.Customer?.gst_number && (
            <p className="font-bold text-emerald-700 mt-1">GSTIN: {invoice.Customer.gst_number}</p>
          )}
        </div>
        <div className="p-4">
          <p className="font-bold text-slate-500 uppercase text-[9px] tracking-wider mb-1">Shipped To / Same</p>
          <p className="font-bold text-slate-900">{invoice.Customer?.name}</p>
          <p className="text-slate-600 mt-0.5">{invoice.Customer?.address}</p>
          <p className="text-slate-600">{invoice.Customer?.city}, {invoice.Customer?.state}</p>
          {invoice.due_date && (
            <p className="mt-2 font-semibold text-slate-700">Due Date: {format(new Date(invoice.due_date), 'dd-MM-yyyy')}</p>
          )}
          <p className={cn("mt-2 inline-block px-2 py-0.5 rounded text-[9px] font-bold uppercase",
            paymentProgress >= 100 ? "bg-emerald-100 text-emerald-700" :
            paymentProgress > 0 ? "bg-amber-100 text-amber-700" :
            "bg-rose-100 text-rose-700"
          )}>{paymentProgress >= 100 ? "PAID" : paymentProgress > 0 ? "PARTIAL" : "UNPAID"}</p>
        </div>
      </div>

      {/* Items Table with CGST/SGST breakdown */}
      <div className="mb-6 overflow-hidden border-2 border-slate-300 rounded">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="bg-emerald-700 text-white">
              <th className="px-3 py-3 text-left font-bold border-r border-emerald-600 w-6">#</th>
              <th className="px-3 py-3 text-left font-bold border-r border-emerald-600">Description of Goods/Services</th>
              <th className="px-3 py-3 text-center font-bold border-r border-emerald-600 w-16">HSN/SAC</th>
              <th className="px-3 py-3 text-center font-bold border-r border-emerald-600 w-14">Qty</th>
              <th className="px-3 py-3 text-right font-bold border-r border-emerald-600 w-20">Rate (₹)</th>
              <th className="px-3 py-3 text-right font-bold border-r border-emerald-600 w-16">Tax%</th>
              <th className="px-3 py-3 text-right font-bold border-r border-emerald-600 w-20">CGST (₹)</th>
              <th className="px-3 py-3 text-right font-bold border-r border-emerald-600 w-20">SGST (₹)</th>
              <th className="px-3 py-3 text-right font-bold w-24">Total (₹)</th>
            </tr>
          </thead>
          <tbody>
            {invoice.items?.map((item, i) => {
              const qty = parseFloat(item.quantity) || 0;
              const price = parseFloat(item.unit_price) || 0;
              const taxRate = parseFloat(item.tax_rate) || 0;
              const itemSubtotal = qty * price;
              const totalTaxForItem = (itemSubtotal * taxRate) / 100;
              const cgst = totalTaxForItem / 2;
              const sgst = totalTaxForItem / 2;
              const itemTotal = parseFloat(item.total) || 0;

              return (
                <tr key={item.id} className={cn("border-b border-slate-200", i % 2 === 1 ? "bg-emerald-50/30" : "bg-white")}>
                  <td className="px-3 py-3 text-center text-slate-500 border-r border-slate-200">{i + 1}</td>
                  <td className="px-3 py-3 border-r border-slate-200">
                    <p className="font-semibold text-slate-900">{item.Product?.name}</p>
                    {item.description && <p className="text-[10px] text-slate-400 italic mt-0.5">{item.description}</p>}
                  </td>
                  <td className="px-3 py-3 text-center text-slate-600 border-r border-slate-200 font-mono text-[10px]">
                    {item.Product?.hsn_code || "-"}
                  </td>
                  <td className="px-3 py-3 text-center text-slate-700 border-r border-slate-200 tabular-nums">
                    {item.quantity} <span className="text-[9px] text-slate-400">{item.Product?.unit}</span>
                  </td>
                  <td className="px-3 py-3 text-right text-slate-700 border-r border-slate-200 tabular-nums">{price.toFixed(2)}</td>
                  <td className="px-3 py-3 text-right text-slate-600 border-r border-slate-200">{taxRate}%</td>
                  <td className="px-3 py-3 text-right text-slate-700 border-r border-slate-200 tabular-nums">{cgst.toFixed(2)}</td>
                  <td className="px-3 py-3 text-right text-slate-700 border-r border-slate-200 tabular-nums">{sgst.toFixed(2)}</td>
                  <td className="px-3 py-3 text-right font-bold text-slate-900 tabular-nums">{itemTotal.toFixed(2)}</td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="bg-slate-50 border-t-2 border-slate-300 font-bold text-xs">
              <td colSpan={3} className="px-3 py-3 text-left text-slate-600 font-bold uppercase tracking-wider border-r border-slate-200">Total</td>
              <td className="px-3 py-3 text-center border-r border-slate-200 tabular-nums">
                {invoice.items?.reduce((sum, i) => sum + parseFloat(i.quantity || 0), 0)}
              </td>
              <td className="px-3 py-3 border-r border-slate-200"></td>
              <td className="px-3 py-3 border-r border-slate-200"></td>
              <td className="px-3 py-3 text-right border-r border-slate-200 tabular-nums text-emerald-700">
                {(totalTax / 2).toFixed(2)}
              </td>
              <td className="px-3 py-3 text-right border-r border-slate-200 tabular-nums text-emerald-700">
                {(totalTax / 2).toFixed(2)}
              </td>
              <td className="px-3 py-3 text-right text-slate-900 tabular-nums">
                {totalAmount.toFixed(2)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Summary */}
      <div className="flex flex-col md:flex-row justify-between gap-8">
        <div className="flex-1 space-y-4 text-xs">
          {invoice.notes && (
            <div className="border border-slate-200 rounded p-3 bg-emerald-50/30">
              <p className="font-bold uppercase tracking-wider text-slate-500 mb-1">Remarks</p>
              <p className="text-slate-600 italic">{invoice.notes}</p>
            </div>
          )}

          {company?.bank_name && (
            <div className="border border-slate-200 rounded p-3">
              <p className="font-bold uppercase tracking-wider text-emerald-700 mb-2">
                <CreditCard className="w-3 h-3 inline mr-1" />Bank Details
              </p>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-slate-700">
                <span className="text-slate-400">Bank:</span><span>{company.bank_name}</span>
                <span className="text-slate-400">A/C No:</span><span className="font-mono">{company.account_number}</span>
                <span className="text-slate-400">IFSC:</span><span className="font-mono">{company.ifsc_code}</span>
                <span className="text-slate-400">Branch:</span><span>{company.branch_name}</span>
              </div>
            </div>
          )}

          {company?.qr_code && (
            <div className="flex items-start gap-3">
              <img src={getAssetUrl(company.qr_code)} alt="QR" className="w-20 h-20 object-contain border border-slate-200 p-1 rounded" />
              <p className="text-[9px] text-slate-400 uppercase tracking-widest mt-2">Scan & Pay via UPI</p>
            </div>
          )}

          {company?.terms_conditions && (
            <div>
              <p className="font-bold uppercase tracking-wider text-slate-500 mb-1">Terms & Conditions</p>
              <p className="text-[10px] text-slate-400 leading-relaxed whitespace-pre-line">{company.terms_conditions}</p>
            </div>
          )}
        </div>

        <div className="w-64 space-y-1 text-xs">
          <div className="border border-slate-200 rounded overflow-hidden">
            <div className="px-4 py-2 flex justify-between border-b border-slate-100 text-slate-600">
              <span>Taxable Amount</span>
              <span className="tabular-nums font-medium">₹{subtotal.toFixed(2)}</span>
            </div>
            <div className="px-4 py-2 flex justify-between border-b border-slate-100 text-slate-600">
              <span>CGST</span>
              <span className="tabular-nums font-medium">₹{(totalTax / 2).toFixed(2)}</span>
            </div>
            <div className="px-4 py-2 flex justify-between border-b border-slate-100 text-slate-600">
              <span>SGST</span>
              <span className="tabular-nums font-medium">₹{(totalTax / 2).toFixed(2)}</span>
            </div>
            <div className="px-4 py-3 flex justify-between font-bold text-sm bg-emerald-700 text-white">
              <span>Grand Total</span>
              <span className="tabular-nums">₹{totalAmount.toFixed(2)}</span>
            </div>
            {parseFloat(invoice.paid_amount || 0) > 0 && (
              <div className="px-4 py-2 flex justify-between border-t border-slate-100 text-emerald-700">
                <span>Amount Paid</span>
                <span className="tabular-nums font-medium">₹{parseFloat(invoice.paid_amount).toFixed(2)}</span>
              </div>
            )}
            <div className={cn("px-4 py-3 flex justify-between font-bold text-sm",
              paymentProgress >= 100 ? "bg-emerald-50 text-emerald-800" :
              paymentProgress > 0 ? "bg-amber-50 text-amber-800" :
              "bg-rose-50 text-rose-800"
            )}>
              <span>Balance Due</span>
              <span className="tabular-nums">₹{balanceDue.toFixed(2)}</span>
            </div>
          </div>

          {/* Signature */}
          <div className="border-t border-slate-200 pt-16 mt-12 text-center">
            {company?.signature && (
              <img src={getAssetUrl(company.signature)} alt="Sig" className="h-12 w-auto mx-auto mb-1 object-contain mix-blend-multiply" />
            )}
            <div className="border-t border-slate-400 w-full mt-2 mb-1"></div>
            <p className="text-[10px] font-bold uppercase text-slate-600 tracking-widest">Authorized Signatory</p>
            <p className="text-[9px] text-slate-400 italic">for {company?.name}</p>
          </div>
        </div>
      </div>

      {/* Bottom Green Bar */}
      <div className="h-1.5 w-full bg-emerald-600 rounded mt-10"></div>
      <p className="text-center text-[9px] text-slate-400 mt-2">This is a computer-generated invoice and does not require a physical signature.</p>
    </div>
  );
};

export default GstStandardTemplate;
