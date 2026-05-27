require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const http = require('http');

const { rateLimit } = require('express-rate-limit');

const { sequelize, Plan, Company, Subscription, Godown, User, UserCompany } = require('./models');

// Routes
const authRoutes = require('./routes/auth');
const companyRoutes = require('./routes/company');
const customerRoutes = require('./routes/customers');
const supplierRoutes = require('./routes/suppliers');
const productRoutes = require("./routes/products");
const invoiceRoutes = require("./routes/invoices");
const quotationRoutes = require("./routes/quotations");
const purchaseRoutes = require("./routes/purchases");
const purchaseOrderRoutes = require('./routes/purchaseOrders');
const expenseRoutes = require('./routes/expenses');
const reportRoutes = require('./routes/reports');
const subscriptionRoutes = require('./routes/subscription');
const ewayBillRoutes = require('./routes/ewayBills');
const creditNoteRoutes = require('./routes/creditNotes');
const aiRoutes = require('./routes/ai');
const enquiryRoutes = require('./routes/enquiry');
const paymentRoutes = require('./routes/payments');

const app = express();

// Trust proxy for express-rate-limit
app.set('trust proxy', 1);

/* =========================================
   SECURITY
========================================= */

app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" }
  })
);

/* =========================================
   CORS CONFIGURATION
   Vercel Frontend + Railway Backend Setup
========================================= */

// Default allowed origins
const ALLOWED_ORIGINS = [
  // Production custom domain (if using)
  'https://charisbilleasy.store',
  'https://www.charisbilleasy.store',
  'https://admin.charisbilleasy.store',
  // Local development
  'http://localhost:3000',
  'http://localhost:5173',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:5173'
];

// Add FRONTEND_URL from env (comma-separated for multiple origins)
if (process.env.FRONTEND_URL) {
  const envOrigins = process.env.FRONTEND_URL.split(',').map(o => o.trim());
  ALLOWED_ORIGINS.push(...envOrigins);
  // CORS: FRONTEND_URL origins added
}

// Helper to check if origin matches allowed patterns
const isOriginAllowed = (origin) => {
  // Allow all origins in production for health checks and flexibility
  if (!origin) return true;
  
  // Exact match
  if (ALLOWED_ORIGINS.includes(origin)) return true;
  
  // Allow all Vercel preview deployments (xxx.vercel.app)
  if (origin.endsWith('.vercel.app')) return true;
  
  // Allow Railway app domains
  if (origin.includes('.up.railway.app')) return true;
  
  // Allow Cloudflare Pages domains (xxx.pages.dev and custom *.pages.dev)
  if (origin.includes('.pages.dev')) return true;
  
  // Allow Railway public domains (for health checks)
  if (origin.includes('railway.app')) return true;
  
  return true; // Allow all origins by default for now
};

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow all origins - health checks, mobile apps, curl, server-to-server
      callback(null, true);
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-company-id', 'x-admin-secret', 'x-admin-token'],
    credentials: true
  })
);

/* =========================================
   REQUEST LOGGER
========================================= */

app.use(morgan('dev'));

/* =========================================
   RATE LIMITING
========================================= */

const { apiLimiter } = require('./middleware/rateLimit');

// Apply general API rate limiting (excludes auth routes which have their own)
app.use('/api/', apiLimiter);

/* =========================================
   BODY PARSER
========================================= */

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

/* =========================================
   HEALTH CHECK
========================================= */

// Health check (both /api/health and /health) - MUST return 200 for Railway
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'main-backend'
  });
});

app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'main-backend'
  });
});

/* =========================================
   API ROUTES
========================================= */

