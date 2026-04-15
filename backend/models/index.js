const sequelize = require('../config/database');
const { DataTypes } = require('sequelize');

/* =========================================
   CORE MODELS
========================================= */

const Plan = sequelize.define('Plan', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  plan_name: { type: DataTypes.STRING, allowNull: false },
  price: { type: DataTypes.DECIMAL(10,2), defaultValue: 0 },
  billing_cycle: { type: DataTypes.ENUM('monthly','3month','6month','yearly','lifetime'), defaultValue: 'monthly' },
  max_users: { type: DataTypes.INTEGER, defaultValue: 1 },
  max_invoices_per_month: { type: DataTypes.INTEGER, defaultValue: 100 },
  max_products: { type: DataTypes.INTEGER, defaultValue: 100 },
  storage_limit: { type: DataTypes.INTEGER, defaultValue: 100 },
  features: { type: DataTypes.JSON, defaultValue: {} },
  is_active: { type: DataTypes.BOOLEAN, defaultValue: true }
}, { tableName: 'plans' });

const PlanFeature = sequelize.define('PlanFeature', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  plan_name: { type: DataTypes.STRING, allowNull: false }, // Link to Plan.plan_name
  feature_key: { type: DataTypes.STRING, allowNull: false },
  is_enabled: { type: DataTypes.BOOLEAN, defaultValue: false }
}, { 
  tableName: 'plan_features',
  indexes: [
    { unique: true, fields: ['plan_name', 'feature_key'] }
  ]
});

const Company = sequelize.define('Company',{
  id:{ type:DataTypes.UUID, defaultValue:DataTypes.UUIDV4, primaryKey:true },
  name:{ type:DataTypes.STRING, allowNull:false },
  gst_number:{ type:DataTypes.STRING },
  address:{ type:DataTypes.TEXT },
  city:{ type:DataTypes.STRING },
  state:{ type:DataTypes.STRING },
  pincode:{ type:DataTypes.STRING },
  phone:{ type:DataTypes.STRING },
  email:{ type:DataTypes.STRING },
  logo:{ type:DataTypes.STRING },
  signature:{ type:DataTypes.STRING },
  tagline:{ type:DataTypes.STRING },
  business_category:{ type:DataTypes.STRING, defaultValue:'General Store' },
  invoice_prefix:{ type:DataTypes.STRING, defaultValue:'INV' },
  currency:{ type:DataTypes.STRING, defaultValue:'INR' },
  financial_year_start:{ type:DataTypes.INTEGER, defaultValue:4 },
  bank_name: { type: DataTypes.STRING },
  account_number: { type: DataTypes.STRING },
  ifsc_code: { type: DataTypes.STRING },
  branch_name: { type: DataTypes.STRING },
  qr_code: { type: DataTypes.STRING },
  terms_conditions: { type: DataTypes.TEXT },
  gst_registered: { type: DataTypes.BOOLEAN, defaultValue: false },
  enable_tds: { type: DataTypes.BOOLEAN, defaultValue: false },
  enable_tcs: { type: DataTypes.BOOLEAN, defaultValue: false },
  settings:{ type:DataTypes.JSON, defaultValue:{ invoice_template: 'modern' } },
  // Invoice Customization Fields
  invoice_business_category: { 
    type: DataTypes.ENUM('generic', 'distribution', 'retail', 'automobile', 'group5_service', 'group6_mfg_construction'), 
    defaultValue: 'generic' 
  },
  invoice_column_labels: { type: DataTypes.JSONB, defaultValue: {} },
  invoice_column_toggles: { type: DataTypes.JSONB, defaultValue: {} },
  invoice_header_color: { type: DataTypes.TEXT, defaultValue: '#1D70B8' },
  invoice_menu_color: { type: DataTypes.TEXT, defaultValue: '#FFFFFF' },
  invoice_text_size: { 
    type: DataTypes.ENUM('9pt', '10pt', '11pt', '12pt'), 
    defaultValue: '10pt' 
  }
}, { tableName: 'companies' });

const Affiliate = sequelize.define('Affiliate', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  company_name: { type: DataTypes.STRING, allowNull: false },
  contact_person: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, allowNull: false },
  mobile_no: { type: DataTypes.STRING, allowNull: false },
  status: { type: DataTypes.ENUM('active', 'inactive'), defaultValue: 'active' }
}, { tableName: 'Affiliates' });

