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

async function renameColumn() {
  try {
    await sequelize.authenticate();
    console.log('Connected');

    // 1. Drop all constraints on coupons again to be sure
    const [constraints] = await sequelize.query(`
      SELECT conname FROM pg_constraint WHERE conrelid = 'coupons'::regclass AND contype = 'f';
    `);
    for (const c of constraints) {
      await sequelize.query(`ALTER TABLE "coupons" DROP CONSTRAINT IF EXISTS "${c.conname}"`);
    }

    // 2. Rename the column if it exists
    await sequelize.query(`ALTER TABLE "coupons" RENAME COLUMN "company_id" TO "affiliate_id"`).catch(err => console.log('Rename failed (maybe already renamed):', err.message));

    // 3. Add correct constraint
    await sequelize.query(`
      ALTER TABLE "coupons" 
      ADD CONSTRAINT "coupons_affiliate_id_fkey" 
      FOREIGN KEY ("affiliate_id") 
      REFERENCES "Affiliates"("id") 
      ON DELETE SET NULL 
      ON UPDATE CASCADE
    `);

    console.log('RENAME AND CONSTRAINT COMPLETED');
    process.exit(0);
  } catch (error) {
    console.error('FIX FAILED:', error);
    process.exit(1);
  }
}

renameColumn();
