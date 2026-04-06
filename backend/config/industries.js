/**
 * Industry Configuration for BillEasy
 * Defines invoice templates, fields, and behaviors for different business types
 */

// Industry Groups - Similar industries share templates
const INDUSTRY_GROUPS = {
  RETAIL: 'retail',
  AUTOMOBILE_SERVICE: 'automobile_service',
  MANUFACTURING: 'manufacturing',
  PROFESSIONAL_SERVICES: 'professional_services',
  HEALTHCARE: 'healthcare',
  HOSPITALITY: 'hospitality',
  LOGISTICS: 'logistics',
  CONSTRUCTION: 'construction',
  PHARMA: 'pharma'
};

// All supported industries with their group mapping
const INDUSTRIES = {
  // Retail & Distribution Group
  'General Store': { group: INDUSTRY_GROUPS.RETAIL, icon: 'shopping-cart' },
  'Retail Shop': { group: INDUSTRY_GROUPS.RETAIL, icon: 'store' },
  'Cloth Store': { group: INDUSTRY_GROUPS.RETAIL, icon: 'shirt' },
  'Distribution': { group: INDUSTRY_GROUPS.RETAIL, icon: 'truck' },
  'Electronics': { group: INDUSTRY_GROUPS.RETAIL, icon: 'smartphone' },
  'Hardware': { group: INDUSTRY_GROUPS.RETAIL, icon: 'wrench' },
  
  // Automobile & Service Group (Dual table: Products + Services)
  'Automobile': { group: INDUSTRY_GROUPS.AUTOMOBILE_SERVICE, icon: 'car', hasServiceTable: true },
  'Service Center': { group: INDUSTRY_GROUPS.AUTOMOBILE_SERVICE, icon: 'settings', hasServiceTable: true },
  
  // Manufacturing Group
  'Manufacturing': { group: INDUSTRY_GROUPS.MANUFACTURING, icon: 'factory' },
  
  // Professional Services Group
  'IT and Consultant': { group: INDUSTRY_GROUPS.PROFESSIONAL_SERVICES, icon: 'laptop' },
  'Consultant': { group: INDUSTRY_GROUPS.PROFESSIONAL_SERVICES, icon: 'briefcase' },
  
  // Healthcare Group
  'Health Care': { group: INDUSTRY_GROUPS.HEALTHCARE, icon: 'heart-pulse' },
  'Hospital': { group: INDUSTRY_GROUPS.HEALTHCARE, icon: 'building-2' },
  
  // Pharma Group
  'Pharma': { group: INDUSTRY_GROUPS.PHARMA, icon: 'pill', showBatch: true, showExpiry: true },
  
  // Hospitality Group
  'Hotel': { group: INDUSTRY_GROUPS.HOSPITALITY, icon: 'hotel' },
  'Restaurants': { group: INDUSTRY_GROUPS.HOSPITALITY, icon: 'utensils' },
  
  // Logistics Group
  'Logistics': { group: INDUSTRY_GROUPS.LOGISTICS, icon: 'package' },
  'Transport': { group: INDUSTRY_GROUPS.LOGISTICS, icon: 'truck' }
};