const User = sequelize.define('User',{
  id:{ type:DataTypes.UUID, defaultValue:DataTypes.UUIDV4, primaryKey:true },
  company_id: { type: DataTypes.UUID, allowNull: true },
  email:{ type:DataTypes.STRING, allowNull:false, unique:true },
  password:{ type:DataTypes.STRING, allowNull:true }, // Temporarily nullable for migration
  name:{ type:DataTypes.STRING, allowNull:false },
  phone:{ type:DataTypes.STRING },
  role:{ type:DataTypes.ENUM('owner','admin','staff'), defaultValue:'staff' },
  permissions:{ type:DataTypes.JSON, defaultValue:{} },
  is_active:{ type:DataTypes.BOOLEAN, defaultValue:true },
  email_verified:{ type:DataTypes.BOOLEAN, defaultValue:false },
  last_login:{ type:DataTypes.DATE }
}, { tableName: 'users' });

const Coupon = sequelize.define('Coupon', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  code: { type: DataTypes.STRING, allowNull: false, unique: true },
  discount_type: { type: DataTypes.ENUM('percentage', 'flat'), defaultValue: 'percentage' },
  discount_value: { type: DataTypes.DECIMAL(10,2), defaultValue: 0 },
  expiry_date: { type: DataTypes.DATE },
  usage_limit: { type: DataTypes.INTEGER, defaultValue: 100 },
  usage_count: { type: DataTypes.INTEGER, defaultValue: 0 },
  affiliate_id: { type: DataTypes.UUID, allowNull: true }, // Linked to partner
  is_active: { type: DataTypes.BOOLEAN, defaultValue: true }
}, { tableName: 'coupons' });

const Subscription = sequelize.define('Subscription',{
  id:{ type:DataTypes.UUID, defaultValue:DataTypes.UUIDV4, primaryKey:true },
  company_id: { type: DataTypes.UUID, allowNull: false },
  plan_id:{ type:DataTypes.UUID },
  coupon_id: { type: DataTypes.UUID, allowNull: true },
  price: { type: DataTypes.DECIMAL(10,2), defaultValue: 0 },
  start_date:{ type:DataTypes.DATE, defaultValue:DataTypes.NOW },
  expiry_date:{ type:DataTypes.DATE },
  status:{ type:DataTypes.ENUM('active','expired','cancelled','trial'), defaultValue:'trial' },
  payment_status:{ type:DataTypes.ENUM('paid','pending','failed'), defaultValue:'pending' },
  usage:{ type:DataTypes.JSONB, defaultValue:{ invoices: 0, eway_bills: 0, godowns: 0, products: 0 } }
}, { tableName: 'subscriptions' });

const Customer = sequelize.define('Customer',{
  id:{ type:DataTypes.UUID, defaultValue:DataTypes.UUIDV4, primaryKey:true },
  company_id: { type: DataTypes.UUID, allowNull: false },
  name:{ type:DataTypes.STRING, allowNull:false },
  phone:{ type:DataTypes.STRING },
  email:{ type:DataTypes.STRING },
  gst_number:{ type:DataTypes.STRING },
  address:{ type:DataTypes.TEXT },
  city:{ type:DataTypes.STRING },
  state:{ type:DataTypes.STRING },
  pincode:{ type:DataTypes.STRING },
  outstanding_balance:{ type:DataTypes.DECIMAL(12,2), defaultValue:0 },
  wallet_balance:{ type:DataTypes.DECIMAL(12,2), defaultValue:0 }
}, { tableName: 'customers' });

const CreditNote = sequelize.define('CreditNote', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  company_id: { type: DataTypes.UUID, allowNull: false },
  customer_id: { type: DataTypes.UUID, allowNull: false },
  invoice_id: { type: DataTypes.UUID, allowNull: false },
  credit_note_number: { type: DataTypes.STRING, allowNull: false },
  date: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  reason: { type: DataTypes.STRING },
  subtotal: { type: DataTypes.DECIMAL(12,2), defaultValue: 0 },
  tax_amount: { type: DataTypes.DECIMAL(12,2), defaultValue: 0 },
  total_amount: { type: DataTypes.DECIMAL(12,2), defaultValue: 0 },
  industry_metadata: { type: DataTypes.JSONB, defaultValue: {} }
}, { tableName: 'creditnotes' });

const CreditNoteItem = sequelize.define('CreditNoteItem', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  credit_note_id: { type: DataTypes.UUID, allowNull: false },
  product_id: { type: DataTypes.UUID, allowNull: false },
  quantity: { type: DataTypes.DECIMAL(12,2), allowNull: false },
  unit_price: { type: DataTypes.DECIMAL(12,2), allowNull: false },
  tax_rate: { type: DataTypes.DECIMAL(5,2), defaultValue: 0 },
  tax_amount: { type: DataTypes.DECIMAL(12,2), defaultValue: 0 },
  total: { type: DataTypes.DECIMAL(12,2), allowNull: false }
}, { tableName: 'creditnoteitems' });

