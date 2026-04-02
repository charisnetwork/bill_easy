const { Sequelize } = require('sequelize');
require('dotenv').config();

const dialectOptions = {
  ssl: {
    require: true,
    rejectUnauthorized: false
  }
};

// Main SaaS Database connection for Analytics and Coupons
const saasDB = new Sequelize(process.env.DATABASE_URL || process.env.DATABASE_URL_SaaS, {
  dialect: 'postgres',
  logging: false,
  define: {
    freezeTableName: true,
    underscored: true,
    timestamps: true
  },
  dialectOptions
});

// Admin-specific Database connection for Affiliates, Admin Users, etc.
// If DATABASE_URL_ADMIN is not set, it fallbacks to the same DB but a separate instance to avoid model leakage
const adminDB = new Sequelize(process.env.DATABASE_URL_ADMIN || process.env.DATABASE_URL, {
  dialect: 'postgres',
  logging: false,
  define: {
    freezeTableName: true,
    underscored: true,
    timestamps: true
  },
  dialectOptions
});

module.exports = { saasDB, adminDB };
