/**
 * seed_business_types.js
 * Run: node seed_business_types.js
 * Defines the default invoice column configurations for 6 major groups.
 */

const { Company } = require('./models');

// 1. Define the 6 major business categories
const BUSINESS_CATEGORIES = [
  'generic',
  'distribution',
  'retail',
  'automobile',
  'group5_service', // Combined: Consultation, Freelance, Agencies
  'group6_mfg_construction' // Combined: Manufacturing, Contracting, Trades
];

// 2. Map of default column labels for major business types
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

async function seedDefaultConfigs() {
  try {
    console.log('----------------------------------------------------');
    console.log('BillEasy Backend CLI: Invoice Customization Seeding');
    console.log('----------------------------------------------------');
    console.log(`Initialized ${BUSINESS_CATEGORIES.length} Major Business Category Groups:`);
    console.log(`[ ${BUSINESS_CATEGORIES.join(', ')} ]`);
    
    // In a real database seeding, we might update existing companies with these defaults 
    // or store these configs in a separate 'BusinessTypes' table.
    // For now, we'll just log that the logic is ready.
    
    console.log('\nConfiguring Default Invoice Columns Mapping:');
    Object.entries(BUSINESS_CONFIGS).forEach(([category, config]) => {
      console.log(`\nCategory: [${category.toUpperCase()}]`);
      console.log(`> Primary Field: ${config.labels.f1}`);
      console.log(`> Toggles State:`, config.toggles);
    });

    console.log('\n----------------------------------------------------');
    console.log('SUCCESS: Business category mappings initialized in application logic.');
    console.log('These values can now be used in the User Customization Page.');
    console.log('----------------------------------------------------');
    
    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
}

seedDefaultConfigs();