const Supplier = sequelize.define('Supplier',{
  id:{ type:DataTypes.UUID, defaultValue:DataTypes.UUIDV4, primaryKey:true },
  company_id: { type: DataTypes.UUID, allowNull: false },
  name:{ type:DataTypes.STRING, allowNull:false },
  phone:{ type:DataTypes.STRING },
  email:{ type:DataTypes.STRING },
  gst_number:{ type:DataTypes.STRING },
  address:{ type:DataTypes.TEXT },
  city:{ type:DataTypes.STRING },
  state:{ type:DataTypes.STRING },
  pincode:{ type:DataTypes.STRING },
  outstanding_balance:{ type:DataTypes.DECIMAL(12,2), defaultValue:0 }
}, { tableName: 'suppliers' });

const Category = sequelize.define('Category',{
  id:{ type:DataTypes.UUID, defaultValue:DataTypes.UUIDV4, primaryKey:true },
  company_id: { type: DataTypes.UUID, allowNull: false },
  name:{ type:DataTypes.STRING, allowNull:false },
  description:{ type:DataTypes.TEXT }
}, { tableName: 'categories' });

const Product = sequelize.define('Product',{
  id:{ type:DataTypes.UUID, defaultValue:DataTypes.UUIDV4, primaryKey:true },
  company_id: { type: DataTypes.UUID, allowNull: false },
  category_id: { type: DataTypes.UUID },
  name:{ type:DataTypes.STRING, allowNull:false },
  sku:{ type:DataTypes.STRING },
  hsn_code:{ type:DataTypes.STRING },
  type:{ type:DataTypes.STRING, defaultValue:'product' },
  unit:{ type:DataTypes.STRING, defaultValue:'pcs' },
  gst_rate:{ type:DataTypes.DECIMAL(5,2), defaultValue:18 },
  purchase_price:{ type:DataTypes.DECIMAL(12,2), defaultValue:0 },
  sale_price:{ type:DataTypes.DECIMAL(12,2), defaultValue:0 },
  new_price: { type: DataTypes.DECIMAL(12,2), allowNull: true },
  stock_quantity:{ type:DataTypes.DECIMAL(12,2), defaultValue:0 },
  low_stock_alert:{ type:DataTypes.DECIMAL(12,2), defaultValue:10 },
  barcode:{ type:DataTypes.STRING },
  description:{ type:DataTypes.TEXT }
}, { tableName: 'products' });

const Invoice = sequelize.define('Invoice',{
  id:{ type:DataTypes.UUID, defaultValue:DataTypes.UUIDV4, primaryKey:true },
  company_id: { type: DataTypes.UUID, allowNull: false },
  customer_id: { type: DataTypes.UUID, allowNull: false },
  godown_id: { type: DataTypes.UUID },
  invoice_number:{ type:DataTypes.STRING, allowNull:false, unique:true },
  invoice_date:{ type:DataTypes.DATE, defaultValue:DataTypes.NOW },
  due_date:{ type:DataTypes.DATE },
  subtotal:{ type:DataTypes.DECIMAL(12,2), defaultValue:0 },
  tax_amount:{ type:DataTypes.DECIMAL(12,2), defaultValue:0 },
  discount_type:{ type:DataTypes.ENUM('fixed','percentage'), defaultValue:'fixed' },
  discount_amount:{ type:DataTypes.DECIMAL(12,2), defaultValue:0 },
  tds_rate: { type: DataTypes.DECIMAL(5,2), defaultValue: 0 },
  tds_amount: { type: DataTypes.DECIMAL(12,2), defaultValue: 0 },
  tcs_rate: { type: DataTypes.DECIMAL(5,2), defaultValue: 0 },
  tcs_amount: { type: DataTypes.DECIMAL(12,2), defaultValue: 0 },
  round_off:{ type:DataTypes.DECIMAL(12,2), defaultValue:0 },
  total_amount:{ type:DataTypes.DECIMAL(12,2), defaultValue:0 },
  final_amount: { type: DataTypes.DECIMAL(12,2), defaultValue: 0 },
  paid_amount:{ type:DataTypes.DECIMAL(12,2), defaultValue:0 },
  payment_status:{ type:DataTypes.ENUM('paid','partial','unpaid'), defaultValue:'unpaid' },
  payment_method:{ type:DataTypes.STRING },
  notes:{ type:DataTypes.TEXT },
  terms:{ type:DataTypes.TEXT },
  status:{ type:DataTypes.ENUM('draft','sent','cancelled'), defaultValue:'draft' },
  extra_fields:{ type:DataTypes.JSON, defaultValue:{} },
  industry_metadata:{ type:DataTypes.JSONB, defaultValue:{} },
  eway_bill_number:{ type:DataTypes.STRING },
  wallet_amount:{ type:DataTypes.DECIMAL(12,2), defaultValue:0 }
}, { tableName: 'invoices' });

