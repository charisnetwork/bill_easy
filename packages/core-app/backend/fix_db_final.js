const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(
  process.env.DB_NAME || 'mybillbook',
  process.env.DB_USER || 'postgres',
  process.env.DB_PASS || 'nishu',
  {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: console.log,
    define: {
      freezeTableName: true,
      underscored: true,
      timestamps: true
    },
    quoteIdentifiers: false
  }
);

async function fixAll() {
  try {
    await sequelize.authenticate();
    console.log('Connected to DB');

    // 1. Fix PLANS Table
    console.log('--- Fixing plans table ---');
    await sequelize.query(`
      DO $$ BEGIN
        CREATE TYPE "enum_plans_billing_cycle" AS ENUM('monthly', '3month', 'yearly', 'lifetime');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);
    
    const planCols = [
      { name: 'billing_cycle', type: '"enum_plans_billing_cycle"', default: "'monthly'" },
      { name: 'max_users', type: 'INTEGER', default: '1' },
      { name: 'max_invoices_per_month', type: 'INTEGER', default: '100' },
      { name: 'max_products', type: 'INTEGER', default: '100' },
      { name: 'storage_limit', type: 'INTEGER', default: '100' },
      { name: 'features', type: 'JSON', default: "'{}'" },
      { name: 'is_active', type: 'BOOLEAN', default: 'true' }
    ];

    for (const col of planCols) {
      await sequelize.query(`ALTER TABLE "plans" ADD COLUMN IF NOT EXISTS "${col.name}" ${col.type} DEFAULT ${col.default}`);
    }

    // 2. Fix USERS Table
    console.log('--- Fixing users table ---');
    await sequelize.query(`
      DO $$ BEGIN
        CREATE TYPE "enum_users_role" AS ENUM('owner', 'admin', 'staff');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    const userCols = [
      { name: 'password', type: 'VARCHAR(255)', default: 'NULL' },
      { name: 'permissions', type: 'JSON', default: "'{}'" },
      { name: 'is_active', type: 'BOOLEAN', default: 'true' },
      { name: 'email_verified', type: 'BOOLEAN', default: 'false' },
      { name: 'last_login', type: 'TIMESTAMP WITH TIME ZONE', default: 'NULL' },
      { name: 'role', type: '"enum_users_role"', default: "'staff'" }
    ];

    for (const col of userCols) {
      if (col.name === 'role') {
         // Special handling for role if it exists as string
         await sequelize.query(`ALTER TABLE "users" ALTER COLUMN "role" DROP DEFAULT`).catch(() => {});
         await sequelize.query(`ALTER TABLE "users" ALTER COLUMN "role" TYPE "enum_users_role" USING ("role"::"enum_users_role")`).catch(async () => {
            console.log('Role conversion failed, ensuring column exists as enum');
            await sequelize.query(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "role" "enum_users_role" DEFAULT 'staff'`).catch(() => {});
         });
         await sequelize.query(`ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'staff'`);
      } else {
         await sequelize.query(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "${col.name}" ${col.type} DEFAULT ${col.default}`);
      }
    }

    // 3. Fix COMPANIES Table
    console.log('--- Fixing companies table ---');
    const compCols = [
      { name: 'gst_number', type: 'VARCHAR(255)', default: 'NULL' },
      { name: 'address', type: 'TEXT', default: 'NULL' },
      { name: 'city', type: 'VARCHAR(255)', default: 'NULL' },
      { name: 'state', type: 'VARCHAR(255)', default: 'NULL' },
      { name: 'pincode', type: 'VARCHAR(255)', default: 'NULL' },
      { name: 'phone', type: 'VARCHAR(255)', default: 'NULL' },
      { name: 'email', type: 'VARCHAR(255)', default: 'NULL' },
      { name: 'logo', type: 'VARCHAR(255)', default: 'NULL' },
      { name: 'signature', type: 'VARCHAR(255)', default: 'NULL' },
      { name: 'tagline', type: 'VARCHAR(255)', default: 'NULL' },
      { name: 'business_category', type: 'VARCHAR(255)', default: "'General Store'" },
      { name: 'invoice_prefix', type: 'VARCHAR(255)', default: "'INV'" },
      { name: 'currency', type: 'VARCHAR(255)', default: "'INR'" },
      { name: 'financial_year_start', type: 'INTEGER', default: '4' },
      { name: 'settings', type: 'JSON', default: "'{\"invoice_template\": \"modern\"}'" }
    ];

    for (const col of compCols) {
      await sequelize.query(`ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "${col.name}" ${col.type} DEFAULT ${col.default}`);
    }

    // 4. Fix SUBSCRIPTIONS Table
    console.log('--- Fixing subscriptions table ---');
    await sequelize.query(`ALTER TABLE "subscriptions" ADD COLUMN IF NOT EXISTS "usage" JSONB DEFAULT '{"invoices": 0, "eway_bills": 0, "godowns": 0, "products": 0}'`);

    console.log('ALL FIXES COMPLETED');
    process.exit(0);
  } catch (error) {
    console.error('FIX FAILED:', error);
    process.exit(1);
  }
}

fixAll();