// Standard /api/* routes (for Vercel proxy)
app.use('/api/auth', authRoutes);
app.use('/api/company', companyRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use("/api/products", productRoutes);
app.use("/api/invoices", invoiceRoutes);
app.use("/api/quotations", quotationRoutes);
app.use("/api/purchases", purchaseRoutes);
app.use("/api/purchase-orders", purchaseOrderRoutes);
app.use("/api/expenses", expenseRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/subscription', subscriptionRoutes);
app.use('/api/eway-bills', ewayBillRoutes);
app.use('/api/credit-notes', creditNoteRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/enquiries', enquiryRoutes);
app.use('/api/staff', require('./routes/staff'));
app.use("/api/utilities", require("./routes/utilities"));

// Direct routes without /api prefix (for Railway direct access)
// These handle cases where Railway strips the /api prefix
app.use('/auth', authRoutes);
app.use('/company', companyRoutes);
app.use('/customers', customerRoutes);
app.use('/suppliers', supplierRoutes);
app.use("/products", productRoutes);
app.use("/invoices", invoiceRoutes);
app.use("/quotations", quotationRoutes);
app.use("/purchases", purchaseRoutes);
app.use("/purchase-orders", purchaseOrderRoutes);
app.use("/expenses", expenseRoutes);
app.use('/payments', paymentRoutes);
app.use('/reports', reportRoutes);
app.use('/subscription', subscriptionRoutes);
app.use('/eway-bills', ewayBillRoutes);
app.use('/credit-notes', creditNoteRoutes);
app.use('/ai', aiRoutes);
app.use('/enquiries', enquiryRoutes);
app.use('/staff', require('./routes/staff'));
app.use("/utilities", require("./routes/utilities"));

app.use("/uploads", express.static("uploads"));

/* =========================================
   ROOT ENDPOINT
========================================= */

// Root endpoint for basic health check
app.get('/', (req, res) => {
  res.json({
    message: "Bill Easy Backend is running.",
    port: process.env.PORT || 8001,
    status: "active"
  });
});

// API info endpoint (both /api and direct)
app.get('/api', (req, res) => {
  res.json({
    name: 'Bill Easy API',
    version: '1.0.0'
  });
});

app.get('/api-info', (req, res) => {
  res.json({
    name: 'Bill Easy API',
    version: '1.0.0'
  });
});

/* =========================================
   ERROR HANDLER
========================================= */

app.use((err, req, res, next) => {
  // Handle CORS errors specifically
  if (err.message === 'Not allowed by CORS') {
    // CORS error logged but allow for now
    return res.status(200).json({
      status: 'ok',
      message: 'CORS bypassed'
    });
  }
  
  console.error('ERROR:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error'
  });
});

/* =========================================
   404 HANDLER
========================================= */

// 404 handler for unmatched routes
app.use((req, res) => {
  // 404 - Route not found
  res.status(404).json({
    error: 'Route not found',
    path: req.url,
    method: req.method
  });
});

/* =========================================
   SEED DEFAULT PLANS
========================================= */

const seedPlans = async () => {
  try {
    const plans = [
      {
        plan_name: 'Free Account',
        price: 0,
        billing_cycle: 'lifetime',
        max_users: 1,
        max_invoices_per_month: 50,
        max_products: 100,
        features: {
          gst_billing: true,
          inventory_management: true,
          reports: true,
          quotations: true,
          eway_bills: false,
          multi_godowns: false,
          staff_attendance_payroll: false,
          manage_businesses: 1,
          user_activity_tracker: false
        },
        is_active: true
      },
      {
        plan_name: 'Premium',
        price: 499,
        billing_cycle: '3month',
        max_users: 5,
        max_invoices_per_month: 999999,
        max_products: 10000,
        features: {
          gst_billing: true,
          inventory_management: true,
          reports: true,
          quotations: true,
          eway_bills: true, // Limited access check in Guard
          multi_godowns: true,
          staff_attendance_payroll: false,
          manage_businesses: 2,
          user_activity_tracker: false
        },
        is_active: true
      },
      {
        plan_name: 'Enterprise',
        price: 699,
        billing_cycle: '3month',
        max_users: 20,
        max_invoices_per_month: 999999,
        max_products: 100000,
        features: {
          gst_billing: true,
          inventory_management: true,
          reports: true,
          quotations: true,
          eway_bills: true,
          multi_godowns: true,
          staff_attendance_payroll: true,
          manage_businesses: 3,
          user_activity_tracker: true,
          priority_support: true
        },
        is_active: true
      }
    ];

    for (const planData of plans) {
      const [plan, created] = await Plan.findOrCreate({
        where: { plan_name: planData.plan_name },
        defaults: planData
      });

      if (!created) {
        await plan.update(planData);
      }
    }

    // Also handle migration from old names if they exist
    const oldPlans = ['Zero Account', 'Free'];
    const newFreePlan = await Plan.findOne({ where: { plan_name: 'Free Account' } });
    
    if (newFreePlan) {
      for (const oldName of oldPlans) {
        const oldPlan = await Plan.findOne({ where: { plan_name: oldName } });
        if (oldPlan) {
          await Subscription.update(
            { plan_id: newFreePlan.id },
            { where: { plan_id: oldPlan.id } }
          );
          await oldPlan.destroy();
        }
      }
    }

    // Plans seeded
  } catch (error) {
    // Plan seed error handled
  }
};

/* =========================================
   SERVER START
========================================= */

const PORT = process.env.PORT || 8001;

process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('UNHANDLED REJECTION:', reason);
});