const TaxSetting = sequelize.define('TaxSetting', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  company_id: { type: DataTypes.UUID, allowNull: false },
  name: { type: DataTypes.STRING, allowNull: false },
  type: { type: DataTypes.ENUM('tds', 'tcs'), allowNull: false },
  section: { type: DataTypes.STRING },
  rate: { type: DataTypes.DECIMAL(5,2), allowNull: false },
  is_active: { type: DataTypes.BOOLEAN, defaultValue: true }
}, { tableName: 'tax_settings' });

const InvoiceItem = sequelize.define('InvoiceItem',{
  id:{ type:DataTypes.UUID, defaultValue:DataTypes.UUIDV4, primaryKey:true },
  invoice_id: { type: DataTypes.UUID, allowNull: false },
  product_id: { type: DataTypes.UUID, allowNull: false },
  quantity:{ type:DataTypes.DECIMAL(12,2), allowNull:false },
  unit_price:{ type:DataTypes.DECIMAL(12,2), allowNull:false },
  discount: { type: DataTypes.DECIMAL(12,2), defaultValue: 0 },
  tax_rate: { type: DataTypes.DECIMAL(5,2), defaultValue: 0 },
  tax_amount: { type: DataTypes.DECIMAL(12,2), defaultValue: 0 },
  total:{ type:DataTypes.DECIMAL(12,2), allowNull:false },
  description:{ type:DataTypes.TEXT }
}, { tableName: 'invoice_items' });

const Purchase = sequelize.define('Purchase',{
  id:{ type:DataTypes.UUID, defaultValue:DataTypes.UUIDV4, primaryKey:true },
  company_id: { type: DataTypes.UUID, allowNull: false },
  supplier_id: { type: DataTypes.UUID, allowNull: false },
  godown_id: { type: DataTypes.UUID },
  bill_number:{ type:DataTypes.STRING, allowNull:false },
  bill_date:{ type:DataTypes.DATE, defaultValue:DataTypes.NOW },
  due_date:{ type:DataTypes.DATE },
  subtotal:{ type:DataTypes.DECIMAL(12,2), defaultValue:0 },
  tax_amount:{ type:DataTypes.DECIMAL(12,2), defaultValue:0 },
  discount_amount:{ type:DataTypes.DECIMAL(12,2), defaultValue:0 },
  total_amount:{ type:DataTypes.DECIMAL(12,2), defaultValue:0 },
  paid_amount:{ type:DataTypes.DECIMAL(12,2), defaultValue:0 },
  payment_status:{ type:DataTypes.ENUM('paid','partial','unpaid'), defaultValue:'unpaid' },
  status:{ type:DataTypes.ENUM('received', 'ordered', 'pending', 'cancelled'), defaultValue:'received' },
  notes:{ type:DataTypes.TEXT }
}, { tableName: 'purchases' });

const PurchaseItem = sequelize.define('PurchaseItem',{
  id:{ type:DataTypes.UUID, defaultValue:DataTypes.UUIDV4, primaryKey:true },
  purchase_id: { type: DataTypes.UUID, allowNull: false },
  product_id: { type: DataTypes.UUID, allowNull: false },
  quantity:{ type:DataTypes.DECIMAL(12,2), allowNull:false },
  unit_price:{ type:DataTypes.DECIMAL(12,2), allowNull:false },
  tax_rate:{ type:DataTypes.DECIMAL(5,2), defaultValue:0 },
  tax_amount:{ type:DataTypes.DECIMAL(12,2), defaultValue:0 },
  total:{ type:DataTypes.DECIMAL(12,2), allowNull:false }
}, { tableName: 'purchase_items' });

const PurchaseOrder = sequelize.define('PurchaseOrder',{
  id:{ type:DataTypes.UUID, defaultValue:DataTypes.UUIDV4, primaryKey:true },
  company_id: { type: DataTypes.UUID, allowNull: false },
  supplier_id: { type: DataTypes.UUID, allowNull: false },
  po_number:{ type:DataTypes.STRING, allowNull:false },
  po_date:{ type:DataTypes.DATE, defaultValue:DataTypes.NOW },
  expected_date:{ type:DataTypes.DATE },
  subtotal:{ type:DataTypes.DECIMAL(12,2), defaultValue:0 },
  tax_amount:{ type:DataTypes.DECIMAL(12,2), defaultValue:0 },
  total_amount:{ type:DataTypes.DECIMAL(12,2), defaultValue:0 },
  status:{ type:DataTypes.ENUM('draft', 'sent', 'received', 'cancelled'), defaultValue:'draft' },
  notes:{ type:DataTypes.TEXT }
}, { tableName: 'purchase_orders' });

