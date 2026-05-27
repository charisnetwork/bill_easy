export const industries = [
  "General Store", "FMCG", "Garments", "Hardware", "Electronics", "Stationery", "Retail",
  "Consulting", "IT", "Accounting", "Education", "Photography", "Services",
  "Automobile", "Service Centres", "Engineering", "Electrical", "Interiors",
  "Doctor", "Pharma", "Hospital", "Healthcare",
  "Hotels", "Restaurants", "Hospitality",
  "Transport", "Real Estate", "Logistics", "Rental"
];

const retailConfig = {
  category: "Standard Retail",
  labels: { 
    customer: "Customer Name", 
    itemName: "Item", 
    qty: "Qty", 
    price: "Rate", 
    hsn: "HSN", 
    unit: "Unit" 
  },
  fields: { showHSN: true, showUOM: true, showDiscount: true, showQty: true, showBarcode: true },
  extraFields: []
};

const serviceConfig = {
  category: "Service-Only",
  labels: { 
    customer: "Client Name", 
    itemName: "Service Description", 
    qty: "Hours/Units", 
    price: "Rate", 
    hsn: "SAC Code" 
  },
  fields: { showHSN: true, showUOM: false, showDiscount: true, showQty: true, showDescription: true, showBarcode: false },
  extraFields: []
};

const partsLaborConfig = {
  category: "Parts + Labor",
  labels: { 
    customer: "Customer Name", 
    itemName: "Spare Parts / Service", 
    qty: "Qty/Hours", 
    price: "Rate" 
  },
  fields: { showHSN: true, showUOM: true, showDiscount: true, showQty: true, splitTable: true, showBarcode: false },
  extraFields: []
};

const healthcareConfig = {
  category: "Healthcare",
  labels: { 
    customer: "Patient Name", 
    itemName: "Treatment/Medicine", 
    qty: "Qty", 
    price: "Price" 
  },
  fields: { showHSN: false, showUOM: false, showDiscount: true, showQty: true, showBarcode: false },
  extraFields: [
    { name: "patient_name", label: "Patient Name", type: "text" },
    { name: "patient_age", label: "Age", type: "number" },
    { name: "batch_number", label: "Batch Number", type: "text" },
    { name: "expiry_date", label: "Expiry Date", type: "date" }
  ]
};

const hospitalityConfig = {
  category: "Hospitality",
  labels: { 
    customer: "Guest Name", 
    itemName: "Stay Description / Dish", 
    qty: "Qty/Nights", 
    price: "Price" 
  },
  fields: { showHSN: false, showUOM: false, showDiscount: true, showQty: true, showBarcode: false },
  extraFields: [
    { name: "table_no", label: "Table No", type: "text" },
    { name: "room_no", label: "Room No", type: "text" },
    { name: "check_in_date", label: "Check-in Date", type: "date" },
    { name: "check_out_date", label: "Check-out Date", type: "date" },
    { name: "service_charge", label: "Service Charge", type: "number" }
  ]
};

const logisticsRentalConfig = {
  category: "Logistics & Rental",
  labels: { 
    customer: "Customer Name", 
    itemName: "Service / Asset", 
    qty: "Qty", 
    price: "Rate" 
  },
  fields: { showHSN: true, showUOM: false, showDiscount: true, showQty: true, showBarcode: false },
  extraFields: [
    { name: "vehicle_no", label: "Vehicle No", type: "text" },
    { name: "lr_no", label: "LR No", type: "text" },
    { name: "property_address", label: "Property Address", type: "textarea" },
    { name: "rental_period", label: "Rental Period", type: "text" }
  ]
};

export const industryMapping = {
  "General Store": retailConfig, "FMCG": retailConfig, "Garments": retailConfig, 
  "Hardware": retailConfig, "Electronics": retailConfig, "Stationery": retailConfig, "Retail": retailConfig,

  "Consulting": serviceConfig, "IT": serviceConfig, "Accounting": serviceConfig, 
  "Education": serviceConfig, "Photography": serviceConfig, "Services": serviceConfig,

  "Automobile": partsLaborConfig, "Service Centres": partsLaborConfig, 
  "Engineering": partsLaborConfig, "Electrical": partsLaborConfig, "Interiors": partsLaborConfig,

  "Doctor": healthcareConfig, "Pharma": healthcareConfig, "Hospital": healthcareConfig, "Healthcare": healthcareConfig,

  "Hotels": hospitalityConfig, "Restaurants": hospitalityConfig, "Hospitality": hospitalityConfig,

  "Transport": logisticsRentalConfig, "Real Estate": logisticsRentalConfig, 
  "Logistics": logisticsRentalConfig, "Rental": logisticsRentalConfig
};

export const getIndustryConfig = (industryName) => {
  return industryMapping[industryName] || retailConfig;
};
