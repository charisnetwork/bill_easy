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
  }
);

async function fixCouponsTable() {
  try {
    await sequelize.authenticate();
    console.log('Connected to DB');

    // 1. Get all constraints on the coupons table
    const [constraints] = await sequelize.query(`
      SELECT conname 
      FROM pg_constraint 
      WHERE conrelid = 'coupons'::regclass 
      AND contype = 'f';
    `);
    
    console.log('Found constraints:', constraints);

    // 2. Drop all existing foreign keys on coupons
    for (const c of constraints) {
      console.log(`Dropping constraint: ${c.conname}`);
      await sequelize.query(`ALTER TABLE "coupons" DROP CONSTRAINT IF EXISTS "${c.conname}"`);
    }

    // 3. Ensure Affiliates table exists (it should, but let's be safe)
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS "Affiliates" (
        "id" UUID PRIMARY KEY,
        "company_name" VARCHAR(255) NOT NULL,
        "contact_person" VARCHAR(255) NOT NULL,
        "email" VARCHAR(255) NOT NULL,
        "mobile_no" VARCHAR(255) NOT NULL,
        "status" VARCHAR(50) DEFAULT 'active',
        "created_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 4. Add the correct constraint pointing to Affiliates
    await sequelize.query(`
      ALTER TABLE "coupons" 
      ADD CONSTRAINT "coupons_affiliate_id_fkey" 
      FOREIGN KEY ("company_id") 
      REFERENCES "Affiliates"("id") 
      ON DELETE SET NULL 
      ON UPDATE CASCADE
    `);
    console.log('Added correct constraint to Affiliates');

    console.log('COUPONS FIX COMPLETED');
    process.exit(0);
  } catch (error) {
    console.error('FIX FAILED:', error);
    process.exit(1);
  }
}

fixCouponsTable();