const PurchaseOrderItem = sequelize.define('PurchaseOrderItem',{
  id:{ type:DataTypes.UUID, defaultValue:DataTypes.UUIDV4, primaryKey:true },
  purchase_order_id: { type: DataTypes.UUID, allowNull: false },
  product_id: { type: DataTypes.UUID, allowNull: false },
  quantity:{ type:DataTypes.DECIMAL(12,2), allowNull:false },
  unit_price:{ type:DataTypes.DECIMAL(12,2), allowNull:false },
  tax_rate:{ type:DataTypes.DECIMAL(5,2), defaultValue:0 },
  tax_amount:{ type:DataTypes.DECIMAL(12,2), defaultValue:0 },
  total:{ type:DataTypes.DECIMAL(12,2), allowNull:false }
}, { tableName: 'purchase_order_items' });

const Quotation = sequelize.define('Quotation',{
  id:{ type:DataTypes.UUID, defaultValue:DataTypes.UUIDV4, primaryKey:true },
  company_id: { type: DataTypes.UUID, allowNull: false },
  customer_id: { type: DataTypes.UUID, allowNull: false },
  godown_id: { type: DataTypes.UUID },
  quotation_number:{ type:DataTypes.STRING, allowNull:false },
  quotation_date:{ type:DataTypes.DATE, defaultValue:DataTypes.NOW },
  valid_until:{ type:DataTypes.DATE },
  subtotal:{ type:DataTypes.DECIMAL(12,2), defaultValue:0 },
  tax_amount:{ type:DataTypes.DECIMAL(12,2), defaultValue:0 },
  discount_amount:{ type:DataTypes.DECIMAL(12,2), defaultValue:0 },
  total_amount:{ type:DataTypes.DECIMAL(12,2), defaultValue:0 },
  status:{ type:DataTypes.ENUM('draft','sent','accepted','rejected','expired'), defaultValue:'draft' },
  notes:{ type:DataTypes.TEXT },
  terms:{ type:DataTypes.TEXT },
  industry_metadata:{ type:DataTypes.JSONB, defaultValue:{} }
}, { tableName: 'quotations' });

const QuotationItem = sequelize.define('QuotationItem',{
  id:{ type:DataTypes.UUID, defaultValue:DataTypes.UUIDV4, primaryKey:true },
  quotation_id: { type: DataTypes.UUID, allowNull: false },
  product_id: { type: DataTypes.UUID, allowNull: false },
  quantity:{ type:DataTypes.DECIMAL(12,2), allowNull:false },
  unit_price:{ type:DataTypes.DECIMAL(12,2), allowNull:false },
  tax_rate:{ type:DataTypes.DECIMAL(5,2), defaultValue:0 },
  tax_amount:{ type:DataTypes.DECIMAL(12,2), defaultValue:0 },
  total:{ type:DataTypes.DECIMAL(12,2), allowNull:false },
  description:{ type:DataTypes.TEXT }
}, { tableName: 'quotationitems' });

const EWayBill = sequelize.define('EWayBill', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  company_id: { type: DataTypes.UUID, allowNull: false },
  invoice_id: { type: DataTypes.UUID },
  eway_bill_number: { type: DataTypes.STRING, allowNull: false, unique: true },
  generated_date: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  valid_until: { type: DataTypes.DATE },
  transporter_name: { type: DataTypes.STRING },
  transporter_id: { type: DataTypes.STRING },
  vehicle_number: { type: DataTypes.STRING },
  from_place: { type: DataTypes.STRING },
  to_place: { type: DataTypes.STRING },
  distance: { type: DataTypes.INTEGER },
  status: { type: DataTypes.ENUM('active', 'cancelled', 'expired'), defaultValue: 'active' },
  details: { type: DataTypes.JSON }
}, { tableName: 'ewaybills' });

const Expense = sequelize.define('Expense',{
  id:{ type:DataTypes.UUID, defaultValue:DataTypes.UUIDV4, primaryKey:true },
  company_id: { type: DataTypes.UUID, allowNull: false },
  date: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  category: { type: DataTypes.STRING, allowNull: false },
  amount: { type: DataTypes.DECIMAL(12,2), defaultValue: 0 },
  payment_method: { type: DataTypes.STRING },
  notes: { type: DataTypes.TEXT },
  reference_number: { type: DataTypes.STRING }
}, { tableName: 'expenses' });

const InvoiceCounter = sequelize.define('InvoiceCounter',{
  id:{ type:DataTypes.UUID, defaultValue:DataTypes.UUIDV4, primaryKey:true },
  company_id:{ type:DataTypes.UUID, allowNull:false },
  last_number:{ type:DataTypes.INTEGER, defaultValue:0 }
}, { tableName: 'invoicecounters' });

