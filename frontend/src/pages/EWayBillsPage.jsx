import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ewayBillAPI } from '../services/api';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '../components/ui/table';
import { Badge } from '../components/ui/badge';
import { 
  Plus, 
  Truck, 
  Eye, 
  FileText, 
  ExternalLink,
  Loader2,
  Download
} from 'lucide-react';
import { toast } from 'sonner';

const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
};

export const EWayBillsPage = () => {
  const navigate = useNavigate();
  const [ewayBills, setEWayBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchEWayBills = async () => {
    try {
      setLoading(true);
      const response = await ewayBillAPI.getAll({ page, limit: 20 });
      setEWayBills(response.data.ewayBills);
      setTotalPages(response.data.totalPages);
    } catch (error) {
      toast.error('Failed to load E-Way bills');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPdf = async (id) => {
    try {
      const response = await ewayBillAPI.downloadPdf(id);
      if (response.data.type === 'application/json') {
         const reader = new FileReader();
         reader.onload = () => {
           const result = JSON.parse(reader.result);
           toast.info(result.message);
         };
         reader.readAsText(response.data);
         return;
      }
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `eway_bill_${id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      toast.error('Failed to download PDF');
    }
  };

  useEffect(() => {
    fetchEWayBills();
  }, [page]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl md:text-3xl font-bold text-slate-900">E-Way Bills</h1>
          <p className="text-slate-600">Generate and track electronic way bills for transportation</p>
        </div>
        <Link to="/eway-bills/new">
          <Button className="bg-indigo-600 hover:bg-indigo-700">
            <Plus className="w-4 h-4 mr-2" />
            Generate New E-Way Bill
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Generated E-Way Bills</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            </div>
          ) : ewayBills.length === 0 ? (
            <div className="text-center py-12">
              <Truck className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-600">No E-Way bills generated yet</p>
              <Button 
                variant="link" 
                className="text-indigo-600"
                onClick={() => navigate('/eway-bills/new')}
              >
                Create your first E-Way bill
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>E-Way Bill #</TableHead>
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Vehicle #</TableHead>
                  <TableHead>From / To</TableHead>
                  <TableHead>Valid Until</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="w-20">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ewayBills.map((bill) => (
                  <TableRow key={bill.id}>
                    <TableCell className="font-mono font-medium">{bill.eway_bill_number}</TableCell>
                    <TableCell>{bill.Invoice?.invoice_number || 'Direct'}</TableCell>
                    <TableCell className="font-mono text-xs uppercase">{bill.vehicle_number || '-'}</TableCell>
                    <TableCell>
                      <div className="text-xs">
                        <div className="text-slate-500 font-medium">From: {bill.from_place}</div>
                        <div className="text-slate-500 font-medium">To: {bill.to_place}</div>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs">{formatDate(bill.valid_until)}</TableCell>
                    <TableCell className="text-center">
                      <Badge className={bill.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'}>
                        {bill.status?.toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => navigate(`/eway-bills/${bill.id}`)}>
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDownloadPdf(bill.id)}>
                          <Download className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default EWayBillsPage;
