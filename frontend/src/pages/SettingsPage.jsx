import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import api, { companyAPI, authAPI, utilityAPI } from '../services/api';
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useSearchParams, useNavigate, Link } from 'react-router-dom';

import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import {
  Card,
  CardContent,
} from '../components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '../components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription
} from '../components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '../components/ui/select';
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage,
  FormDescription
} from "../components/ui/form";
import { Switch } from "../components/ui/switch";
import { Badge } from '../components/ui/badge';
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "../components/ui/command";
import {
  Building2,
  User,
  Users,
  Shield,
  Plus,
  Trash2,
  Save,
  KeyRound,
  Mail,
  Phone,
  UserCog,
  ShieldCheck,
  Settings,
  Settings2,
  Warehouse,
  MapPin,
  RefreshCcw,
  Pencil,
  ChevronRight,
  ChevronDown,
  FileText,
  CreditCard,
  Lock,
  Palette,
  Printer,
  Upload,
  Image as ImageIcon,
  Briefcase,
  Search,
  Loader2,
  X,
  Check,
  CheckCircle2,
  Banknote,
  Layout,
  QrCode,
  Type
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '../lib/utils';
import { industries } from "../lib/industryConfig";

// --- Schemas ---

const profileSchema = z.object({
  name: z.string().min(2, "Name is required"),
  phone: z.string().min(10, "Valid phone number is required"),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(6, "New password must be at least 6 characters"),
  confirmPassword: z.string().min(1, "Please confirm your password"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

const userSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  phone: z.string().optional(),
  role: z.enum(["admin", "staff"]).default("staff"),
});

const businessSchema = z.object({
  name: z.string().min(2, "Business name is required"),
  phone: z.string().min(10, "Valid phone number is required"),
  email: z.string().email("Invalid email address").or(z.literal("")),
  address: z.string().min(5, "Address is required"),
  state: z.string().min(2, "State is required"),
  pincode: z.string().length(6, "Pincode must be 6 digits"),
  city: z.string().min(2, "City is required"),
  business_types: z.array(z.string()).default([]),
  industry: z.string().min(1, "Industry type is required"),
  registration_type: z.string().min(1, "Registration type is required"),
  extra_details: z.array(z.object({ label: z.string(), value: z.string() })).default([])
});

const taxSchema = z.object({
  gst_registered: z.boolean().default(false),
  gst_number: z.string().optional().or(z.literal("")),
  pan_number: z.string().optional().or(z.literal("")),
  enable_tds: z.boolean().default(false),
  enable_tcs: z.boolean().default(false),
});

const bankSchema = z.object({
  bank_name: z.string().min(2, "Bank name is required"),
  account_number: z.string().min(5, "Account number is required"),
  ifsc_code: z.string().length(11, "IFSC code must be 11 characters"),
  branch_name: z.string().min(2, "Branch name is required"),
  terms_conditions: z.string().optional()
});

const customizationSchema = z.object({
  template_id: z.string().min(1, "Please select a template"),
});

// --- Constants ---

const registrationTypes = [
  "Sole Proprietorship", "Partnership", "LLP", "Private Limited", "Public Limited", "One Person Company"
];

const businessTypes = [
  "Retailer", "Wholesaler", "Distributor", "Manufacturer", "Services", "Other"
];

const states = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", 
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", 
  "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", 
  "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", 
  "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", 
  "Uttar Pradesh", "Uttarakhand", "West Bengal", "Andaman and Nicobar Islands", 
  "Chandigarh", "Dadra and Nagar Haveli and Daman and Diu", "Delhi", 
  "Jammu and Kashmir", "Ladakh", "Lakshadweep", "Puducherry"
];

const templates = [
  { id: 'modern', name: 'Modern Professional', preview: 'https://placehold.co/200x280?text=Modern' },
  { id: 'classic', name: 'Classic Compact', preview: 'https://placehold.co/200x280?text=Classic' },
  { id: 'minimal', name: 'Minimalist', preview: 'https://placehold.co/200x280?text=Minimal' },
  { id: 'gst-standard', name: 'Standard GST', preview: 'https://placehold.co/200x280?text=GST' }
];

const BUSINESS_CONFIGS = {
  distribution: {
    labels: { f1: 'Item Description', f2: 'HSN/SAC', f3: 'Batch/Lot #', f4: 'Rate', f5: 'GST', f6: 'Discount' },
    toggles: { showF1: true, showF2: true, showF3: false, showF4: true, showF5: true, showF6: true }
  },
  retail: {
    labels: { f1: 'Product Name', f2: 'Unit', f3: 'Price', f4: 'Tax%', f5: 'Discount%', f6: 'Final Price' },
    toggles: { showF1: true, showF2: false, showF3: true, showF4: true, showF5: true, showF6: true }
  },
  automobile: {
    labels: { f1: 'PARTS DESCRIPTION', f2: 'HSN/Code', f3: 'MRP/RATE', f4: 'QTY', f5: 'Discount%', f6: 'Total Amount' },
    toggles: { showF1: true, showF2: true, showF3: true, showF4: true, showF5: true, showF6: true }
  },
  group5_service: {
    labels: { f1: 'Service Provided', f2: 'Date', f3: 'Consultation Fee', f4: 'GST/Tax', f5: 'Discount', f6: 'Project Code' },
    toggles: { showF1: true, showF2: false, showF3: true, showF4: true, showF5: true, showF6: false }
  },
  group6_mfg_construction: {
    labels: { f1: 'Material Name', f2: 'Supplier ID', f3: 'PO Number', f4: 'UOM', f5: 'Rate', f6: 'Total' },
    toggles: { showF1: true, showF2: true, showF3: false, showF4: true, showF5: true, showF6: true }
  },
  generic: {
    labels: { f1: 'Description', f2: 'Date', f3: 'Rate', f4: 'Amount', f5: 'Tax', f6: 'Total' },
    toggles: { showF1: true, showF2: false, showF3: true, showF4: true, showF5: true, showF6: true }
  }
};

// --- Main Component ---

export const SettingsPage = () => {
  const { user, company, refreshProfile, hasFeature } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeSection = searchParams.get('section') || 'business-details';
  
  const [gstLoading, setGstLoading] = useState(false);

  // GST Lookup Handler
  const handleGstLookup = async () => {
    const gstin = taxForm.getValues('gst_number');
    if (!gstin || gstin.length !== 15) {
      toast.error("Please enter a valid 15-digit GSTIN");
      return;
    }

    setGstLoading(true);
    try {
      const { data } = await utilityAPI.getGST(gstin);
      
      // Auto-fill fields if they exist in this form or related forms
      // For SettingsPage, we might want to update business details too
      // But taxForm only has tax fields. We need to handle this carefully.
      
      if (data) {
        toast.success("GST details fetched successfully");
        // Update GST number in case it was formatted
        taxForm.setValue('gst_number', data.gstin);
        
        // If we want to auto-fill business details, we need to switch or access businessForm
        // For now, let's at least show the data or update what we can.
        console.log("Fetched GST Data:", data);
        
        // If businessForm is accessible (it is defined below in the component)
        if (businessForm) {
          businessForm.setValue('name', data.legal_name || data.trade_name);
          if (data.address_details) {
            const addr = data.address_details;
            const fullAddr = `${addr.building_name}, ${addr.street}, ${addr.location}, ${addr.city}`;
            businessForm.setValue('address', fullAddr);
            businessForm.setValue('city', addr.city);
            businessForm.setValue('state', addr.state);
            businessForm.setValue('pincode', addr.pincode);
          }
        }
      }
    } catch (error) {
      console.error("GST Lookup Error:", error);
      toast.error(error.response?.data?.error || "Could not find details for this GSTIN. Please enter manually.");
    } finally {
      setGstLoading(false);
    }
  };
  
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  // Data States
  const [users, setUsers] = useState([]);
  const [godowns, setGodowns] = useState([]);
  const [logoPreview, setLogoPreview] = useState(null);
  const [signaturePreview, setSignaturePreview] = useState(null);
  const [qrPreview, setQrPreview] = useState(null);

  // Dialog States
  const [userDialogOpen, setUserDialogOpen] = useState(false);
  const [godownDialogOpen, setGodownDialogOpen] = useState(false);
  const [editGodownDialogOpen, setEditGodownDialogOpen] = useState(false);
  const [newGodown, setNewGodown] = useState({ name: '', address: '' });
  const [editingGodown, setEditingGodown] = useState(null);

  // Expanded Menu States
  const [expandedMenus, setExpandedMenus] = useState(['account', 'business', 'invoice']);

  const toggleMenu = (menuId) => {
    setExpandedMenus(prev => 
      prev.includes(menuId) ? prev.filter(m => m !== menuId) : [...prev, menuId]
    );
  };

  // --- Forms ---

  const profileForm = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: "", phone: "" },
  });

  const passwordForm = useForm({
    resolver: zodResolver(passwordSchema),
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
  });

  const newUserForm = useForm({
    resolver: zodResolver(userSchema),
    defaultValues: { name: "", email: "", password: "", phone: "", role: "staff" },
  });

  const businessForm = useForm({
    resolver: zodResolver(businessSchema),
    defaultValues: {
      name: "", phone: "", email: "", address: "", state: "Karnataka",
      pincode: "", city: "", business_types: [], industry: "Retail",
      registration_type: "Sole Proprietorship", extra_details: []
    }
  });

  const { fields, append, remove } = useFieldArray({
    control: businessForm.control,
    name: "extra_details"
  });

  const taxForm = useForm({
    resolver: zodResolver(taxSchema),
    defaultValues: {
      gst_registered: false, gst_number: "", pan_number: "",
      enable_tds: false, enable_tcs: false
    }
  });

  const bankForm = useForm({
    resolver: zodResolver(bankSchema),
    defaultValues: {
      bank_name: "", account_number: "", ifsc_code: "",
      branch_name: "", terms_conditions: ""
    }
  });

  const customForm = useForm({
    resolver: zodResolver(customizationSchema),
    defaultValues: { template_id: "modern" }
  });

  const invoiceCustomForm = useForm({
    defaultValues: {
      businessType: 'generic',
      columnLabels: {},
      columnToggles: {},
      headerColor: '#1D70B8',
      menuColor: '#FFFFFF',
      textSize: '10pt'
    }
  });

  // --- Fetch Logic ---

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [usersRes, godownsRes, companyRes] = await Promise.all([
          companyAPI.getUsers(),
          companyAPI.getGodowns(),
          companyAPI.get()
        ]);
        
        setUsers(usersRes.data);
        setGodowns(godownsRes.data);
        
        const c = companyRes.data;
        
        // Reset Invoice Customization Form
        invoiceCustomForm.reset({
          businessType: c.invoice_business_category || 'generic',
          columnLabels: c.invoice_column_labels || {},
          columnToggles: c.invoice_column_toggles || {},
          headerColor: c.invoice_header_color || '#1D70B8',
          menuColor: c.invoice_menu_color || '#FFFFFF',
          textSize: c.invoice_text_size || '10pt'
        });

        businessForm.reset({
          name: c.name || "",
          phone: c.phone || "",
          email: c.email || "",
          address: c.address || "",
          state: c.state || "Karnataka",
          pincode: c.pincode || "",
          city: c.city || "",
          business_types: c.settings?.businessTypes || [],
          industry: c.business_category || "Retail",
          registration_type: c.settings?.ownerType || "Sole Proprietorship",
          extra_details: c.settings?.extra_details || []
        });

        taxForm.reset({
          gst_registered: c.gst_registered ?? !!c.gst_number,
          gst_number: c.gst_number || "",
          pan_number: c.settings?.pan_number || "",
          enable_tds: c.enable_tds ?? !!c.settings?.enableTDS,
          enable_tcs: c.enable_tcs ?? !!c.settings?.enableTCS
        });

        bankForm.reset({
          bank_name: c.bank_name || "",
          account_number: c.account_number || "",
          ifsc_code: c.ifsc_code || "",
          branch_name: c.branch_name || "",
          terms_conditions: c.terms_conditions || ""
        });

        customForm.reset({
          template_id: c.settings?.template_id || c.settings?.invoice_template || "modern"
        });

        if (c.logo) setLogoPreview(c.logo.startsWith('http') ? c.logo : `${process.env.REACT_APP_BACKEND_URL}/uploads${c.logo.startsWith('/') ? '' : '/'}${c.logo}`);
        if (c.signature) setSignaturePreview(c.signature.startsWith('http') ? c.signature : `${process.env.REACT_APP_BACKEND_URL}/uploads${c.signature.startsWith('/') ? '' : '/'}${c.signature}`);
        if (c.qr_code) setQrPreview(c.qr_code.startsWith('http') ? c.qr_code : `${process.env.REACT_APP_BACKEND_URL}/uploads${c.qr_code.startsWith('/') ? '' : '/'}${c.qr_code}`);
        
        if (user) {
          profileForm.reset({ name: user.name || '', phone: user.phone || '' });
        }
      } catch (err) {
        toast.error("Failed to load settings data");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [businessForm, taxForm, profileForm, bankForm, customForm, user]);

  // --- Submit Handlers ---

  const handleProfileSubmit = async (values) => {
    setSubmitting(true);
    try {
      await authAPI.updateProfile(values);
      toast.success('Profile updated successfully');
      refreshProfile();
    } catch {
      toast.error('Failed to update profile');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePasswordSubmit = async (values) => {
    setSubmitting(true);
    try {
      await authAPI.changePassword({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword
      });
      toast.success('Password changed successfully');
      passwordForm.reset();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to change password');
    } finally {
      setSubmitting(false);
    }
  };

  const handleBusinessSubmit = async (values) => {
    setSubmitting(true);
    try {
      const payload = {
        ...values,
        business_category: values.industry,
        settings: {
          ...company.settings,
          industry: values.industry,
          ownerType: values.registration_type,
          businessTypes: values.business_types,
          extra_details: values.extra_details
        }
      };
      await companyAPI.update(payload);
      toast.success("Business details updated");
      refreshProfile();
    } catch {
      toast.error("Failed to save business details");
    } finally {
      setSubmitting(false);
    }
  };

  const handleTaxSubmit = async (values) => {
    setSubmitting(true);
    try {
      const payload = {
        gst_registered: values.gst_registered,
        gst_number: values.gst_registered ? values.gst_number : "",
        enable_tds: values.enable_tds,
        enable_tcs: values.enable_tcs,
        settings: {
          pan_number: values.pan_number
        }
      };
      await api.patch('/company/settings', payload);
      toast.success("Tax & GST settings updated");
      refreshProfile();
    } catch {
      toast.error("Failed to save tax settings");
    } finally {
      setSubmitting(false);
    }
  };

  const handleBankSubmit = async (values) => {
    setSubmitting(true);
    try {
      await companyAPI.update(values);
      toast.success("Banking & Payment details updated");
      refreshProfile();
    } catch {
      toast.error("Failed to save bank details");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCustomSubmit = async (values) => {
    setSubmitting(true);
    try {
      await api.patch('/company/settings', {
        settings: { template_id: values.template_id }
      });
      toast.success("Invoice template updated");
      refreshProfile();
    } catch {
      toast.error("Failed to update template");
    } finally {
      setSubmitting(false);
    }
  };

  const handleInvoiceCustomSubmit = async (values) => {
    setSubmitting(true);
    try {
      await companyAPI.customizeInvoice(values);
      toast.success("Invoice customization saved");
      refreshProfile();
    } catch (error) {
      toast.error("Failed to save customization");
    } finally {
      setSubmitting(false);
    }
  };

  // Helper for optimistic toggle updates
  const handleOptimisticToggle = async (field, value) => {
    const prevValues = taxForm.getValues();
    taxForm.setValue(field, value);
    
    try {
      const payload = {};
      
      if (field === 'gst_registered') payload.gst_registered = value;
      if (field === 'enable_tds') payload.enable_tds = value;
      if (field === 'enable_tcs') payload.enable_tcs = value;
      
      await api.patch('/company/settings', payload);
      refreshProfile();
    } catch (err) {
      taxForm.setValue(field, prevValues[field]);
      toast.error("Failed to update setting");
    }
  };

  const onFileUpload = async (type, file) => {
    if (file.size > 5 * 1024 * 1024) return toast.error("Maximum file size is 5MB");
    const formData = new FormData();
    formData.append(type, file);
    try {
      let endpoint = '';
      if (type === 'logo') endpoint = '/company/upload-logo';
      else if (type === 'signature') endpoint = '/company/upload-signature';
      else if (type === 'qr_code') endpoint = '/company/upload-qr';

      const res = await api.post(endpoint, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      const filePath = res.data.logo || res.data.signature || res.data.qr_code;
      const previewUrl = `${process.env.REACT_APP_BACKEND_URL}/uploads${filePath.startsWith('/') ? '' : '/'}${filePath}`;
      
      if (type === 'logo') setLogoPreview(previewUrl);
      else if (type === 'signature') setSignaturePreview(previewUrl);
      else if (type === 'qr_code') setQrPreview(previewUrl);
      
      refreshProfile();
      toast.success(`${type.split('_').join(' ').toUpperCase()} uploaded`);
    } catch {
      toast.error(`Failed to upload ${type}`);
    }
  };

  // --- Godown Handlers ---

  const onAddGodown = async (e) => {
    e.preventDefault();
    if (!newGodown.name) return toast.error("Name is required");
    try {
      setSubmitting(true);
      await companyAPI.addGodown(newGodown);
      toast.success("Godown added");
      setGodownDialogOpen(false);
      setNewGodown({ name: '', address: '' });
      const res = await companyAPI.getGodowns();
      setGodowns(res.data);
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to add godown");
    } finally {
      setSubmitting(false);
    }
  };

  const onDeleteGodown = async (id) => {
    if (!window.confirm("Are you sure?")) return;
    try {
      await companyAPI.deleteGodown(id);
      toast.success("Godown deleted");
      const res = await companyAPI.getGodowns();
      setGodowns(res.data);
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to delete godown");
    }
  };

  // --- Team Handlers ---

  const onAddUser = async (values) => {
    setSubmitting(true);
    try {
      await companyAPI.addUser(values);
      toast.success('User added');
      setUserDialogOpen(false);
      newUserForm.reset();
      const res = await companyAPI.getUsers();
      setUsers(res.data);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to add user');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm('Delete this user?')) return;
    try {
      await companyAPI.deleteUser(id);
      toast.success('User deleted');
      const res = await companyAPI.getUsers();
      setUsers(res.data);
    } catch {
      toast.error('Failed to delete user');
    }
  };

  // --- Navigation Items ---

  const navItems = [
    {
      id: 'account',
      label: 'Account Settings',
      icon: User,
      subItems: [
        { id: 'account-profile', label: 'Profile', icon: UserCog },
        { id: 'account-security', label: 'Security', icon: ShieldCheck },
      ]
    },
    {
      id: 'business',
      label: 'Business Settings',
      icon: Building2,
      subItems: [
        { id: 'business-details', label: 'Company Details', icon: FileText },
        { id: 'business-tax', label: 'Tax & GST', icon: Settings2 },
        { id: 'business-godowns', label: 'Godowns', icon: Warehouse },
      ]
    },
    {
      id: 'invoice',
      label: 'Invoice Settings',
      icon: FileText,
      subItems: [
        { id: 'invoice-customization', label: 'Customization', icon: Palette },
        { id: 'invoice-print', label: 'Print Settings', icon: Printer },
      ]
    },
    { id: 'payments', label: 'Payment & Bank Settings', icon: CreditCard },
    { id: 'team', label: 'Team/Users', icon: Users },
  ];

  const getBreadcrumbs = () => {
    let parts = ['Settings'];
    navItems.forEach(item => {
      if (item.id === activeSection) parts.push(item.label);
      if (item.subItems) {
        item.subItems.forEach(sub => {
          if (sub.id === activeSection) {
            parts.push(item.label.split(' ')[0]);
            parts.push(sub.label);
          }
        });
      }
    });
    return parts.join(' > ');
  };

  const currentForm = useMemo(() => {
    if (activeSection === 'account-profile') return profileForm;
    if (activeSection === 'account-security') return passwordForm;
    if (activeSection === 'business-details') return businessForm;
    if (activeSection === 'business-tax') return taxForm;
    if (activeSection === 'payments') return bankForm;
    if (activeSection === 'invoice-customization') return invoiceCustomForm;
    return null;
  }, [activeSection, profileForm, passwordForm, businessForm, taxForm, bankForm, invoiceCustomForm]);

  const handleGlobalSubmit = () => {
    if (activeSection === 'account-profile') profileForm.handleSubmit(handleProfileSubmit)();
    else if (activeSection === 'account-security') passwordForm.handleSubmit(handlePasswordSubmit)();
    else if (activeSection === 'business-details') businessForm.handleSubmit(handleBusinessSubmit)();
    else if (activeSection === 'business-tax') taxForm.handleSubmit(handleTaxSubmit)();
    else if (activeSection === 'payments') bankForm.handleSubmit(handleBankSubmit)();
    else if (activeSection === 'invoice-customization') invoiceCustomForm.handleSubmit(handleInvoiceCustomSubmit)();
  };

  if (loading) return (
    <div className="flex h-[calc(100vh-80px)] items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
    </div>
  );

  return (
    <div className="flex h-[calc(100vh-80px)] -m-4 md:-m-6 lg:-m-8 bg-slate-50 overflow-hidden">
      
      {/* Sub-Sidebar Navigation */}
      <aside className="w-72 bg-slate-50 border-r border-slate-200 flex flex-col shrink-0 overflow-y-auto">
        <div className="p-6 pt-8 space-y-2">
          {navItems.map((item) => (
            <div key={item.id} className="space-y-1">
              {item.subItems ? (
                <>
                  <button
                    onClick={() => toggleMenu(item.id)}
                    className="w-full flex items-center justify-between px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <item.icon className="w-4 h-4 text-slate-400" />
                      {item.label}
                    </div>
                    <ChevronDown className={cn("w-4 h-4 text-slate-400 transition-transform", !expandedMenus.includes(item.id) && "-rotate-90")} />
                  </button>
                  {expandedMenus.includes(item.id) && (
                    <div className="ml-4 space-y-1 mt-1 border-l border-slate-200">
                      {item.subItems.map((sub) => (
                        <button
                          key={sub.id}
                          onClick={() => setSearchParams({ section: sub.id })}
                          className={cn(
                            "w-full flex items-center gap-3 pl-8 pr-4 py-2 text-sm font-medium transition-all relative",
                            activeSection === sub.id 
                              ? "text-indigo-700 bg-indigo-50/80" 
                              : "text-slate-500 hover:text-slate-900 hover:bg-slate-100/50"
                          )}
                        >
                          {activeSection === sub.id && <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-600 rounded-r-full" />}
                          {sub.label}
                        </button>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <button
                  onClick={() => setSearchParams({ section: item.id })}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-2.5 text-sm font-semibold transition-all relative",
                    activeSection === item.id 
                      ? "text-indigo-700 bg-indigo-50/80" 
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                  )}
                >
                  {activeSection === item.id && <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-600 rounded-r-full" />}
                  <item.icon className={cn("w-4 h-4", activeSection === item.id ? "text-indigo-600" : "text-slate-400")} />
                  {item.label}
                </button>
              )}
            </div>
          ))}
        </div>
      </aside>

      {/* Main Settings Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        
        {/* Breadcrumb & Action Bar */}
        <header className="h-16 border-b border-slate-200 bg-white flex items-center justify-between px-8 shrink-0">
          <div className="text-sm font-medium text-slate-500">
            {getBreadcrumbs()}
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" className="h-9 border-slate-200" onClick={() => navigate(-1)}>
              Cancel
            </Button>
            <Button className="h-9 bg-[#E66E26] hover:bg-[#d45d1d] text-white" onClick={() => navigate('/settings/business/new')}>
              <Plus className="w-4 h-4 mr-2" />
              Create New Business
            </Button>
            <Button 
              disabled={submitting || (currentForm && !currentForm.formState.isDirty)}
              onClick={handleGlobalSubmit}
              className="h-9 bg-[#4F46E5] hover:bg-[#4338CA] text-white min-w-[120px]"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Changes"}
            </Button>
          </div>
        </header>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-8">
          <div className="max-w-5xl mx-auto">
            <Card className="bg-white border-slate-200 shadow-sm overflow-hidden min-h-[600px]">
              <CardContent className="p-10">
                
                {activeSection === 'account-profile' && (
                  <Form {...profileForm}>
                    <form onSubmit={profileForm.handleSubmit(handleProfileSubmit)} className="space-y-8">
                      <div className="grid grid-cols-2 gap-8">
                        <FormField
                          control={profileForm.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Full Name</FormLabel>
                              <FormControl><Input className="h-11" {...field} /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={profileForm.control}
                          name="phone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Phone Number</FormLabel>
                              <FormControl><Input className="h-11" {...field} /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormItem>
                          <FormLabel>Email Address</FormLabel>
                          <FormControl><Input value={user?.email} disabled className="h-11 bg-slate-50" /></FormControl>
                          <FormDescription>Your login email cannot be changed.</FormDescription>
                        </FormItem>
                        <FormItem>
                          <FormLabel>Account Role</FormLabel>
                          <div className="h-11 flex items-center"><Badge className="bg-emerald-50 text-emerald-700 border-emerald-100">{user?.role?.toUpperCase()}</Badge></div>
                        </FormItem>
                      </div>
                    </form>
                  </Form>
                )}

                {activeSection === 'account-security' && (
                  <Form {...passwordForm}>
                    <form onSubmit={passwordForm.handleSubmit(handlePasswordSubmit)} className="space-y-8">
                      <div className="grid grid-cols-2 gap-8">
                        <FormField
                          control={passwordForm.control}
                          name="currentPassword"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Current Password</FormLabel>
                              <FormControl><Input type="password" placeholder="••••••••" className="h-11" {...field} /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <div className="space-y-8">
                          <FormField
                            control={passwordForm.control}
                            name="newPassword"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>New Password</FormLabel>
                                <FormControl><Input type="password" placeholder="••••••••" className="h-11" {...field} /></FormControl>
                                <FormDescription>At least 6 characters.</FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={passwordForm.control}
                            name="confirmPassword"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Confirm Password</FormLabel>
                                <FormControl><Input type="password" placeholder="••••••••" className="h-11" {...field} /></FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                    </form>
                  </Form>
                )}

                {activeSection === 'business-details' && (
                  <Form {...businessForm}>
                    <form onSubmit={businessForm.handleSubmit(handleBusinessSubmit)} className="space-y-12">
                      <div className="grid grid-cols-2 gap-12">
                        {/* Left Col */}
                        <div className="space-y-8">
                          <div className="space-y-4">
                            <Label>Business Logo</Label>
                            <div className="w-32 h-32 border-2 border-dashed rounded-xl flex flex-col items-center justify-center bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer relative group overflow-hidden" onClick={() => document.getElementById('logo-in').click()}>
                              {logoPreview ? <img src={logoPreview} className="w-full h-full object-contain p-2" alt="Logo" /> : <ImageIcon className="w-8 h-8 text-slate-300" />}
                              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><Upload className="w-6 h-6 text-white" /></div>
                            </div>
                            <input id="logo-in" type="file" className="hidden" accept="image/*" onChange={(e) => e.target.files[0] && onFileUpload('logo', e.target.files[0])} />
                          </div>
                          <FormField control={businessForm.control} name="name" render={({ field }) => (
                            <FormItem><FormLabel>Business Name *</FormLabel><FormControl><Input className="h-11" {...field} /></FormControl><FormMessage /></FormItem>
                          )} />
                          <div className="grid grid-cols-2 gap-4">
                            <FormField control={businessForm.control} name="phone" render={({ field }) => (
                              <FormItem><FormLabel>Phone</FormLabel><FormControl><Input className="h-11" {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                            <FormField control={businessForm.control} name="email" render={({ field }) => (
                              <FormItem><FormLabel>Email</FormLabel><FormControl><Input className="h-11" {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                          </div>
                          <FormField control={businessForm.control} name="address" render={({ field }) => (
                            <FormItem><FormLabel>Address</FormLabel><FormControl><Textarea className="min-h-[100px]" {...field} /></FormControl><FormMessage /></FormItem>
                          )} />
                          <div className="grid grid-cols-2 gap-4">
                            <FormField control={businessForm.control} name="state" render={({ field }) => (
                              <FormItem><FormLabel>State</FormLabel>
                                <Popover><PopoverTrigger asChild><FormControl><Button variant="outline" className="h-11 w-full justify-between font-normal">{field.value || "Select"}<Search className="w-4 h-4 opacity-50" /></Button></FormControl></PopoverTrigger>
                                <PopoverContent className="w-full p-0"><Command><CommandInput placeholder="Search..." /><CommandList><CommandEmpty>No results</CommandEmpty><CommandGroup>{states.map(s => <CommandItem key={s} onSelect={() => businessForm.setValue("state", s, { shouldDirty: true })}><Check className={cn("mr-2 h-4 w-4", s === field.value ? "opacity-100" : "opacity-0")} />{s}</CommandItem>)}</CommandGroup></CommandList></Command></PopoverContent></Popover>
                              <FormMessage /></FormItem>
                            )} />
                            <FormField control={businessForm.control} name="pincode" render={({ field }) => (
                              <FormItem><FormLabel>Pincode</FormLabel><FormControl><Input className="h-11" {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                          </div>
                        </div>
                        {/* Right Col */}
                        <div className="space-y-8">
                          <FormField control={businessForm.control} name="business_types" render={({ field }) => (
                            <FormItem><FormLabel className="block mb-3">Business Types</FormLabel><div className="flex flex-wrap gap-2">{businessTypes.map(t => <button key={t} type="button" onClick={() => { const cur = field.value || []; const next = cur.includes(t) ? cur.filter(x => x !== t) : [...cur, t]; field.onChange(next); businessForm.setValue('business_types', next, { shouldDirty: true }); }} className={cn("px-4 py-2 rounded-lg text-xs font-semibold border transition-all", field.value?.includes(t) ? "bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-100" : "bg-white border-slate-200 text-slate-600")}>{t}</button>)}</div></FormItem>
                          )} />
                          <FormField control={businessForm.control} name="industry" render={({ field }) => (
                            <FormItem><FormLabel>Industry</FormLabel>
                              <Popover><PopoverTrigger asChild><FormControl><Button variant="outline" className="h-11 w-full justify-between font-normal"><div className="flex items-center gap-2"><Briefcase className="w-4 h-4 text-slate-400" />{field.value || "Select"}</div><Search className="w-4 h-4 opacity-50" /></Button></FormControl></PopoverTrigger>
                              <PopoverContent className="w-full p-0"><Command><CommandInput placeholder="Search..." /><CommandList><CommandEmpty>No results</CommandEmpty><CommandGroup>{industries.map(i => <CommandItem key={i} onSelect={() => businessForm.setValue("industry", i, { shouldDirty: true })}><Check className={cn("mr-2 h-4 w-4", i === field.value ? "opacity-100" : "opacity-0")} />{i}</CommandItem>)}</CommandGroup></CommandList></Command></PopoverContent></Popover>
                            <FormMessage /></FormItem>
                          )} />
                          <div className="space-y-4">
                            <Label>Authorized Signature</Label>
                            <div className="h-40 border-2 border-dashed rounded-xl flex flex-col items-center justify-center bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer relative group" onClick={() => document.getElementById('sig-in').click()}>
                              {signaturePreview ? <img src={signaturePreview} className="h-full object-contain p-4" alt="Signature" /> : <div className="flex flex-col items-center gap-2"><Plus className="w-6 h-6 text-indigo-600" /><span className="text-sm font-medium text-slate-500">Add Signature</span></div>}
                              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><Upload className="w-6 h-6 text-white" /></div>
                            </div>
                            <input id="sig-in" type="file" className="hidden" accept="image/*" onChange={(e) => e.target.files[0] && onFileUpload('signature', e.target.files[0])} />
                          </div>
                          <div className="space-y-4">
                            <div className="flex justify-between"><Label>Custom Fields</Label><Button type="button" variant="ghost" size="sm" className="text-indigo-600 h-8 px-2" onClick={() => append({ label: "", value: "" })}><Plus className="w-4 h-4 mr-1" />Add</Button></div>
                            <div className="space-y-2">{fields.map((item, index) => (
                              <div key={item.id} className="flex gap-2"><Input placeholder="Label" className="h-10" {...businessForm.register(`extra_details.${index}.label`)} /><Input placeholder="Value" className="h-10" {...businessForm.register(`extra_details.${index}.value`)} /><Button variant="ghost" size="icon" className="text-rose-500" onClick={() => remove(index)}><Trash2 className="w-4 h-4" /></Button></div>
                            ))}</div>
                          </div>
                        </div>
                      </div>
                    </form>
                  </Form>
                )}

                {activeSection === 'business-tax' && (
                  <Form {...taxForm}>
                    <form onSubmit={taxForm.handleSubmit(handleTaxSubmit)} className="space-y-12">
                      <div className="grid grid-cols-2 gap-12">
                        <div className="space-y-6">
                          <FormField control={taxForm.control} name="gst_registered" render={({ field }) => (
                            <FormItem className="flex items-center justify-between p-6 bg-slate-50 rounded-xl border border-slate-200"><div className="space-y-0.5"><FormLabel className="text-base">GST Registered</FormLabel><p className="text-xs text-slate-500">Does this business have a GSTIN?</p></div><FormControl><Switch checked={field.value} onCheckedChange={(val) => handleOptimisticToggle('gst_registered', val)} /></FormControl></FormItem>
                          )} />
                          {taxForm.watch("gst_registered") && (
                            <FormField control={taxForm.control} name="gst_number" render={({ field }) => (
                              <FormItem>
                                <FormLabel>GSTIN</FormLabel>
                                <FormControl>
                                  <div className="relative">
                                    <Input 
                                      className="h-11 bg-white pr-12 uppercase" 
                                      placeholder="22AAAAA0000A1Z5"
                                      {...field} 
                                    />
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      className="absolute right-1 top-1 h-9 w-9 p-0 text-indigo-600 hover:text-indigo-700"
                                      onClick={handleGstLookup}
                                      disabled={gstLoading}
                                    >
                                      {gstLoading ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                      ) : (
                                        <Search className="h-4 w-4" />
                                      )}
                                    </Button>
                                  </div>
                                </FormControl>
                                <FormDescription>Enter 15-digit GSTIN to auto-fill business details</FormDescription>
                                <FormMessage />
                              </FormItem>
                            )} />
                          )}
                        </div>
                        <div className="space-y-8">
                          <FormField control={taxForm.control} name="pan_number" render={({ field }) => (
                            <FormItem><FormLabel>PAN Number</FormLabel><FormControl><Input className="h-11 bg-white uppercase" {...field} /></FormControl><FormMessage /></FormItem>
                          )} />
                          <div className="grid grid-cols-2 gap-4">
                            <FormField control={taxForm.control} name="enable_tds" render={({ field }) => (
                              <FormItem className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200"><FormLabel className="cursor-pointer">Enable TDS</FormLabel><FormControl><Switch checked={field.value} onCheckedChange={(val) => handleOptimisticToggle('enable_tds', val)} /></FormControl></FormItem>
                            )} />
                            <FormField control={taxForm.control} name="enable_tcs" render={({ field }) => (
                              <FormItem className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200"><FormLabel className="cursor-pointer">Enable TCS</FormLabel><FormControl><Switch checked={field.value} onCheckedChange={(val) => handleOptimisticToggle('enable_tcs', val)} /></FormControl></FormItem>
                            )} />
                          </div>
                        </div>
                      </div>
                    </form>
                  </Form>
                )}

                {activeSection === 'business-godowns' && (
                  <div className="space-y-8">
                    <div className="flex justify-between items-center">
                      <div className="space-y-1"><h3 className="text-lg font-bold text-slate-900">Godown Management</h3><p className="text-sm text-slate-500">Manage your inventory locations and warehouses.</p></div>
                      {hasFeature('multi_godowns') && (
                        <Dialog open={godownDialogOpen} onOpenChange={setGodownDialogOpen}>
                          <DialogTrigger asChild><Button className="bg-emerald-600 hover:bg-emerald-700"><Plus className="w-4 h-4 mr-2" />Add Godown</Button></DialogTrigger>
                          <DialogContent><DialogHeader><DialogTitle>Add New Godown</DialogTitle><DialogDescription>Create a new storage location.</DialogDescription></DialogHeader>
                            <form onSubmit={onAddGodown} className="space-y-4 pt-4">
                              <div className="space-y-2"><Label>Name *</Label><Input value={newGodown.name} onChange={(e) => setNewGodown({...newGodown, name: e.target.value})} required /></div>
                              <div className="space-y-2"><Label>Address</Label><Input value={newGodown.address} onChange={(e) => setNewGodown({...newGodown, address: e.target.value})} /></div>
                              <DialogFooter><Button type="submit" disabled={submitting} className="w-full bg-emerald-600">{submitting ? '...' : 'Create'}</Button></DialogFooter>
                            </form></DialogContent></Dialog>
                      )}
                    </div>
                    <div className="rounded-xl border border-slate-200 overflow-hidden"><Table><TableHeader className="bg-slate-50"><TableRow><TableHead>Name</TableHead><TableHead>Location</TableHead><TableHead>Type</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader><TableBody>{godowns.map(g => (
                      <TableRow key={g.id}><TableCell className="font-semibold">{g.name}</TableCell><TableCell className="text-xs text-slate-500">{g.address || '-'}</TableCell><TableCell>{g.is_default ? <Badge className="bg-blue-50 text-blue-700">Default</Badge> : <Badge variant="outline">Sub</Badge>}</TableCell><TableCell className="text-right">{!g.is_default && <Button variant="ghost" size="icon" onClick={() => onDeleteGodown(g.id)} className="text-rose-600"><Trash2 className="w-4 h-4" /></Button>}</TableCell></TableRow>
                    ))}</TableBody></Table></div>
                    {!hasFeature('multi_godowns') && <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-sm font-medium">Upgrade to Enterprise to add multiple godowns.</div>}
                  </div>
                )}

                {activeSection === 'team' && (
                  <div className="space-y-8">
                    <div className="flex justify-between items-center">
                      <div className="space-y-1"><h3 className="text-lg font-bold text-slate-900">Team Management</h3><p className="text-sm text-slate-500">Manage your organization's members and their roles.</p></div>
                      <Dialog open={userDialogOpen} onOpenChange={setUserDialogOpen}>
                        <DialogTrigger asChild><Button className="bg-indigo-600 hover:bg-indigo-700"><Plus className="w-4 h-4 mr-2" />Add Member</Button></DialogTrigger>
                        <DialogContent><DialogHeader><DialogTitle>Add Team Member</DialogTitle></DialogHeader>
                          <Form {...newUserForm}><form onSubmit={newUserForm.handleSubmit(onAddUser)} className="space-y-4 pt-4">
                            <FormField control={newUserForm.control} name="name" render={({ field }) => (<FormItem><FormLabel>Full Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                            <FormField control={newUserForm.control} name="email" render={({ field }) => (<FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" {...field} /></FormControl><FormMessage /></FormItem>)} />
                            <FormField control={newUserForm.control} name="password" render={({ field }) => (<FormItem><FormLabel>Password</FormLabel><FormControl><Input type="password" {...field} /></FormControl><FormMessage /></FormItem>)} />
                            <FormField control={newUserForm.control} name="role" render={({ field }) => (<FormItem><FormLabel>Role</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="admin">Admin</SelectItem><SelectItem value="staff">Staff</SelectItem></SelectContent></Select></FormItem>)} />
                            <DialogFooter><Button type="submit" disabled={submitting} className="w-full bg-indigo-600">{submitting ? '...' : 'Create'}</Button></DialogFooter>
                          </form></Form></DialogContent></Dialog>
                    </div>
                    <div className="rounded-xl border border-slate-200 overflow-hidden"><Table><TableHeader className="bg-slate-50"><TableRow><TableHead>Member</TableHead><TableHead>Role</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader><TableBody>{users.map(u => (
                      <TableRow key={u.id}><TableCell><div><div className="font-semibold">{u.name}</div><div className="text-xs text-slate-500">{u.email}</div></div></TableCell><TableCell><Badge variant="outline" className="capitalize">{u.role}</Badge></TableCell><TableCell className="text-right">{u.role !== 'owner' && u.id !== user?.id && <Button variant="ghost" size="icon" onClick={() => handleDeleteUser(u.id)} className="text-rose-600"><Trash2 className="w-4 h-4" /></Button>}</TableCell></TableRow>
                    ))}</TableBody></Table></div>
                  </div>
                )}

                {activeSection === 'invoice-customization' && (
                  <Form {...invoiceCustomForm}>
                    <form onSubmit={invoiceCustomForm.handleSubmit(handleInvoiceCustomSubmit)} className="space-y-10">
                      <div className="space-y-2">
                        <div className="flex items-center gap-3"><Palette className="w-6 h-6 text-indigo-600" /><h3 className="text-xl font-bold">Invoice Customization</h3></div>
                        <p className="text-sm text-slate-500">Configure how your invoices look and what information they show.</p>
                      </div>

                      <div className="grid grid-cols-2 gap-12">
                        <div className="space-y-8">
                          <FormField
                            control={invoiceCustomForm.control}
                            name="businessType"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Business Category</FormLabel>
                                <Select onValueChange={(val) => {
                                  field.onChange(val);
                                  const config = BUSINESS_CONFIGS[val];
                                  if (config) {
                                    invoiceCustomForm.setValue('columnLabels', config.labels, { shouldDirty: true });
                                    invoiceCustomForm.setValue('columnToggles', config.toggles, { shouldDirty: true });
                                  }
                                }} value={field.value}>
                                  <FormControl><SelectTrigger><SelectValue placeholder="Select business type" /></SelectTrigger></FormControl>
                                  <SelectContent>
                                    <SelectItem value="generic">Generic / General</SelectItem>
                                    <SelectItem value="distribution">Distribution</SelectItem>
                                    <SelectItem value="retail">Retail</SelectItem>
                                    <SelectItem value="automobile">Automobile</SelectItem>
                                    <SelectItem value="group5_service">Services / Consulting</SelectItem>
                                    <SelectItem value="group6_mfg_construction">Manufacturing / Construction</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormDescription>Selecting a category will apply standard industry labels.</FormDescription>
                              </FormItem>
                            )}
                          />

                          <div className="space-y-4">
                            <Label className="text-base">Column Labels & Toggles</Label>
                            <p className="text-xs text-slate-500 mb-4">Rename or hide columns in your invoice item table.</p>
                            
                            <div className="space-y-4 border rounded-xl p-6 bg-slate-50/50">
                              {[1, 2, 3, 4, 5, 6].map((num) => (
                                <div key={num} className="flex items-center gap-4">
                                  <div className="flex-1">
                                    <FormField
                                      control={invoiceCustomForm.control}
                                      name={`columnLabels.f${num}`}
                                      render={({ field }) => (
                                        <FormItem className="space-y-1">
                                          <FormLabel className="text-[10px] uppercase text-slate-400">Column {num} Label</FormLabel>
                                          <FormControl><Input className="h-9" {...field} /></FormControl>
                                        </FormItem>
                                      )}
                                    />
                                  </div>
                                  <FormField
                                    control={invoiceCustomForm.control}
                                    name={`columnToggles.showF${num}`}
                                    render={({ field }) => (
                                      <FormItem className="flex flex-col items-center justify-center pt-5">
                                        <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                                      </FormItem>
                                    )}
                                  />
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>

                        <div className="space-y-8">
                          <div className="space-y-4">
                            <Label className="text-base">Style & Appearance</Label>
                            
                            <div className="grid grid-cols-2 gap-6">
                              <FormField
                                control={invoiceCustomForm.control}
                                name="headerColor"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Header Color</FormLabel>
                                    <div className="flex gap-2">
                                      <FormControl><Input type="color" className="w-12 h-10 p-1" {...field} /></FormControl>
                                      <Input className="h-10 font-mono text-xs uppercase" {...field} />
                                    </div>
                                  </FormItem>
                                )}
                              />

                              <FormField
                                control={invoiceCustomForm.control}
                                name="textSize"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Text Size</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                      <SelectContent>
                                        <SelectItem value="9pt">Small (9pt)</SelectItem>
                                        <SelectItem value="10pt">Medium (10pt)</SelectItem>
                                        <SelectItem value="11pt">Large (11pt)</SelectItem>
                                        <SelectItem value="12pt">Extra Large (12pt)</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </FormItem>
                                )}
                              />
                            </div>
                          </div>

                          <div className="p-6 bg-emerald-50 rounded-2xl border border-emerald-100 space-y-4">
                            <div className="flex items-center gap-2 text-emerald-700 font-bold"><CheckCircle2 className="w-5 h-5" /> Live Preview Enabled</div>
                            <p className="text-sm text-emerald-600/80 leading-relaxed">Changes saved here will be applied to all new and existing invoices immediately when generating PDFs.</p>
                          </div>
                        </div>
                      </div>
                    </form>
                  </Form>
                )}

                {activeSection === 'payments' && (
                  <Form {...bankForm}>
                    <form onSubmit={bankForm.handleSubmit(handleBankSubmit)} className="space-y-12">
                      <div className="grid grid-cols-2 gap-12">
                        <div className="space-y-8">
                          <div className="space-y-1">
                            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2"><Banknote className="w-5 h-5 text-indigo-600" /> Bank Account Details</h3>
                            <p className="text-sm text-slate-500">These details will appear on your invoices for customer payments.</p>
                          </div>
                          
                          <div className="space-y-6">
                            <FormField control={bankForm.control} name="bank_name" render={({ field }) => (
                              <FormItem><FormLabel>Bank Name</FormLabel><FormControl><Input className="h-11" placeholder="e.g. HDFC Bank" {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                            <FormField control={bankForm.control} name="account_number" render={({ field }) => (
                              <FormItem><FormLabel>Account Number</FormLabel><FormControl><Input className="h-11" placeholder="Enter account number" {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                            <div className="grid grid-cols-2 gap-4">
                              <FormField control={bankForm.control} name="ifsc_code" render={({ field }) => (
                                <FormItem><FormLabel>IFSC Code</FormLabel><FormControl><Input className="h-11 uppercase" placeholder="HDFC0001234" {...field} /></FormControl><FormMessage /></FormItem>
                              )} />
                              <FormField control={bankForm.control} name="branch_name" render={({ field }) => (
                                <FormItem><FormLabel>Branch Name</FormLabel><FormControl><Input className="h-11" placeholder="Branch location" {...field} /></FormControl><FormMessage /></FormItem>
                              )} />
                            </div>
                          </div>
                        </div>

                        <div className="space-y-8">
                          <div className="space-y-1">
                            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2"><QrCode className="w-5 h-5 text-indigo-600" /> Payment QR Code</h3>
                            <p className="text-sm text-slate-500">Upload your UPI QR code to accept instant payments.</p>
                          </div>

                          <div 
                            className="aspect-square w-48 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer relative group overflow-hidden mx-auto" 
                            onClick={() => document.getElementById('qr-in').click()}
                          >
                            {qrPreview ? (
                              <img src={qrPreview} className="w-full h-full object-contain p-4" alt="UPI QR" />
                            ) : (
                              <div className="flex flex-col items-center gap-2 text-slate-400">
                                <QrCode className="w-10 h-10 opacity-20" />
                                <span className="text-[10px] font-black uppercase tracking-widest">Upload QR Code</span>
                              </div>
                            )}
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><Upload className="w-6 h-6 text-white" /></div>
                          </div>
                          <input id="qr-in" type="file" className="hidden" accept="image/*" onChange={(e) => e.target.files[0] && onFileUpload('qr_code', e.target.files[0])} />

                          <FormField control={bankForm.control} name="terms_conditions" render={({ field }) => (
                            <FormItem><FormLabel>Terms & Conditions (Footer)</FormLabel><FormControl><Textarea className="min-h-[120px] resize-none" placeholder="e.g. 1. Goods once sold will not be taken back..." {...field} /></FormControl><FormDescription>This text appears at the bottom of every invoice.</FormDescription><FormMessage /></FormItem>
                          )} />
                        </div>
                      </div>
                    </form>
                  </Form>
                )}

                {['invoice-print'].includes(activeSection) && (
                  <div className="flex flex-col items-center justify-center h-[400px] text-slate-400 space-y-4">
                    <Settings className="w-12 h-12 opacity-20" />
                    <p className="text-lg font-medium">Settings for {activeSection.replace('-', ' ')} coming soon.</p>
                  </div>
                )}

              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
