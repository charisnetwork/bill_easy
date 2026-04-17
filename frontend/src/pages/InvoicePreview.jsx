import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { invoiceAPI, companyAPI } from "../services/api";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "../components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { 
  Printer, 
  Download, 
  Share2, 
  ArrowLeft,
  Phone,
  Mail,
  MapPin,
  Calendar,
  FileText,
  Building2,
  CreditCard,
  History,
  CheckCircle2,
  AlertCircle,
  Layout
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "../lib/utils";
import { toast } from "sonner";
import { getIndustryConfig } from "../lib/industryConfig";

const InvoicePreview = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState(null);
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [template, setTemplate] = useState(null);
  const [industryConfig, setIndustryConfig] = useState(getIndustryConfig('General Store'));
  
  // Payment Dialog State
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [paymentData, setPaymentData] = useState({
    amount: "",
    payment_method: "Cash",
    payment_date: new Date().toISOString().split("T")[0],
    reference_number: "",
    notes: ""
  });
  const [submittingPayment, setSubmittingPayment] = useState(false);

  const fetchData = async () => {
    try {
      const [invoiceRes, companyRes] = await Promise.all([
        invoiceAPI.get(id),
        companyAPI.get()
      ]);
      setInvoice(invoiceRes.data);
      setCompany(companyRes.data);
      
      const selectedIndustry = companyRes.data.business_category || 'General Store';
      setIndustryConfig(getIndustryConfig(selectedIndustry));
      
      // Fetch user's preferred template from settings
      const savedTemplate = companyRes.data.settings?.template_id || companyRes.data.settings?.invoice_template;
      setTemplate(savedTemplate || null);

      // Pre-fill remaining balance
      const balance = invoiceRes.data.total_amount - invoiceRes.data.paid_amount;
      setPaymentData(prev => ({ ...prev, amount: balance.toString() }));
    } catch (error) {
      console.error("Failed to load data", error);
      toast.error("Failed to load invoice details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const downloadPdf = () => {
    const token = localStorage.getItem('token');
    window.open(`${process.env.REACT_APP_BACKEND_URL}/api/invoices/${id}/pdf?token=${token}`, "_blank");
  };

  const shareWhatsapp = () => {
    const token = localStorage.getItem('token');
    const message = `Invoice ${invoice.invoice_number} from ${company.name}\n\nAmount: ₹${invoice.total_amount}\n\nView/Download: ${process.env.REACT_APP_BACKEND_URL}/api/invoices/${id}/pdf?token=${token}`;
    const url = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank");
  };

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    if (!paymentData.amount || parseFloat(paymentData.amount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }
    
    setSubmittingPayment(true);
    try {
      await invoiceAPI.recordPayment(id, paymentData);
      toast.success("Payment recorded successfully");
      setPaymentDialogOpen(false);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to record payment");
    } finally {
      setSubmittingPayment(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center h-screen"><div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div></div>;
  if (!invoice) return <div className="p-10 text-center text-rose-500">Invoice not found.</div>;

  const totalAmount = parseFloat(invoice.total_amount) || 0;
  const paidAmount = parseFloat(invoice.paid_amount) || 0;
  const balanceDue = totalAmount - paidAmount;
  const isPaid = balanceDue <= 0;
  const paymentProgress = totalAmount > 0 ? Math.round((paidAmount / totalAmount) * 100) : 0;

  const getStatusDetails = () => {
    if (paymentProgress >= 100) {
      return {
        label: "PAID",
        badgeClass: "bg-emerald-100 text-emerald-700",
        textClass: "text-emerald-700",
        cardClass: "bg-emerald-50/50 border-emerald-100",
        iconBgClass: "bg-emerald-500 shadow-emerald-100",
        barClass: "bg-gradient-to-r from-emerald-400 to-emerald-600",
        icon: CheckCircle2,
        subtext: null,
        mainText: "Fully Collected!"
      };
    }
    if (paymentProgress > 0) {
      return {
        label: "PARTIALLY PAID",
        badgeClass: "bg-amber-100 text-amber-700",
        textClass: "text-amber-700",
        cardClass: "bg-amber-50/50 border-amber-100",
        iconBgClass: "bg-amber-500 shadow-amber-100",
        barClass: "bg-gradient-to-r from-amber-400 to-amber-600",
        icon: AlertCircle,
        subtext: "Payment pending from customer",
        mainText: "PARTIALLY PAID"
      };
    }
    return {
      label: "UNPAID",
      badgeClass: "bg-rose-100 text-rose-700",
      textClass: "text-rose-700",
      cardClass: "bg-slate-50 border-slate-100",
      iconBgClass: "bg-slate-400 shadow-slate-100",
      barClass: "bg-slate-200",
      icon: History,
      subtext: "AWAITING INITIAL PAYMENT",
      mainText: "UNPAID"
    };
  };

  const status = getStatusDetails();
  const StatusIcon = status.icon;

  // Placeholder if no template is selected
  if (!template) {
    return (
      <div className="container max-w-7xl py-20 text-center space-y-4">
        <Layout className="w-16 h-16 text-slate-200 mx-auto" />
        <h2 className="text-xl font-bold text-slate-900">No Template Selected</h2>
        <p className="text-slate-500 text-sm">Please select an invoice template in the Settings &gt; Customization tab to view this invoice.</p>
        <Button onClick={() => navigate('/settings?section=invoice-customization')} className="bg-indigo-600">Go to Settings</Button>
      </div>
    );
  }

  return (
    <div className="container max-w-7xl py-8 space-y-6">
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          @page { size: auto; margin: 0mm; }
          body { margin: 15mm; }
          .print\\:hidden { display: none !important; }
          header, footer, nav { display: none !important; }
        }
      `}} />
      {/* 1. Actions Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-100 shadow-sm sticky top-0 z-20 print:hidden">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-lg hover:bg-slate-50">
            <ArrowLeft className="w-5 h-5 text-slate-500" />
          </Button>
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight">Invoice #{invoice.invoice_number}</h1>
            <div className="flex items-center gap-2 mt-0.5">
              <span className={cn(
                "text-[10px] uppercase font-black px-2.5 py-0.5 rounded-full tracking-wider",
                status.badgeClass
              )}>
                {status.label}
              </span>
              <p className="text-xs text-slate-400 font-medium tracking-tight">Total: ₹{totalAmount.toLocaleString()}</p>
            </div>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100 mr-2">
            <Layout className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider capitalize">{template} Template</span>
          </div>

          {!isPaid && (
            <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
              <DialogTrigger asChild>
                <Button className="h-10 gap-2 bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-100 font-bold px-5">
                  <CreditCard className="w-4 h-4" />
                  Record Payment
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Record Payment</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleRecordPayment} className="space-y-4 pt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Amount (₹)</Label>
                      <Input 
                        type="number" 
                        value={paymentData.amount} 
                        onChange={(e) => setPaymentData({...paymentData, amount: e.target.value})}
                        max={balanceDue}
                        required
                      />
                      <p className="text-[10px] text-slate-500">Max Balance: ₹{balanceDue.toLocaleString()}</p>
                    </div>
                    <div className="space-y-2">
                      <Label>Date</Label>
                      <Input 
                        type="date" 
                        value={paymentData.payment_date} 
                        onChange={(e) => setPaymentData({...paymentData, payment_date: e.target.value})}
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Payment Method</Label>
                    <Select value={paymentData.payment_method} onValueChange={(val) => setPaymentData({...paymentData, payment_method: val})}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Cash">Cash</SelectItem>
                        <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                        <SelectItem value="UPI/GPay">UPI/GPay</SelectItem>
                        <SelectItem value="Cheque">Cheque</SelectItem>
                        <SelectItem value="Card">Credit/Debit Card</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Reference # / Transaction ID</Label>
                    <Input 
                      placeholder="e.g. TXN123456" 
                      value={paymentData.reference_number} 
                      onChange={(e) => setPaymentData({...paymentData, reference_number: e.target.value})}
                    />
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setPaymentDialogOpen(false)}>Cancel</Button>
                    <Button type="submit" disabled={submittingPayment} className="bg-indigo-600">
                      {submittingPayment ? "Recording..." : "Save Payment"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          )}

          <div className="h-8 w-px bg-slate-200 mx-1 hidden md:block"></div>

          <Button variant="outline" size="sm" onClick={() => window.print()} className="h-10 gap-2 border-slate-200 hover:bg-slate-50 font-bold">
            <Printer className="w-4 h-4 text-slate-500" />
            Print
          </Button>
          <Button variant="outline" size="sm" onClick={downloadPdf} className="h-10 gap-2 border-slate-200 hover:bg-slate-50 font-bold text-slate-700">
            <Download className="w-4 h-4 text-slate-500" />
            PDF
          </Button>
          <Button size="sm" onClick={shareWhatsapp} className="h-10 gap-2 bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-100 font-bold px-5">
            <Share2 className="w-4 h-4" />
            WhatsApp
          </Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-4 gap-8">
        {/* 2. Main Invoice Document (The Paper) */}
        <div className="lg:col-span-3">
          <Card className="border border-slate-100 shadow-2xl rounded-2xl overflow-hidden print:shadow-none print:border print:m-0 bg-white">
            <CardContent className="p-0">
              <div className="p-10 md:p-16 space-y-10">
                {/* Header (Logo Top-Left, aligned with Name) */}
                <div className="flex flex-row items-start justify-between border-b border-slate-100 pb-10">
                  <div className="flex items-start gap-6">
                    {company?.logo ? (
                      <img src={`${process.env.REACT_APP_BACKEND_URL}/uploads${company.logo.startsWith('/') ? '' : '/'}${company.logo}`} alt="Logo" className="h-20 w-auto object-contain" />
                    ) : (
                      <div className="h-20 w-20 bg-slate-50 rounded-2xl flex items-center justify-center border border-slate-100 shadow-inner">
                        <Building2 className="w-10 h-10 text-slate-300" />
                      </div>
                    )}
                    <div className="pt-1">
                      <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tight leading-none">{company?.name || "PACHU"}</h2>
                      <p className="text-sm text-slate-400 mt-2 font-medium tracking-wide uppercase">{company?.tagline || "Professional Billing Solutions"}</p>
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

                {/* Details Section (Two Distinct Boxes) */}
                <div className="grid grid-cols-2 gap-6">
                  {/* Box 1 (Business Details) */}
                  <div className="border border-slate-200 rounded-xl p-6 flex flex-col bg-slate-50/30">
                    <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest mb-4 flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-slate-300 rounded-full"></div>
                      Business Details (From)
                    </p>
                    <div className="text-xs space-y-2 text-slate-600">
                      <p className="text-sm font-black text-slate-900">{company?.name || "PACHU"}</p>
                      <p className="leading-relaxed font-medium">{company?.address || "Mandagadde"}</p>
                      <p className="font-medium">{company?.city}, {company?.state} - {company?.pincode}</p>
                      <div className="pt-2 space-y-1.5 border-t border-slate-100 mt-2">
                        <p className="flex items-center gap-2 font-bold text-slate-900"><Phone className="w-3 h-3 text-slate-400" /> {company?.phone}</p>
                        <p className="flex items-center gap-2 font-bold text-slate-900"><Mail className="w-3 h-3 text-slate-400" /> {company?.email}</p>
                      </div>
                    </div>
                  </div>

                  {/* Box 2 (Bill To) */}
                  <div className="border border-slate-200 rounded-xl p-6 flex flex-col bg-slate-50/30">
                    <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest mb-4 flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full"></div>
                      Bill To (Customer)
                    </p>
                    <div className="text-xs space-y-2 text-slate-600">
                      <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">{invoice.Customer?.name || "Abhi"}</h3>
                      <p className="leading-relaxed font-medium">{invoice.Customer?.address || "Gundlupete"}</p>
                      <p className="font-medium">{invoice.Customer?.city}, {invoice.Customer?.state}</p>
                      <div className="pt-2 space-y-1.5 border-t border-slate-100 mt-2">
                        <p className="font-bold text-slate-900"><span className="text-slate-400 mr-1.5 font-black uppercase text-[9px]">Phone:</span> {invoice.Customer?.phone}</p>
                        {invoice.Customer?.gst_number && (
                          <p className="font-black text-slate-900 underline decoration-indigo-100 underline-offset-4">
                            <span className="text-slate-400 mr-1.5 font-black uppercase text-[9px]">GSTIN:</span> {invoice.Customer.gst_number}
                          </p>
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
                              {item.description && <p className="text-[10px] text-slate-400 font-medium italic mt-1 leading-relaxed">{item.description}</p>}
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

                  {/* Totals Section */}
                  <div className="flex flex-col md:flex-row justify-between items-start gap-8 pt-6">
                    <div className="flex-1">
                       {invoice.notes && (
                        <div className="p-5 bg-indigo-50/30 rounded-xl border border-indigo-100/50">
                          <p className="text-[10px] uppercase font-black text-indigo-400 tracking-widest mb-2 leading-none">Notes / Remarks</p>
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
                        paymentProgress === 100 
                          ? "bg-emerald-50 text-emerald-700 border-emerald-100" 
                          : paymentProgress > 0 
                            ? "bg-amber-50 text-amber-700 border-amber-100"
                            : "bg-rose-50 text-rose-700 border-rose-100"
                      )}>
                        <span className="text-[10px] font-black uppercase tracking-widest">Balance Due</span>
                        <span className="text-lg font-black tracking-tighter tabular-nums">₹{balanceDue.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer (QR on the left above Bank, Signature Bottom-Right) */}
                <div className="flex flex-col gap-12 pt-16">
                   <div className="flex flex-row justify-between gap-12 items-end">
                      {/* Bottom Left - Bank & Terms & QR */}
                      <div className="flex-1 flex flex-col gap-8">
                         {/* QR Code on Left */}
                         {company?.qr_code && (
                           <div className="flex flex-col items-start gap-2">
                              <div className="p-2 bg-white border border-slate-200 rounded-2xl shadow-xl">
                                <img src={`${process.env.REACT_APP_BACKEND_URL}/uploads${company.qr_code.startsWith('/') ? '' : '/'}${company.qr_code}`} alt="QR Code" className="w-28 h-24 object-contain" />
                              </div>
                              <p className="text-[9px] text-slate-400 font-black uppercase tracking-[0.2em]">Scan to Pay</p>
                           </div>
                         )}

                         {company?.bank_name && (
                           <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl max-w-sm shadow-sm">
                             <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest mb-4 border-b border-slate-200 pb-2 flex items-center gap-2">
                               <CreditCard className="w-3 h-3" />
                               Banking Information
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
                             <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest mb-3 border-b border-slate-100 pb-1 w-fit pr-6">Terms & Conditions</p>
                             <p className="text-[10px] text-slate-400 leading-relaxed whitespace-pre-line font-medium italic">
                               {company.terms_conditions}
                             </p>
                           </div>
                         )}
                      </div>

                      {/* Bottom Right - Signature */}
                      <div className="w-72 flex flex-col items-center gap-4">
                         <div className="w-full text-center space-y-4 pt-4">
                           <p className="text-[11px] font-black text-slate-900 uppercase tracking-[0.2em]">Authorized Signatory</p>
                           {company?.signature ? (
                             <img src={`${process.env.REACT_APP_BACKEND_URL}/uploads${company.signature.startsWith('/') ? '' : '/'}${company.signature}`} alt="Signature" className="h-16 w-auto mx-auto object-contain mix-blend-multiply" />
                           ) : (
                             <div className="h-16"></div>
                           )}
                           <div className="w-full h-[2px] bg-slate-900 rounded-full"></div>
                           <p className="text-[10px] font-bold text-slate-400 tracking-tight uppercase">{company?.name || "PACHU"}</p>
                           {company.Users?.[0]?.name && <p className="text-[9px] font-black text-slate-900 uppercase">{company.Users[0].name}</p>}
                         </div>
                      </div>
                   </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 3. Right-Side Widgets */}
        <div className="space-y-6 print:hidden">
          {/* Payment Status Card */}
          <Card className="border border-slate-100 rounded-2xl shadow-sm overflow-hidden bg-white">
             <CardHeader className="pb-4 bg-slate-50/50">
               <CardTitle className="text-xs font-black uppercase tracking-widest flex items-center gap-2 text-slate-500">
                 <StatusIcon className={cn("w-4 h-4", paymentProgress === 100 ? "text-emerald-500" : paymentProgress > 0 ? "text-amber-500" : "text-rose-500")} />
                 Payment Status
               </CardTitle>
             </CardHeader>
             <CardContent className="pt-6 space-y-6">
                <div className="space-y-3">
                   <div className="flex justify-between items-end">
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Collection Progress</span>
                      <span className="text-lg font-black text-slate-900 tabular-nums leading-none">
                        {paymentProgress}%
                      </span>
                   </div>
                   <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden border border-slate-200/50 shadow-inner">
                      <div 
                        className={cn(
                          "h-full transition-all duration-1000 ease-out rounded-full shadow-lg",
                          status.barClass
                        )}
                        style={{ width: `${paymentProgress}%` }}
                      ></div>
                   </div>
                </div>
                
                <div className={cn(
                  "p-5 rounded-2xl flex flex-col items-center justify-center gap-3 text-center border-2",
                  status.cardClass
                )}>
                   <div className={cn(
                     "p-3 rounded-full shadow-lg text-white",
                     status.iconBgClass
                   )}>
                     <StatusIcon className="w-6 h-6" />
                   </div>
                   <div className="space-y-1">
                     <p className={cn(
                       "text-sm font-black uppercase tracking-[0.1em]",
                       status.textClass
                     )}>
                       {status.mainText}
                     </p>
                     {status.subtext && (
                       <p className="text-[10px] font-bold opacity-70 italic uppercase">{status.subtext}</p>
                     )}
                   </div>
                </div>
             </CardContent>
          </Card>

          {/* Payment Records Card */}
          <Card className="border border-slate-100 rounded-2xl shadow-sm overflow-hidden bg-white">
            <CardHeader className="pb-4 bg-slate-50/50">
              <CardTitle className="text-xs font-black uppercase tracking-widest flex items-center gap-2 text-slate-500">
                <History className="w-4 h-4 text-indigo-500" />
                Payment Records
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
               {invoice.Payments?.length > 0 ? (
                 <div className="divide-y divide-slate-50">
                    {invoice.Payments.map((pmt, i) => (
                      <div key={pmt.id || i} className="p-5 space-y-2 hover:bg-slate-50/50 transition-all group">
                         <div className="flex justify-between items-start">
                            <span className="text-base font-black text-slate-900 group-hover:text-indigo-600 transition-colors">₹{parseFloat(pmt.amount).toLocaleString()}</span>
                            <span className="text-[10px] font-black text-slate-300 uppercase">{format(new Date(pmt.payment_date), 'dd MMM yyyy')}</span>
                         </div>
                         <div className="flex justify-between items-center">
                            <span className="text-[9px] font-black uppercase bg-slate-100 px-2 py-1 rounded tracking-widest text-slate-500">{pmt.payment_method}</span>
                            {pmt.reference_number && <span className="text-[9px] text-slate-400 font-mono tracking-tighter">#{pmt.reference_number}</span>}
                         </div>
                      </div>
                    ))}
                 </div>
               ) : (
                 <div className="p-12 text-center flex flex-col items-center gap-3">
                    <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center">
                      <CreditCard className="w-5 h-5 text-slate-200" />
                    </div>
                    <p className="text-xs text-slate-400 font-medium italic">No payments recorded yet</p>
                 </div>
               )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default InvoicePreview;
