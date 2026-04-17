import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { quotationAPI, companyAPI } from "../services/api";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { 
  Printer, 
  Download, 
  ArrowLeft,
  Phone,
  Mail,
  Building2,
  Calendar,
  FileText,
  ShoppingCart,
  Clock
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "../lib/utils";
import { toast } from "sonner";
import { getIndustryConfig } from "../lib/industryConfig";

const QuotationPreview = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [quotation, setQuotation] = useState(null);
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [industryConfig, setIndustryConfig] = useState(getIndustryConfig('General Store'));

  const fetchData = async () => {
    try {
      const [quotationRes, companyRes] = await Promise.all([
        quotationAPI.get(id),
        companyAPI.get()
      ]);
      setQuotation(quotationRes.data);
      setCompany(companyRes.data);
      
      const selectedIndustry = companyRes.data.business_category || 'General Store';
      setIndustryConfig(getIndustryConfig(selectedIndustry));
    } catch (error) {
      console.error("Failed to load data", error);
      toast.error("Failed to load quotation details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const downloadPdf = async () => {
    try {
      toast.info('Generating PDF...');
      const response = await quotationAPI.downloadPdf(id);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `quotation_${quotation.quotation_number}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      toast.error('Failed to download PDF');
    }
  };

  const convertToSale = () => {
    if (!quotation) return;
    
    // Pass quotation data to the Create Invoice page via navigation state
    navigate('/invoices/new', { 
      state: { 
        fromQuotation: true,
        quotationData: {
          customer_id: quotation.customer_id,
          items: quotation.items.map(item => ({
            product_id: item.product_id,
            quantity: item.quantity,
            unit_price: item.unit_price,
            tax_rate: item.tax_rate,
            description: item.description || ''
          })),
          notes: quotation.notes,
          terms: quotation.terms,
          industry_metadata: quotation.industry_metadata
        }
      } 
    });
    toast.success("Quotation data loaded into New Sale");
  };

  if (loading) return <div className="flex items-center justify-center h-screen"><div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div></div>;
  if (!quotation) return <div className="p-10 text-center text-rose-500">Quotation not found.</div>;

  const totalAmount = parseFloat(quotation.total_amount) || 0;

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
      
      {/* Actions Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-100 shadow-sm sticky top-0 z-20 print:hidden">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/quotations')} className="rounded-lg hover:bg-slate-50">
            <ArrowLeft className="w-5 h-5 text-slate-500" />
          </Button>
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight">Quotation #{quotation.quotation_number}</h1>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[10px] uppercase font-black px-2.5 py-0.5 rounded-full tracking-wider bg-blue-100 text-blue-700">
                {quotation.status}
              </span>
              <p className="text-xs text-slate-400 font-medium tracking-tight">Total: ₹{totalAmount.toLocaleString()}</p>
            </div>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-2">
          <Button 
            onClick={convertToSale} 
            className="h-10 gap-2 bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-100 font-bold px-5"
          >
            <ShoppingCart className="w-4 h-4" />
            Convert to Sale
          </Button>

          <div className="h-8 w-px bg-slate-200 mx-1 hidden md:block"></div>

          <Button variant="outline" size="sm" onClick={() => window.print()} className="h-10 gap-2 border-slate-200 hover:bg-slate-50 font-bold">
            <Printer className="w-4 h-4 text-slate-500" />
            Print
          </Button>
          <Button variant="outline" size="sm" onClick={downloadPdf} className="h-10 gap-2 border-slate-200 hover:bg-slate-50 font-bold text-slate-700">
            <Download className="w-4 h-4 text-slate-500" />
            PDF
          </Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-4 gap-8">
        {/* Main Document */}
        <div className="lg:col-span-3">
          <Card className="border border-slate-100 shadow-2xl rounded-2xl overflow-hidden print:shadow-none print:border print:m-0 bg-white">
            <CardContent className="p-0">
              <div className="p-10 md:p-16 space-y-10">
                {/* Header */}
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
                      <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tight leading-none">{company?.name}</h2>
                      <p className="text-sm text-slate-400 mt-2 font-medium tracking-wide uppercase">{company?.tagline || "Quotation / Estimate"}</p>
                    </div>
                  </div>
                  <div className="text-right flex flex-col items-end pt-1">
                    <div className="px-5 py-1.5 bg-slate-900 text-white font-black text-[11px] rounded uppercase tracking-[0.2em] mb-4 shadow-xl">Quotation</div>
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-end gap-2">
                        <span className="text-[10px] uppercase font-black text-slate-300 tracking-wider">Quotation No:</span>
                        <span className="text-lg font-black text-slate-900 tabular-nums leading-none">{quotation.quotation_number}</span>
                      </div>
                      <div className="flex items-center justify-end gap-2">
                        <span className="text-[10px] uppercase font-black text-slate-300 tracking-wider">Date:</span>
                        <span className="text-sm font-bold text-slate-600 leading-none">{format(new Date(quotation.quotation_date), 'dd MMM yyyy')}</span>
                      </div>
                      {quotation.valid_until && (
                        <div className="flex items-center justify-end gap-2">
                          <span className="text-[10px] uppercase font-black text-slate-300 tracking-wider">Valid Until:</span>
                          <span className="text-sm font-bold text-amber-600 leading-none">{format(new Date(quotation.valid_until), 'dd MMM yyyy')}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Details Section */}
                <div className="grid grid-cols-2 gap-6">
                  <div className="border border-slate-200 rounded-xl p-6 flex flex-col bg-slate-50/30">
                    <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest mb-4 flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-slate-300 rounded-full"></div>
                      From
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
                      <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full"></div>
                      Quotation For
                    </p>
                    <div className="text-xs space-y-2 text-slate-600">
                      <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">{quotation.Customer?.name}</h3>
                      <p className="leading-relaxed font-medium">{quotation.Customer?.address}</p>
                      <p className="font-medium">{quotation.Customer?.city}, {quotation.Customer?.state}</p>
                      <div className="pt-2 space-y-1.5 border-t border-slate-100 mt-2">
                        <p className="font-bold text-slate-900"><span className="text-slate-400 mr-1.5 font-black uppercase text-[9px]">Phone:</span> {quotation.Customer?.phone}</p>
                        {quotation.Customer?.gst_number && (
                          <p className="font-black text-slate-900">
                            <span className="text-slate-400 mr-1.5 font-black uppercase text-[9px]">GSTIN:</span> {quotation.Customer.gst_number}
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
                        {quotation.items?.map((item) => (
                          <tr key={item.id} className="text-sm">
                            <td className="px-6 py-5 border-r border-slate-100">
                              <p className="font-black text-slate-900 uppercase tracking-tight">{item.Product?.name}</p>
                              {item.description && <p className="text-[10px] text-slate-400 font-medium italic mt-1 leading-relaxed">{item.description}</p>}
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
                       {quotation.notes && (
                        <div className="p-5 bg-indigo-50/30 rounded-xl border border-indigo-100/50">
                          <p className="text-[10px] uppercase font-black text-indigo-400 tracking-widest mb-2 leading-none">Notes / Remarks</p>
                          <p className="text-xs text-slate-600 font-medium italic leading-relaxed">{quotation.notes}</p>
                        </div>
                       )}
                    </div>
                    <div className="w-full md:w-80 bg-slate-50/50 p-6 rounded-2xl border border-slate-100 space-y-3">
                      <div className="flex justify-between text-[11px] text-slate-400 font-black uppercase tracking-wider">
                        <span>Sub Total</span>
                        <span className="text-slate-600 tabular-nums">₹{parseFloat(quotation.subtotal).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-[11px] text-slate-400 font-black uppercase tracking-wider">
                        <span>Tax Amount</span>
                        <span className="text-slate-600 tabular-nums">₹{parseFloat(quotation.tax_amount).toLocaleString()}</span>
                      </div>
                      <div className="h-px bg-slate-200 my-2"></div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-black text-slate-900 uppercase tracking-widest">Total Amount</span>
                        <span className="text-2xl font-black text-slate-900 tabular-nums tracking-tighter">₹{totalAmount.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Info Column */}
        <div className="space-y-6 print:hidden">
          <Card className="border border-slate-100 rounded-2xl shadow-sm overflow-hidden bg-white">
             <CardHeader className="pb-4 bg-slate-50/50">
               <CardTitle className="text-xs font-black uppercase tracking-widest flex items-center gap-2 text-slate-500">
                 <Clock className="w-4 h-4 text-amber-500" />
                 Quotation Info
               </CardTitle>
             </CardHeader>
             <CardContent className="pt-6 space-y-4">
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Status</p>
                  <p className="text-sm font-bold text-slate-900 uppercase">{quotation.status}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Expiry Date</p>
                  <p className="text-sm font-bold text-slate-900 uppercase">
                    {quotation.valid_until ? format(new Date(quotation.valid_until), 'dd MMM yyyy') : 'No Expiry'}
                  </p>
                </div>
             </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default QuotationPreview;
