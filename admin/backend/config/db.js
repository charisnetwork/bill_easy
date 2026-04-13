const { Sequelize } = require('sequelize');
require('dotenv').config();

const isRailway = process.env.RAILWAY_ENVIRONMENT === 'production' || process.env.RAILWAY_PRIVATE_DOMAIN;

const sequelizeOptions = {
  dialect: 'postgres',
  logging: false,
  define: {
    freezeTableName: true,
    underscored: true,
    timestamps: true
  }
};

// Enable SSL only for Render hosting (not Railway)
if (process.env.DATABASE_URL?.includes('render.com')) {
  sequelizeOptions.dialectOptions = {
    ssl: {
      require: true,
      rejectUnauthorized: false
    }
  };
}

// Disable SSL for Railway internal connections
if (isRailway) {
  sequelizeOptions.dialectOptions = {
    ssl: false
  };
}

// Use environment variables with fallbacks for local development
// Both DBs use same connection (different schemas/tables)
const dbUrl = process.env.DATABASE_URL || 'postgres://pachu:nishu@localhost:5432/mybillbook';

const saasDB = new Sequelize(dbUrl, sequelizeOptions);

// Use DATABASE_URL_ADMIN if provided, otherwise use same as saasDB
const adminDB = process.env.DATABASE_URL_ADMIN 
  ? new Sequelize(process.env.DATABASE_URL_ADMIN, sequelizeOptions)
  : saasDB;

module.exports = { saasDB, adminDB };
