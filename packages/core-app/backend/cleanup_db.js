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

async function dropBadColumn() {
  try {
    await sequelize.authenticate();
    console.log('Connected');

    // 1. Drop all constraints on coupons
    const [constraints] = await sequelize.query(`
      SELECT conname FROM pg_constraint WHERE conrelid = 'coupons'::regclass AND contype = 'f';
    `);
    for (const c of constraints) {
      console.log(`Dropping constraint: ${c.conname}`);
      await sequelize.query(`ALTER TABLE "coupons" DROP CONSTRAINT IF EXISTS "${c.conname}"`);
    }

    // 2. Drop the company_id column if it still exists
    await sequelize.query(`ALTER TABLE "coupons" DROP COLUMN IF EXISTS "company_id"`).catch(err => console.log('Drop column failed:', err.message));

    // 3. Ensure affiliate_id exists
    await sequelize.query(`ALTER TABLE "coupons" ADD COLUMN IF NOT EXISTS "affiliate_id" UUID`).catch(err => console.log('Add column failed:', err.message));

    // 4. Add correct constraint to Affiliates
    await sequelize.query(`
      ALTER TABLE "coupons" 
      ADD CONSTRAINT "coupons_affiliate_id_fkey" 
      FOREIGN KEY ("affiliate_id") 
      REFERENCES "Affiliates"("id") 
      ON DELETE SET NULL 
      ON UPDATE CASCADE
    `);

    console.log('CLEANUP COMPLETED');
    process.exit(0);
  } catch (error) {
    console.error('FIX FAILED:', error);
    process.exit(1);
  }
}

dropBadColumn();