const QuotationCounter = sequelize.define('QuotationCounter',{
  id:{ type:DataTypes.UUID, defaultValue:DataTypes.UUIDV4, primaryKey:true },
  company_id:{ type:DataTypes.UUID, allowNull:false },
  last_number:{ type:DataTypes.INTEGER, defaultValue:0 }
}, { tableName: 'quotationcounters' });

const UserCompany = sequelize.define('UserCompany', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  user_id: { type: DataTypes.UUID, allowNull: false },
  company_id: { type: DataTypes.UUID, allowNull: false },
  role: { type: DataTypes.ENUM('owner', 'admin', 'staff'), defaultValue: 'staff' }
}, { tableName: 'usercompanies' });

const Payment = sequelize.define('Payment', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  company_id: { type: DataTypes.UUID, allowNull: false },
  customer_id: { type: DataTypes.UUID },
  supplier_id: { type: DataTypes.UUID },
  invoice_id: { type: DataTypes.UUID },
  purchase_id: { type: DataTypes.UUID },
  payment_type: { type: DataTypes.ENUM('received', 'made'), allowNull: false },
  amount: { type: DataTypes.DECIMAL(12,2), allowNull: false },
  payment_method: { type: DataTypes.STRING },
  payment_date: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  reference_number: { type: DataTypes.STRING },
  notes: { type: DataTypes.TEXT }
}, { tableName: 'payments' });

const StockMovement = sequelize.define('StockMovement', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  company_id: { type: DataTypes.UUID, allowNull: false },
  product_id: { type: DataTypes.UUID, allowNull: false },
  godown_id: { type: DataTypes.UUID },
  type: { type: DataTypes.ENUM('in', 'out', 'adjustment', 'transfer'), allowNull: false },
  quantity: { type: DataTypes.DECIMAL(12,2), allowNull: false },
  previous_stock: { type: DataTypes.DECIMAL(12,2), defaultValue: 0 },
  new_stock: { type: DataTypes.DECIMAL(12,2), defaultValue: 0 },
  reference_type: { type: DataTypes.STRING },
  reference_id: { type: DataTypes.UUID },
  notes: { type: DataTypes.TEXT }
}, { tableName: 'stockmovements' });

const Godown = sequelize.define('Godown', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  company_id: { type: DataTypes.UUID, allowNull: false },
  name: { type: DataTypes.STRING, allowNull: false },
  address: { type: DataTypes.TEXT },
  is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
  is_default: { type: DataTypes.BOOLEAN, defaultValue: false }
}, { tableName: 'godowns' });

const StockLevel = sequelize.define('StockLevel', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  company_id: { type: DataTypes.UUID, allowNull: false },
  product_id: { type: DataTypes.UUID, allowNull: false },
  godown_id: { type: DataTypes.UUID, allowNull: false },
  quantity: { type: DataTypes.DECIMAL(12,2), defaultValue: 0 }
}, { tableName: 'stocklevels', indexes: [{ unique: true, fields: ['product_id', 'godown_id'] }] });

const Staff = sequelize.define('Staff', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  company_id: { type: DataTypes.UUID, allowNull: false },
  name: { type: DataTypes.STRING, allowNull: false },
  phone: { type: DataTypes.STRING },
  role: { type: DataTypes.STRING },
  salary: { type: DataTypes.DECIMAL(12,2), defaultValue: 0 },
  is_active: { type: DataTypes.BOOLEAN, defaultValue: true }
}, { tableName: 'staff' });

const StaffAttendance = sequelize.define('StaffAttendance', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  staff_id: { type: DataTypes.UUID, allowNull: false },
  date: { type: DataTypes.DATEONLY, defaultValue: DataTypes.NOW },
  status: { type: DataTypes.ENUM('present', 'absent', 'late', 'half-day'), defaultValue: 'present' },
  notes: { type: DataTypes.TEXT }
}, { tableName: 'staffattendance' });

const Enquiry = sequelize.define('Enquiry', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  name: { type: DataTypes.STRING, allowNull: false },
  phone: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING },
  business_type: { type: DataTypes.STRING },
  message: { type: DataTypes.TEXT },
  status: { type: DataTypes.ENUM('pending', 'contacted', 'closed'), defaultValue: 'pending' }
}, { tableName: 'enquiries' });

const GstCache = sequelize.define('GstCache', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  gstin: { type: DataTypes.STRING, unique: true, allowNull: false },
  data: { type: DataTypes.JSONB, allowNull: false },
  expires_at: { type: DataTypes.DATE, allowNull: false }
}, { tableName: 'gst_cache' });

