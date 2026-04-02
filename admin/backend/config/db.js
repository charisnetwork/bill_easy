const { Sequelize } = require('sequelize');
const saasSequelize = require('../../../backend/config/database');
require('dotenv').config();

const dialectOptions = {
  ssl: {
    require: true,
    rejectUnauthorized: false
  }
};

const saasDB = saasSequelize;

let adminDB;
const saasUrl = process.env.DATABASE_URL || process.env.DATABASE_URL_SaaS;
const adminUrl = process.env.DATABASE_URL_ADMIN || process.env.DATABASE_URL;

// If they are the same URL, reuse the connection instance
if (adminUrl === saasUrl) {
  adminDB = saasSequelize;
} else {
  adminDB = new Sequelize(adminUrl, {
    dialect: 'postgres',
    logging: false,
    define: {
      freezeTableName: true,
      underscored: true,
      timestamps: true
    },
    dialectOptions
  });
}

module.exports = { saasDB, adminDB };