// Industry-specific field configurations
const getIndustryConfig = (industryName) => {
  const industry = INDUSTRIES[industryName] || INDUSTRIES['General Store'];
  const group = industry.group;
  
  // Base configuration
  const baseConfig = {
    industry: industryName,
    group: group,
    hasServiceTable: industry.hasServiceTable || false,
    showBatch: industry.showBatch || false,
    showExpiry: industry.showExpiry || false,
    labels: {},
    fields: {},
    extraFields: [],
    invoiceTemplate: group,
    taxBreakdown: true
  };
  
  // Group-specific configurations
  switch (group) {
    case INDUSTRY_GROUPS.RETAIL:
      return {
        ...baseConfig,
        labels: {
          itemName: 'Item Description',
          qty: 'Qty',
          price: 'Rate',
          amount: 'Amount',
          total: 'Total'
        },
        fields: {
          showQty: true,
          showDiscount: true,
          showDescription: true,
          showHSN: true
        },
        columns: ['#', 'Item', 'HSN', 'Qty', 'Rate', 'GST%', 'Discount', 'Amount']
      };
      
    case INDUSTRY_GROUPS.AUTOMOBILE_SERVICE:
      return {
        ...baseConfig,
        labels: {
          itemName: 'Part/Service Description',
          productName: 'Spare Parts',
          serviceName: 'Services & Labour',
          qty: 'Qty/Hrs',
          price: 'Rate',
          amount: 'Amount',
          total: 'Total'
        },
        fields: {
          showQty: true,
          showDiscount: true,
          showDescription: true,
          showHSN: true,
          hasServiceTable: true
        },
        extraFields: [
          { name: 'vehicle_number', label: 'Vehicle Number', type: 'text' },
          { name: 'vehicle_model', label: 'Vehicle Model', type: 'text' },
          { name: 'chassis_number', label: 'Chassis Number', type: 'text' },
          { name: 'km_reading', label: 'KM Reading', type: 'number' },
          { name: 'service_advisor', label: 'Service Advisor', type: 'text' },
          { name: 'estimated_delivery', label: 'Est. Delivery Date', type: 'date' }
        ],
        columns: {
          products: ['#', 'Part Name', 'Part No', 'Qty', 'Rate', 'GST%', 'Amount'],
          services: ['#', 'Service Description', 'Hrs', 'Rate', 'GST%', 'Amount']
        }
      };
      
    case INDUSTRY_GROUPS.MANUFACTURING:
      return {
        ...baseConfig,
        labels: {
          itemName: 'Product/Raw Material',
          qty: 'Qty',
          price: 'Rate',
          amount: 'Amount',
          total: 'Total'
        },
        fields: {
          showQty: true,
          showDiscount: true,
          showDescription: true,
          showHSN: true
        },
        extraFields: [
          { name: 'po_number', label: 'Purchase Order No', type: 'text' },
          { name: 'batch_number', label: 'Batch Number', type: 'text' },
          { name: 'delivery_note', label: 'Delivery Note', type: 'text' }
        ],
        columns: ['#', 'Item', 'HSN', 'Batch', 'Qty', 'Rate', 'GST%', 'Amount']
      };
      
    case INDUSTRY_GROUPS.PROFESSIONAL_SERVICES:
      return {
        ...baseConfig,
        labels: {
          itemName: 'Service Description',
          qty: 'Hours/Days',
          price: 'Rate',
          amount: 'Amount',
          total: 'Total'
        },
        fields: {
          showQty: true,
          showDiscount: false,
          showDescription: true,
          showHSN: false
        },
        extraFields: [
          { name: 'project_name', label: 'Project Name', type: 'text' },
          { name: 'project_reference', label: 'Project Reference', type: 'text' },
          { name: 'period_start', label: 'Period Start', type: 'date' },
          { name: 'period_end', label: 'Period End', type: 'date' }
        ],
        columns: ['#', 'Service', 'Description', 'Hours', 'Rate', 'GST%', 'Amount']
      };
      
    case INDUSTRY_GROUPS.HEALTHCARE:
      return {
        ...baseConfig,
        labels: {
          itemName: 'Treatment/Service',
          qty: 'Sessions',
          price: 'Charges',
          amount: 'Amount',
          total: 'Total'
        },
        fields: {
          showQty: true,
          showDiscount: false,
          showDescription: true,
          showHSN: true
        },
        extraFields: [
          { name: 'patient_name', label: 'Patient Name', type: 'text' },
          { name: 'patient_id', label: 'Patient ID', type: 'text' },
          { name: 'doctor_name', label: 'Doctor Name', type: 'text' },
          { name: 'appointment_date', label: 'Appointment Date', type: 'date' },
          { name: 'room_number', label: 'Room/Bed No', type: 'text' }
        ],
        columns: ['#', 'Treatment/Service', 'Description', 'Qty', 'Rate', 'GST%', 'Amount']
      };
      
    case INDUSTRY_GROUPS.PHARMA:
      return {
        ...baseConfig,
        labels: {
          itemName: 'Medicine/Product',
          qty: 'Qty',
          price: 'MRP',
          amount: 'Amount',
          total: 'Total'
        },
        fields: {
          showQty: true,
          showDiscount: true,
          showDescription: false,
          showHSN: true,
          showBatch: true,
          showExpiry: true
        },
        extraFields: [
          { name: 'patient_name', label: 'Patient Name', type: 'text' },
          { name: 'doctor_name', label: 'Prescribing Doctor', type: 'text' },
          { name: 'prescription_number', label: 'Prescription No', type: 'text' }
        ],
        columns: ['#', 'Medicine', 'Batch', 'Exp', 'Qty', 'MRP', 'GST%', 'Amount']
      };
      
    case INDUSTRY_GROUPS.HOSPITALITY:
      return {
        ...baseConfig,
        labels: {
          itemName: 'Item/Service',
          qty: 'Qty/Nights',
          price: 'Rate',
          amount: 'Amount',
          total: 'Total'
        },
        fields: {
          showQty: true,
          showDiscount: true,
          showDescription: true,
          showHSN: true
        },
        extraFields: [
          { name: 'guest_name', label: 'Guest Name', type: 'text' },
          { name: 'check_in', label: 'Check-in Date', type: 'date' },
          { name: 'check_out', label: 'Check-out Date', type: 'date' },
          { name: 'room_number', label: 'Room Number', type: 'text' },
          { name: 'number_of_guests', label: 'No. of Guests', type: 'number' }
        ],
        columns: ['#', 'Item/Service', 'Description', 'Qty', 'Rate', 'GST%', 'Amount']
      };
      
    case INDUSTRY_GROUPS.LOGISTICS:
      return {
        ...baseConfig,
        labels: {
          itemName: 'Service/Consignment',
          qty: 'Weight/Qty',
          price: 'Rate',
          amount: 'Amount',
          total: 'Total'
        },
        fields: {
          showQty: true,
          showDiscount: false,
          showDescription: true,
          showHSN: false
        },
        extraFields: [
          { name: 'lr_number', label: 'LR Number', type: 'text' },
          { name: 'vehicle_number', label: 'Vehicle Number', type: 'text' },
          { name: 'from_location', label: 'From', type: 'text' },
          { name: 'to_location', label: 'To', type: 'text' },
          { name: 'weight', label: 'Weight (kg)', type: 'number' },
          { name: 'freight_type', label: 'Freight Type', type: 'text' }
        ],
        columns: ['#', 'Description', 'LR No', 'Weight', 'Rate', 'GST%', 'Amount']
      };
      
    default:
      return {
        ...baseConfig,
        labels: {
          itemName: 'Item Description',
          qty: 'Qty',
          price: 'Rate',
          amount: 'Amount',
          total: 'Total'
        },
        fields: {
          showQty: true,
          showDiscount: true,
          showDescription: true,
          showHSN: true
        },
        columns: ['#', 'Item', 'HSN', 'Qty', 'Rate', 'GST%', 'Discount', 'Amount']
      };
  }
};