/* =========================================
   RELATIONSHIPS
========================================= */

Company.hasMany(User,{foreignKey:'company_id'});
User.belongsTo(Company,{foreignKey:'company_id'});

Company.hasOne(Subscription,{foreignKey:'company_id'});
Subscription.belongsTo(Company,{foreignKey:'company_id'});

Plan.hasMany(Subscription,{foreignKey:'plan_id'});
Subscription.belongsTo(Plan,{foreignKey:'plan_id'});

Coupon.hasMany(Subscription, { foreignKey: 'coupon_id' });
Subscription.belongsTo(Coupon, { foreignKey: 'coupon_id' });

Affiliate.hasMany(Coupon, { foreignKey: 'affiliate_id', constraints: false });
Coupon.belongsTo(Affiliate, { foreignKey: 'affiliate_id', constraints: false });

Company.hasMany(Customer,{foreignKey:'company_id'});
Customer.belongsTo(Company,{foreignKey:'company_id'});

Company.hasMany(Supplier,{foreignKey:'company_id'});
Supplier.belongsTo(Company,{foreignKey:'company_id'});

Company.hasMany(Category,{foreignKey:'company_id'});
Category.belongsTo(Company,{foreignKey:'company_id'});

Company.hasMany(Product,{foreignKey:'company_id'});
Product.belongsTo(Company,{foreignKey:'company_id'});

Category.hasMany(Product,{foreignKey:'category_id'});
Product.belongsTo(Category,{foreignKey:'category_id'});

Company.hasMany(Invoice,{foreignKey:'company_id'});
Invoice.belongsTo(Company,{foreignKey:'company_id'});

Customer.hasMany(Invoice,{foreignKey:'customer_id'});
Invoice.belongsTo(Customer,{foreignKey:'customer_id'});

Invoice.hasMany(InvoiceItem,{foreignKey:'invoice_id',as:'items'});
InvoiceItem.belongsTo(Invoice,{foreignKey:'invoice_id'});

Product.hasMany(InvoiceItem,{foreignKey:'product_id'});
InvoiceItem.belongsTo(Product,{foreignKey:'product_id'});

Company.hasMany(Purchase,{foreignKey:'company_id'});
Purchase.belongsTo(Company,{foreignKey:'company_id'});

Supplier.hasMany(Purchase,{foreignKey:'supplier_id'});
Purchase.belongsTo(Supplier,{foreignKey:'supplier_id'});

Purchase.hasMany(PurchaseItem,{foreignKey:'purchase_id', as: 'items'});
PurchaseItem.belongsTo(Purchase,{foreignKey:'purchase_id'});

Product.hasMany(PurchaseItem,{foreignKey:'product_id'});
PurchaseItem.belongsTo(Product,{foreignKey:'product_id'});

// PurchaseOrder Associations
Company.hasMany(PurchaseOrder, { foreignKey: 'company_id' });
PurchaseOrder.belongsTo(Company, { foreignKey: 'company_id' });

Supplier.hasMany(PurchaseOrder, { foreignKey: 'supplier_id' });
PurchaseOrder.belongsTo(Supplier, { foreignKey: 'supplier_id' });

PurchaseOrder.hasMany(PurchaseOrderItem, { foreignKey: 'purchase_order_id', as: 'items', onDelete: 'CASCADE' });
PurchaseOrderItem.belongsTo(PurchaseOrder, { foreignKey: 'purchase_order_id' });

Product.hasMany(PurchaseOrderItem, { foreignKey: 'product_id' });
PurchaseOrderItem.belongsTo(Product, { foreignKey: 'product_id' });

Company.hasMany(Expense,{foreignKey:'company_id'});
Expense.belongsTo(Company,{foreignKey:'company_id'});

Company.hasOne(InvoiceCounter,{foreignKey:'company_id'});
InvoiceCounter.belongsTo(Company,{foreignKey:'company_id'});

Company.hasOne(QuotationCounter,{foreignKey:'company_id'});
QuotationCounter.belongsTo(Company,{foreignKey:'company_id'});

Company.hasMany(Payment, { foreignKey: 'company_id' });
Payment.belongsTo(Company, { foreignKey: 'company_id' });

Invoice.hasMany(Payment, { foreignKey: 'invoice_id' });
Payment.belongsTo(Invoice, { foreignKey: 'invoice_id' });

Purchase.hasMany(Payment, { foreignKey: 'purchase_id' });
Payment.belongsTo(Purchase, { foreignKey: 'purchase_id' });

Customer.hasMany(Payment, { foreignKey: 'customer_id' });
Payment.belongsTo(Customer, { foreignKey: 'customer_id' });

Supplier.hasMany(Payment, { foreignKey: 'supplier_id' });
Payment.belongsTo(Supplier, { foreignKey: 'supplier_id' });

