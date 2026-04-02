const { Sequelize } = require('sequelize');
require('dotenv').config();

const dialectOptions = {
  ssl: {
    require: true,
    rejectUnauthorized: false
  }
};

// Common configuration to match SaaS backend exactly
const commonConfig = {
  dialect: 'postgres',
  logging: false,
  define: {
    freezeTableName: true,
    underscored: true,
    timestamps: true
  },
  quoteIdentifiers: true,
  dialectOptions
};

// Main SaaS Database connection
// Prefer DATABASE_URL_SAAS if provided to ensure connection to the correct SaaS DB
const saasDB = new Sequelize(process.env.DATABASE_URL_SAAS || process.env.DATABASE_URL, commonConfig);

// Admin-specific Database connection
const adminDB = new Sequelize(process.env.DATABASE_URL_ADMIN || process.env.DATABASE_URL, commonConfig);

module.exports = { saasDB, adminDB };
