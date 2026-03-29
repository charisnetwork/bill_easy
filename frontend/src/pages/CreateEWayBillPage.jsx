import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ewayBillAPI, invoiceAPI } from '../services/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '../components/ui/card';
import { 
  ArrowLeft, 
  Truck, 
  MapPin, 
  Navigation, 
  Building2,
  CheckCircle2,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';

const CreateEWayBillPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const invoice_id = searchParams.get('invoice_id');
  
  const [loading, setLoading] = useState(false);
  const [invoice, setInvoice] = useState(null);
  const [formData, setFormData] = useState({
    invoice_id: invoice_id || '',
    transporter_name: '',
    transporter_id: '',
    vehicle_number: '',
    from_place: '',
    to_place: '',
    distance: ''
  });

  useEffect(() => {
    const fetchInvoice = async () => {
      if (invoice_id) {
        try {
          const res = await invoiceAPI.get(invoice_id);
          setInvoice(res.data);
          // Autofill some fields if available
          setFormData(prev => ({
            ...prev,
            to_place: res.data.Customer?.city || '',
            from_place: '' // Should be company city
          }));
        } catch (error) {
          toast.error('Failed to load invoice details');
        }
      }
    };
    fetchInvoice();
  }, [invoice_id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await ewayBillAPI.generate(formData);
      toast.success('E-Way Bill generated successfully!');
      navigate('/eway-bills');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to generate E-Way bill');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <h1 className="text-2xl font-bold text-slate-900">Generate E-Way Bill</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="shadow-sm border-slate-200">
          <CardHeader className="bg-slate-50/50 border-b">
            <CardTitle className="text-lg flex items-center gap-2">
              <Truck className="w-5 h-5 text-indigo-600" />
              Transport Details
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            {invoice && (
              <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-lg flex items-center justify-between mb-2">
                <div>
                  <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">Linked Invoice</p>
                  <p className="text-sm font-bold text-indigo-900">{invoice.invoice_number}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">Total Amount</p>
                  <p className="text-sm font-bold text-indigo-900">₹{invoice.total_amount}</p>
                </div>
              </div>
            )}

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="transporter_name">Transporter Name</Label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input 
                    id="transporter_name" 
                    className="pl-10"
                    placeholder="e.g. Blue Dart"
                    value={formData.transporter_name}
                    onChange={(e) => setFormData({...formData, transporter_name: e.target.value})}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="transporter_id">Transporter ID (GSTIN/ID)</Label>
                <Input 
                  id="transporter_id" 
                  placeholder="15-digit ID"
                  value={formData.transporter_id}
                  onChange={(e) => setFormData({...formData, transporter_id: e.target.value})}
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="vehicle_number">Vehicle Number</Label>
                <div className="relative">
                  <Truck className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input 
                    id="vehicle_number" 
                    className="pl-10 uppercase"
                    placeholder="MH 12 AB 1234"
                    value={formData.vehicle_number}
                    onChange={(e) => setFormData({...formData, vehicle_number: e.target.value})}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="distance">Distance (in KM)</Label>
                <div className="relative">
                  <Navigation className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input 
                    id="distance" 
                    type="number"
                    className="pl-10"
                    placeholder="e.g. 250"
                    value={formData.distance}
                    onChange={(e) => setFormData({...formData, distance: e.target.value})}
                    required
                  />
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6 pt-2">
              <div className="space-y-2">
                <Label htmlFor="from_place">From Place (Dispatch)</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input 
                    id="from_place" 
                    className="pl-10"
                    placeholder="City Name"
                    value={formData.from_place}
                    onChange={(e) => setFormData({...formData, from_place: e.target.value})}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="to_place">To Place (Delivery)</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input 
                    id="to_place" 
                    className="pl-10"
                    placeholder="City Name"
                    value={formData.to_place}
                    onChange={(e) => setFormData({...formData, to_place: e.target.value})}
                    required
                  />
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="bg-slate-50/50 border-t py-6 flex justify-end gap-4">
            <Button type="button" variant="outline" onClick={() => navigate(-1)}>Cancel</Button>
            <Button 
              type="submit" 
              className="bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-100 min-w-[180px]"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  Generate E-Way Bill
                  <CheckCircle2 className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
};

export default CreateEWayBillPage;