Product.hasMany(StockMovement, { foreignKey: 'product_id' });
StockMovement.belongsTo(Product, { foreignKey: 'product_id' });

Company.hasMany(StockMovement, { foreignKey: 'company_id' });
StockMovement.belongsTo(Company, { foreignKey: 'company_id' });

Company.hasMany(Godown, { foreignKey: 'company_id' });
Godown.belongsTo(Company, { foreignKey: 'company_id' });

Product.hasMany(StockLevel, { foreignKey: 'product_id' });
StockLevel.belongsTo(Product, { foreignKey: 'product_id' });

Godown.hasMany(StockLevel, { foreignKey: 'godown_id' });
StockLevel.belongsTo(Godown, { foreignKey: 'godown_id' });

Godown.hasMany(StockMovement, { foreignKey: 'godown_id' });
StockMovement.belongsTo(Godown, { foreignKey: 'godown_id' });

Godown.hasMany(Invoice, { foreignKey: 'godown_id' });
Invoice.belongsTo(Godown, { foreignKey: 'godown_id' });

Godown.hasMany(Purchase, { foreignKey: 'godown_id' });
Purchase.belongsTo(Godown, { foreignKey: 'godown_id' });

Godown.hasMany(Quotation, { foreignKey: 'godown_id' });
Quotation.belongsTo(Godown, { foreignKey: 'godown_id' });

Company.hasMany(Quotation, { foreignKey: 'company_id' });
Quotation.belongsTo(Company, { foreignKey: 'company_id' });

Company.hasMany(CreditNote, { foreignKey: 'company_id' });
CreditNote.belongsTo(Company, { foreignKey: 'company_id' });

Customer.hasMany(CreditNote, { foreignKey: 'customer_id' });
CreditNote.belongsTo(Customer, { foreignKey: 'customer_id' });

Invoice.hasMany(CreditNote, { foreignKey: 'invoice_id' });
CreditNote.belongsTo(Invoice, { foreignKey: 'invoice_id' });

CreditNote.hasMany(CreditNoteItem, { foreignKey: 'credit_note_id', as: 'items' });
CreditNoteItem.belongsTo(CreditNote, { foreignKey: 'credit_note_id' });

Product.hasMany(CreditNoteItem, { foreignKey: 'product_id' });
CreditNoteItem.belongsTo(Product, { foreignKey: 'product_id' });

Customer.hasMany(Quotation, { foreignKey: 'customer_id' });
Quotation.belongsTo(Customer, { foreignKey: 'customer_id' });

Quotation.hasMany(QuotationItem, { foreignKey: 'quotation_id', as: 'items' });
QuotationItem.belongsTo(Quotation, { foreignKey: 'quotation_id' });

Product.hasMany(QuotationItem, { foreignKey: 'product_id' });
QuotationItem.belongsTo(Product, { foreignKey: 'product_id' });

Company.hasMany(EWayBill, { foreignKey: 'company_id' });
EWayBill.belongsTo(Company, { foreignKey: 'company_id' });

Invoice.hasOne(EWayBill, { foreignKey: 'invoice_id', as: 'EWayBill' });
EWayBill.belongsTo(Invoice, { foreignKey: 'invoice_id' });

Company.hasMany(Staff, { foreignKey: 'company_id' });
Staff.belongsTo(Company, { foreignKey: 'company_id' });

Staff.hasMany(StaffAttendance, { foreignKey: 'staff_id' });
StaffAttendance.belongsTo(Staff, { foreignKey: 'staff_id' });

/* =========================================
   USERCOMPANY RELATIONSHIPS
========================================= */

User.hasMany(UserCompany, { foreignKey: 'user_id' });
UserCompany.belongsTo(User, { foreignKey: 'user_id' });

Company.hasMany(UserCompany, { foreignKey: 'company_id' });
UserCompany.belongsTo(Company, { foreignKey: 'company_id' });

/* =========================================
   EXPORT
========================================= */

module.exports = {
  sequelize,
  Plan,
  PlanFeature,
  Company,
  Affiliate,
  User,
  UserCompany,
  Subscription,
  Customer,
  Supplier,
  Category,
  Product,
  Invoice,
  InvoiceItem,
  Purchase,
  PurchaseItem,
  PurchaseOrder,
  PurchaseOrderItem,
  Expense,
  InvoiceCounter,
  Payment,
  StockMovement,
  Godown,
  Staff,
  StaffAttendance,
  Quotation,
  QuotationItem,
  QuotationCounter,
  CreditNote,
  CreditNoteItem,
  EWayBill,
  StockLevel,
  Enquiry,
  Coupon,
  GstCache,
  TaxSetting
};
