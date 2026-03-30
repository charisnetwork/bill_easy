require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');
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

app.use(
  cors({
    origin: [
      'https://charisbilleasy.store', 
      'https://admin.charisbilleasy.store',
      'https://billeasy-frontend.onrender.com',
      'https://billeasy-admin-frontend.onrender.com',
      'http://localhost:3000',
      'http://localhost:3021'
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-company-id'],
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

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  message: {
    error: 'Too many requests, please try again later'
  }
});

app.use(limiter);

/* =========================================
   BODY PARSER
========================================= */

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

/* =========================================
   HEALTH CHECK
========================================= */

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString()
  });
});

/* =========================================
   API ROUTES
========================================= */

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
app.use("/api/utils", require("./routes/utilities"));
app.use("/uploads", express.static("uploads"));

/* =========================================
   ROOT ENDPOINT
========================================= */

app.get('/api', (req, res) => {
  res.json({
    name: 'Bill Easy API',
    version: '1.0.0'
  });
});

/* =========================================
   ERROR HANDLER
========================================= */

app.use((err, req, res, next) => {
  console.error('ERROR:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error'
  });
});

/* =========================================
   404 HANDLER
========================================= */

app.use((req, res) => {
  res.status(404).json({
    error: 'Route not found'
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

    console.log('Plans seeded/updated successfully');
  } catch (error) {
    console.error('Plan seed error:', error);
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

const startServer = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connection established');

    await sequelize.sync({ alter: true });
    console.log('Database synchronized');

    await seedPlans();

    // Scan for expired subscriptions and downgrade
    const checkExpired = async () => {
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
    };
    await checkExpired();
    
    // Ensure data integrity
    const allUsers = await User.findAll();
    for (const user of allUsers) {
      if (user.company_id) {
        await UserCompany.findOrCreate({
          where: { user_id: user.id, company_id: user.company_id },
          defaults: { role: user.role || 'owner' }
        });
      }
    }

    const companies = await Company.findAll({
      include: [{ model: Subscription }, { model: Godown }]
    });
    
    const freePlan = await Plan.findOne({ where: { plan_name: 'Free Account' } });

    for (const company of companies) {
      // 1. Default Godown
      if (!company.Godowns || company.Godowns.length === 0) {
        console.log(`Creating default Godown for: ${company.name}`);
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
        console.log(`Creating Free Account sub for: ${company.name}`);
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

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log('Charis is now powered by Gemini 3 Flash');
    });
  } catch (error) {
    console.error('Server startup failed:', error);
    process.exit(1);
  }
};

startServer();
