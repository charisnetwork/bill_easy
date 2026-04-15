const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const bcrypt = require('bcryptjs');
const path = require('path');
const { adminDB, saasDB } = require('./config/db');
const { AdminUser } = require('./models/adminModels');
const adminRoutes = require('./routes/adminRoutes');

require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3025;

// Robust CORS Configuration for Admin Backend
const getAllowedOrigins = () => {
  if (process.env.ALLOWED_ORIGINS) {
    return process.env.ALLOWED_ORIGINS.split(',').map(url => url.trim());
  }
  
  const origins = [
    'http://localhost:3000',
    'http://localhost:3021',
    'http://localhost:5173',
    'http://localhost:8000'
  ];
  
  // Add Railway domain if available
  if (process.env.RAILWAY_PUBLIC_DOMAIN) {
    origins.push(`https://${process.env.RAILWAY_PUBLIC_DOMAIN}`);
  }
  
  return origins;
};

const allowedOrigins = getAllowedOrigins();

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    callback(new Error('Not allowed by CORS'));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-admin-secret'],
  credentials: true,
  preflightContinue: false,
  optionsSuccessStatus: 204
}));

app.use(express.json());
app.use(morgan('dev'));

// Health Check - accessible at /admin/api/health through gateway
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    service: 'admin-backend',
    timestamp: new Date().toISOString() 
  });
});

// Routes
app.use('/api', adminRoutes);

// Database Sync & Server Start
const startServer = async () => {
  try {
    // Authenticate SaaS DB (Read-Only access recommended)
    await saasDB.authenticate();
    console.log('✅ Connected to SaaS Database');

    // Sync Admin DB (Write Access for Affiliates, Expenses, etc.)
    await adminDB.authenticate();
    await adminDB.sync({ alter: true });
    console.log('✅ Connected and Synced Admin Database');

    // Seed Default Admin User
    await seedDefaultAdmin();

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Developer Admin Control Center running on port ${PORT}`);
    });
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    process.exit(1);
  }
};

// Seed Default Admin User
const seedDefaultAdmin = async () => {
  try {
    const defaultEmail = 'pachu.mgd@gmail.com';
    const defaultPassword = 'nishu@143';
    
    // Check if admin already exists
    const existingAdmin = await AdminUser.findOne({
      where: { email: defaultEmail }
    });
    
    if (!existingAdmin) {
      // Hash password
      const saltRounds = 10;
      const passwordHash = await bcrypt.hash(defaultPassword, saltRounds);
      
      // Create default admin
      await AdminUser.create({
        email: defaultEmail,
        password_hash: passwordHash,
        name: 'Pachu Admin',
        role: 'super_admin',
        is_active: true
      });
      
      console.log('✅ Default admin user created:', defaultEmail);
    } else {
      console.log('ℹ️ Admin user already exists:', defaultEmail);
    }
  } catch (error) {
    console.error('❌ Error seeding default admin:', error);
  }
};

startServer();
