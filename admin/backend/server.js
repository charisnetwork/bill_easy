const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const { adminDB, saasDB } = require('./config/db');
const adminRoutes = require('./routes/adminRoutes');

require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3025;

// Robust CORS Configuration
app.use(cors({
  origin: process.env.ADMIN_FRONTEND_URL ? process.env.ADMIN_FRONTEND_URL.split(',') : '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-admin-secret'],
  optionsSuccessStatus: 200
}));

// Explicit Pre-flight handler
app.options('*', cors());

app.use(express.json());
app.use(morgan('dev'));

// Health Check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api', adminRoutes);

// Database Sync & Server Start
const startServer = async () => {
  try {
    // Check for critical environment variables
    if (!process.env.ADMIN_SECRET) {
      console.warn('⚠️ WARNING: ADMIN_SECRET is not set. Admin API is insecure!');
    }

    // Authenticate SaaS DB (Read-Only access recommended)
    await saasDB.authenticate();
    console.log('✅ Connected to SaaS Database');

    // Sync Admin DB (Write Access for Affiliates, Expenses, etc.)
    await adminDB.authenticate();
    await adminDB.sync({ alter: true });
    console.log('✅ Connected and Synced Admin Database');

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Developer Admin Control Center running on port ${PORT}`);
    });
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    process.exit(1);
  }
};

startServer();