// Get template file name based on industry group
const getTemplateFile = (group) => {
  const templateMap = {
    [INDUSTRY_GROUPS.RETAIL]: 'retailTemplate',
    [INDUSTRY_GROUPS.AUTOMOBILE_SERVICE]: 'automobileTemplate',
    [INDUSTRY_GROUPS.MANUFACTURING]: 'manufacturingTemplate',
    [INDUSTRY_GROUPS.PROFESSIONAL_SERVICES]: 'serviceTemplate',
    [INDUSTRY_GROUPS.HEALTHCARE]: 'healthcareTemplate',
    [INDUSTRY_GROUPS.PHARMA]: 'pharmaTemplate',
    [INDUSTRY_GROUPS.HOSPITALITY]: 'hospitalityTemplate',
    [INDUSTRY_GROUPS.LOGISTICS]: 'logisticsTemplate',
    [INDUSTRY_GROUPS.CONSTRUCTION]: 'constructionTemplate'
  };
  return templateMap[group] || 'retailTemplate';
};

// Get all industry names for dropdown
const getAllIndustries = () => {
  return Object.keys(INDUSTRIES).map(name => ({
    value: name,
    label: name,
    icon: INDUSTRIES[name].icon,
    group: INDUSTRIES[name].group
  }));
};

// Get industries by group
const getIndustriesByGroup = (group) => {
  return Object.keys(INDUSTRIES)
    .filter(name => INDUSTRIES[name].group === group)
    .map(name => ({
      value: name,
      label: name,
      icon: INDUSTRIES[name].icon
    }));
};

module.exports = {
  INDUSTRY_GROUPS,
  INDUSTRIES,
  getIndustryConfig,
  getTemplateFile,
  getAllIndustries,
  getIndustriesByGroup
};
