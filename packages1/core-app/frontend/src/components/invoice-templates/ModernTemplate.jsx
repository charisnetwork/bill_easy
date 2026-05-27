import React from "react";
import { Phone, Mail, CreditCard } from "lucide-react";
import { format } from "date-fns";
import { getAssetUrl } from "../../config/api";
import { Building2 } from "lucide-react";
import { cn } from "../../lib/utils";

const ModernTemplate = ({ invoice, company, industryConfig, balanceDue, paymentProgress }) => {
  const totalAmount = parseFloat(invoice.total_amount) || 0;

  return (
    <div className="p-10 md:p-16 space-y-10 bg-white">
      {/* Header */}
      <div className="flex flex-row items-start justify-between border-b border-slate-100 pb-10">
        <div className="flex items-start gap-6">
          {company?.logo ? (
            <img src={getAssetUrl(company.logo)} alt="Logo" className="h-20 w-auto object-contain" />
          ) : (
            <div className="h-20 w-20 bg-slate-50 rounded-2xl flex items-center justify-center border border-slate-100 shadow-inner">
              <Building2 className="w-10 h-10 text-slate-300" />
            </div>
          )}
          <div className="pt-1">
            <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tight leading-none">{company?.name}</h2>
            <p className="text-sm text-slate-400 mt-2 font-medium tracking-wide uppercase">{company?.tagline || ""}</p>
          </div>
        </div>
        <div className="text-right flex flex-col items-end pt-1">
          <div className="px-5 py-1.5 bg-slate-900 text-white font-black text-[11px] rounded uppercase tracking-[0.2em] mb-4 shadow-xl">Tax Invoice</div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-end gap-2">
              <span className="text-[10px] uppercase font-black text-slate-300 tracking-wider">Invoice No:</span>
              <span className="text-lg font-black text-slate-900 tabular-nums leading-none">{invoice.invoice_number}</span>
            </div>
            <div className="flex items-center justify-end gap-2">
              <span className="text-[10px] uppercase font-black text-slate-300 tracking-wider">Date:</span>
              <span className="text-sm font-bold text-slate-600 leading-none">{format(new Date(invoice.invoice_date), 'dd MMM yyyy')}</span>
            </div>
            {company?.gst_number && (
              <div className="flex items-center justify-end gap-2 mt-1">
                <span className="text-[10px] uppercase font-black text-slate-300 tracking-wider">GSTIN:</span>
                <span className="text-xs font-black text-slate-900 leading-none">{company.gst_number}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* From / To */}
      <div className="grid grid-cols-2 gap-6">
        <div className="border border-slate-200 rounded-xl p-6 flex flex-col bg-slate-50/30">
          <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest mb-4 flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-slate-300 rounded-full"></div>Business Details (From)
          </p>
          <div className="text-xs space-y-2 text-slate-600">
            <p className="text-sm font-black text-slate-900">{company?.name}</p>
            <p className="leading-relaxed font-medium">{company?.address}</p>
            <p className="font-medium">{company?.city}, {company?.state} - {company?.pincode}</p>
            <div className="pt-2 space-y-1.5 border-t border-slate-100 mt-2">
              <p className="flex items-center gap-2 font-bold text-slate-900"><Phone className="w-3 h-3 text-slate-400" /> {company?.phone}</p>
              <p className="flex items-center gap-2 font-bold text-slate-900"><Mail className="w-3 h-3 text-slate-400" /> {company?.email}</p>
            </div>
          </div>
        </div>
        <div className="border border-slate-200 rounded-xl p-6 flex flex-col bg-slate-50/30">
          <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest mb-4 flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full"></div>Bill To (Customer)
          </p>
          <div className="text-xs space-y-2 text-slate-600">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">{invoice.Customer?.name}</h3>
            <p className="leading-relaxed font-medium">{invoice.Customer?.address}</p>
            <p className="font-medium">{invoice.Customer?.city}, {invoice.Customer?.state}</p>
            <div className="pt-2 space-y-1.5 border-t border-slate-100 mt-2">
              <p className="font-bold text-slate-900"><span className="text-slate-400 mr-1.5 font-black uppercase text-[9px]">Phone:</span> {invoice.Customer?.phone}</p>
              {invoice.Customer?.gst_number && (
                <p className="font-black text-slate-900"><span className="text-slate-400 mr-1.5 font-black uppercase text-[9px]">GSTIN:</span> {invoice.Customer.gst_number}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Items Table */}
      <div className="space-y-4 pt-4">
        <div className="overflow-hidden border border-slate-200 rounded-xl shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-900 text-white text-[10px] uppercase font-black tracking-[0.15em]">
              <tr>
                <th className="px-6 py-4 border-r border-slate-800">{industryConfig.labels.itemName}</th>
                {industryConfig.fields.showQty && <th className="px-6 py-4 text-center border-r border-slate-800 w-24">{industryConfig.labels.qty}</th>}
                <th className="px-6 py-4 text-right border-r border-slate-800 w-32">{industryConfig.labels.price}</th>
                <th className="px-6 py-4 text-right w-32">Amount</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-100">
              {invoice.items?.map((item) => (
                <tr key={item.id} className="text-sm">
                  <td className="px-6 py-5 border-r border-slate-100">
                    <p className="font-black text-slate-900 uppercase tracking-tight">{item.Product?.name}</p>
                    {item.description && <p className="text-[10px] text-slate-400 font-medium italic mt-1">{item.description}</p>}
                    {item.Product?.hsn_code && industryConfig.fields.showHSN && <p className="text-[9px] text-indigo-500 font-black tracking-widest mt-2 uppercase">HSN {item.Product.hsn_code}</p>}
                  </td>
                  {industryConfig.fields.showQty && <td className="px-6 py-5 text-center font-bold text-slate-600 border-r border-slate-100 tabular-nums">{item.quantity} <span className="text-[10px] text-slate-400 font-medium">{item.Product?.unit}</span></td>}
                  <td className="px-6 py-5 text-right font-bold text-slate-600 border-r border-slate-100 tabular-nums">₹{parseFloat(item.unit_price).toLocaleString()}</td>
                  <td className="px-6 py-5 text-right font-black text-slate-900 tabular-nums">₹{parseFloat(item.total).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="flex flex-col md:flex-row justify-between items-start gap-8 pt-6">
          <div className="flex-1">
            {invoice.notes && (
              <div className="p-5 bg-indigo-50/30 rounded-xl border border-indigo-100/50">
                <p className="text-[10px] uppercase font-black text-indigo-400 tracking-widest mb-2">Notes / Remarks</p>
                <p className="text-xs text-slate-600 font-medium italic leading-relaxed">{invoice.notes}</p>
              </div>
            )}
          </div>
          <div className="w-full md:w-80 bg-slate-50/50 p-6 rounded-2xl border border-slate-100 space-y-3">
            <div className="flex justify-between text-[11px] text-slate-400 font-black uppercase tracking-wider">
              <span>Sub Total</span>
              <span className="text-slate-600 tabular-nums">₹{parseFloat(invoice.total_amount - (invoice.tax_amount || 0)).toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-[11px] text-slate-400 font-black uppercase tracking-wider">
              <span>Tax Amount</span>
              <span className="text-slate-600 tabular-nums">₹{parseFloat(invoice.tax_amount || 0).toLocaleString()}</span>
            </div>
            <div className="h-px bg-slate-200 my-2"></div>
            <div className="flex justify-between items-center">
              <span className="text-xs font-black text-slate-900 uppercase tracking-widest">Total Amount</span>
              <span className="text-2xl font-black text-slate-900 tabular-nums tracking-tighter">₹{parseFloat(invoice.total_amount).toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center text-xs text-emerald-600 font-black tracking-wider pt-1">
              <span>Paid Amount</span>
              <span className="tabular-nums">₹{parseFloat(invoice.paid_amount || 0).toLocaleString()}</span>
            </div>
            <div className={cn(
              "flex justify-between items-center p-3 rounded-xl mt-4 border-2 shadow-sm",
              paymentProgress === 100 ? "bg-emerald-50 text-emerald-700 border-emerald-100" :
              paymentProgress > 0 ? "bg-amber-50 text-amber-700 border-amber-100" :
              "bg-rose-50 text-rose-700 border-rose-100"
            )}>
              <span className="text-[10px] font-black uppercase tracking-widest">Balance Due</span>
              <span className="text-lg font-black tracking-tighter tabular-nums">₹{balanceDue.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex flex-col gap-12 pt-16">
        <div className="flex flex-row justify-between gap-12 items-end">
          <div className="flex-1 flex flex-col gap-8">
            {company?.qr_code && (
              <div className="flex flex-col items-start gap-2">
                <div className="p-2 bg-white border border-slate-200 rounded-2xl shadow-xl">
                  <img src={getAssetUrl(company.qr_code)} alt="QR Code" className="w-28 h-24 object-contain" />
                </div>
                <p className="text-[9px] text-slate-400 font-black uppercase tracking-[0.2em]">Scan to Pay</p>
              </div>
            )}
            {company?.bank_name && (
              <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl max-w-sm shadow-sm">
                <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest mb-4 border-b border-slate-200 pb-2 flex items-center gap-2">
                  <CreditCard className="w-3 h-3" /> Banking Information
                </p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-[11px] font-bold">
                  <span className="text-slate-400 uppercase text-[9px] font-black">Bank Name</span>
                  <span className="text-slate-900">{company.bank_name}</span>
                  <span className="text-slate-400 uppercase text-[9px] font-black">A/C Number</span>
                  <span className="text-slate-900 font-mono tracking-tight">{company.account_number}</span>
                  <span className="text-slate-400 uppercase text-[9px] font-black">IFSC Code</span>
                  <span className="text-slate-900 font-mono tracking-tighter">{company.ifsc_code}</span>
                  <span className="text-slate-400 uppercase text-[9px] font-black">Branch</span>
                  <span className="text-slate-900">{company.branch_name}</span>
                </div>
              </div>
            )}
            {company?.terms_conditions && (
              <div className="max-w-md">
                <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest mb-3 border-b border-slate-100 pb-1">Terms & Conditions</p>
                <p className="text-[10px] text-slate-400 leading-relaxed whitespace-pre-line font-medium italic">{company.terms_conditions}</p>
              </div>
            )}
          </div>
          <div className="w-72 flex flex-col items-center gap-4">
            <div className="w-full text-center space-y-4 pt-4">
              <p className="text-[11px] font-black text-slate-900 uppercase tracking-[0.2em]">Authorized Signatory</p>
              {company?.signature ? (
                <img src={getAssetUrl(company.signature)} alt="Signature" className="h-16 w-auto mx-auto object-contain mix-blend-multiply" />
              ) : (
                <div className="h-16"></div>
              )}
              <div className="w-full h-[2px] bg-slate-900 rounded-full"></div>
              <p className="text-[10px] font-bold text-slate-400 tracking-tight uppercase">{company?.name}</p>
              {company?.Users?.[0]?.name && <p className="text-[9px] font-black text-slate-900 uppercase">{company.Users[0].name}</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModernTemplate;
