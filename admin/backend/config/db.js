const { Sequelize } = require('sequelize');
const path = require('path');

// Load .env file from the project root or current directory
require('dotenv').config({ path: path.join(__dirname, '../.env') });
require('dotenv').config(); // Also try default location

const sequelizeOptions = {
  dialect: 'postgres',
  logging: false,
  define: {
    freezeTableName: true,
    underscored: true,
    timestamps: true
  }
};

// Log environment for debugging (remove in production)
if (process.env.NODE_ENV !== 'production') {
  console.log('[DB Config] Environment check:', {
    DATABASE_URL_SaaS: process.env.DATABASE_URL_SaaS ? 'Set' : 'Not set',
    DATABASE_URL_ADMIN: process.env.DATABASE_URL_ADMIN ? 'Set' : 'Not set',
    DATABASE_URL: process.env.DATABASE_URL ? 'Set' : 'Not set',
    NODE_ENV: process.env.NODE_ENV
  });
}

const saasUrl = process.env.DATABASE_URL_SaaS || process.env.DATABASE_URL;
const adminUrl = process.env.DATABASE_URL_ADMIN || process.env.DATABASE_URL;

// Add SSL for cloud hosting if DATABASE_URL is present
if (saasUrl?.includes('railway') || adminUrl?.includes('railway') || 
    saasUrl?.includes('render') || adminUrl?.includes('render')) {
  sequelizeOptions.dialectOptions = {
    ssl: {
      require: true,
      rejectUnauthorized: false
    }
  };
}

if (!saasUrl) {
  console.error('[DB Config] Missing environment variables. Required: DATABASE_URL_SaaS or DATABASE_URL');
  console.error('[DB Config] Available env vars:', Object.keys(process.env).filter(k => k.includes('DATABASE')));
  throw new Error('DATABASE_URL_SaaS or DATABASE_URL is missing in environment variables');
}

if (!adminUrl) {
  console.error('[DB Config] Missing environment variables. Required: DATABASE_URL_ADMIN or DATABASE_URL');
  throw new Error('DATABASE_URL_ADMIN or DATABASE_URL is missing in environment variables');
}

const saasDB = new Sequelize(saasUrl, sequelizeOptions);

const adminDB = new Sequelize(adminUrl, sequelizeOptions);

module.exports = { saasDB, adminDB };