// Migration v2 - Force rebuild 2026-04-17T20:30
const startServer = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connection established');

    // Run security migrations first
    try {
      const runMigrations = require('./scripts/runMigrations');
      await runMigrations();
    } catch (migrationError) {
      console.warn('Migration warning (continuing):', migrationError.message);
    }

    // Run migrations to fix database schema
    console.log('Running database migrations...');
    const queryInterface = sequelize.getQueryInterface();
    const { DataTypes } = require('sequelize');
    
    // Migration: Add missing columns to plans table
    try {
      // Check if plans table exists first
      const tables = await queryInterface.showAllTables();
      if (!tables.includes('plans')) {
        // plans table migration skipped
      } else {
        const tableInfo = await queryInterface.describeTable('plans');
        
        if (!tableInfo.max_users) {
          // Migration: max_users column
          await queryInterface.addColumn('plans', 'max_users', {
            type: DataTypes.INTEGER,
            defaultValue: 1
          });
        }
        
        if (!tableInfo.max_invoices_per_month) {
          // Migration: max_invoices_per_month column
          await queryInterface.addColumn('plans', 'max_invoices_per_month', {
            type: DataTypes.INTEGER,
            defaultValue: 100
          });
        }
        
        if (!tableInfo.max_products) {
          // Migration: max_products column
          await queryInterface.addColumn('plans', 'max_products', {
            type: DataTypes.INTEGER,
            defaultValue: 100
          });
        }
        
        if (!tableInfo.storage_limit) {
          // Migration: storage_limit column
          await queryInterface.addColumn('plans', 'storage_limit', {
            type: DataTypes.INTEGER,
            defaultValue: 100
          });
        }
        
        if (!tableInfo.features) {
          // Migration: features column
          await queryInterface.addColumn('plans', 'features', {
            type: DataTypes.JSON,
            defaultValue: {}
          });
        }
        
        if (!tableInfo.is_active) {
          // Migration: is_active column
          await queryInterface.addColumn('plans', 'is_active', {
            type: DataTypes.BOOLEAN,
            defaultValue: true
          });
        }
        
        if (!tableInfo.billing_cycle) {
          // Migration: billing_cycle column
          await queryInterface.addColumn('plans', 'billing_cycle', {
            type: DataTypes.ENUM('monthly', '3month', '6month', 'yearly', 'lifetime'),
            defaultValue: 'monthly'
          });
        }
        
        // Plans migration done
      }

      // Migration: Add missing columns to users table
      if (tables.includes('users')) {
        const userTableInfo = await queryInterface.describeTable('users');
        
        if (!userTableInfo.password) {
          // Migration: password column
          await queryInterface.addColumn('users', 'password', {
            type: DataTypes.STRING,
            allowNull: true // Allow null for migration, but it will be populated
          });
        }
        
        if (!userTableInfo.permissions) {
          // Migration: permissions column
          await queryInterface.addColumn('users', 'permissions', {
            type: DataTypes.JSON,
            defaultValue: {}
          });
        }

        if (!userTableInfo.is_active) {
          // Migration: is_active column
          await queryInterface.addColumn('users', 'is_active', {
            type: DataTypes.BOOLEAN,
            defaultValue: true
          });
        }

        if (!userTableInfo.email_verified) {
          // Migration: email_verified column
          await queryInterface.addColumn('users', 'email_verified', {
            type: DataTypes.BOOLEAN,
            defaultValue: false
          });
        }

        if (!userTableInfo.last_login) {
          // Migration: last_login column
          await queryInterface.addColumn('users', 'last_login', {
            type: DataTypes.DATE,
            allowNull: true
          });
        }

        if (!userTableInfo.role) {
          // Migration: role column
          await queryInterface.addColumn('users', 'role', {
            type: DataTypes.ENUM('owner', 'admin', 'staff'),
            defaultValue: 'staff'
          });
        }
      }

      // Migration: Add missing columns to companies table
      if (tables.includes('companies')) {
        const compTableInfo = await queryInterface.describeTable('companies');
        const columnsToAdd = [
          { name: 'gst_registered', type: DataTypes.BOOLEAN, default: false },
          { name: 'enable_tds', type: DataTypes.BOOLEAN, default: false },
          { name: 'enable_tcs', type: DataTypes.BOOLEAN, default: false },
          { name: 'bank_name', type: DataTypes.STRING },
          { name: 'account_number', type: DataTypes.STRING },
          { name: 'ifsc_code', type: DataTypes.STRING },
          { name: 'branch_name', type: DataTypes.STRING },
          { name: 'qr_code', type: DataTypes.STRING },
          { name: 'terms_conditions', type: DataTypes.TEXT }
        ];

        for (const col of columnsToAdd) {
          if (!compTableInfo[col.name]) {
            // Migration column added
            await queryInterface.addColumn('companies', col.name, {
              type: col.type,
              defaultValue: col.default
            });
          }
        }
      }

      // Migration: Ensure AIUsage table exists
      if (!tables.includes('ai_usage')) {
        // Migration: ai_usage table
        await queryInterface.createTable('ai_usage', {
          id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
          user_id: { type: DataTypes.UUID, allowNull: false },
          company_id: { type: DataTypes.UUID, allowNull: false },
          date: { type: DataTypes.DATEONLY, defaultValue: DataTypes.NOW },
          count: { type: DataTypes.INTEGER, defaultValue: 0 },
          created_at: { type: DataTypes.DATE, allowNull: false },
          updated_at: { type: DataTypes.DATE, allowNull: false }
        });
        await queryInterface.addIndex('ai_usage', ['user_id', 'date'], { unique: true });
      }
    } catch (migrationError) {
      // Migration error handled
      // Don't throw - continue startup even if migration fails
    }

    // Only use alter: true in development; in production, use migrations
    const syncOptions = process.env.NODE_ENV === 'production' ? {} : { alter: true };
    await sequelize.sync(syncOptions);
    // Database synchronized

    await seedPlans();

    // Scan for expired subscriptions and downgrade
    try {
      const { Op } = require('sequelize');
      const freePlan = await Plan.findOne({ where: { plan_name: 'Free Account' } });
      if (freePlan) {
        await Subscription.update(
          { plan_id: freePlan.id, expiry_date: null, status: 'active' },
          { 
            where: { 
              expiry_date: { [Op.lt]: new Date() },
              plan_id: { [Op.ne]: freePlan.id }
            } 
          }
        );
      }
    } catch (checkExpiredError) {
      // Subscription check warning
      // Continue startup - this might happen if plans table columns are missing
    }
    
    // Ensure data integrity
    try {
      // Check if User table has password column before query
      const tableInfo = await queryInterface.describeTable('users');
      if (!tableInfo.password) {
        // Password column check skipped
      } else {
        const allUsers = await User.findAll();
        for (const user of allUsers) {
          if (user.company_id) {
            await UserCompany.findOrCreate({
              where: { user_id: user.id, company_id: user.company_id },
              defaults: { role: user.role || 'owner' }
            });
          }
        }
      }
    } catch (userIntegrityError) {
      // User integrity check warning
    }

    try {
      const companies = await Company.findAll({
        include: [{ model: Subscription }, { model: Godown }]
      });
      
      let freePlan;
      try {
        freePlan = await Plan.findOne({ where: { plan_name: 'Free Account' } });
      } catch (planError) {
        // Free plan fetch warning
      }

      for (const company of companies) {
        // 1. Default Godown
        if (!company.Godowns || company.Godowns.length === 0) {
          // Creating default Godown
          await Godown.create({
            company_id: company.id,
            name: 'Main Store',
            address: company.address || 'Main Office',
            is_default: true,
            is_active: true
          });
        }
        
        // 2. Default Subscription
        if (!company.Subscription && freePlan) {
          // Creating default Subscription
          const expiry = new Date();
          expiry.setFullYear(expiry.getFullYear() + 10);
          await Subscription.create({
            company_id: company.id,
            plan_id: freePlan.id,
            status: 'active',
            payment_status: 'paid',
            expiry_date: expiry,
            usage: { invoices: 0, eway_bills: 0, godowns: 0, products: 0 }
          });
        }
      }
    } catch (companySetupError) {
      // Company setup warning
    }

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log('Charis is now powered by Gemini 3.0 Flash');
    });
  } catch (error) {
    console.error('Server startup error:', error);
    // Still start the server even if DB fails - health check will work
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Server running on port ${PORT} (DB connection failed)`);
    });
  }
};

startServer();
