/**
 * Migration: Fix invoice_number uniqueness from global to per-company
 *
 * The original schema has `invoice_number` as globally unique across all companies.
 * This breaks multi-tenant operation — company A's INV-1 blocks company B from also
 * having INV-1.
 *
 * This migration:
 * 1. Drops the old global unique constraint `invoices_invoice_number_key`
 * 2. Adds a compound unique constraint `invoices_number_company_unique` on
 *    (invoice_number, company_id) so each company has its own invoice number space.
 */

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // 1. Drop old global constraint if it still exists
    try {
      const [rows] = await queryInterface.sequelize.query(`
        SELECT constraint_name FROM information_schema.table_constraints
        WHERE table_name = 'invoices'
          AND constraint_name = 'invoices_invoice_number_key'
          AND constraint_type = 'UNIQUE'
      `);

      if (rows.length > 0) {
        console.log('[Migration] Dropping invoices_invoice_number_key (global)...');
        await queryInterface.sequelize.query(
          'ALTER TABLE invoices DROP CONSTRAINT invoices_invoice_number_key'
        );
        console.log('[Migration] Global constraint dropped.');
      } else {
        console.log('[Migration] invoices_invoice_number_key not found, skipping drop.');
      }
    } catch (err) {
      console.warn('[Migration] Error dropping old constraint (may not exist):', err.message);
    }

    // 2. Add compound unique constraint if not already present
    try {
      const [rows] = await queryInterface.sequelize.query(`
        SELECT constraint_name FROM information_schema.table_constraints
        WHERE table_name = 'invoices'
          AND constraint_name = 'invoices_number_company_unique'
          AND constraint_type = 'UNIQUE'
      `);

      if (rows.length === 0) {
        console.log('[Migration] Adding compound unique (invoice_number, company_id)...');
        await queryInterface.sequelize.query(`
          ALTER TABLE invoices
          ADD CONSTRAINT invoices_number_company_unique
          UNIQUE (invoice_number, company_id)
        `);
        console.log('[Migration] Compound constraint added. Each company now has its own invoice number space.');
      } else {
        console.log('[Migration] invoices_number_company_unique already exists, skipping.');
      }
    } catch (err) {
      console.error('[Migration] Error adding compound constraint:', err.message);
      throw err;
    }
  },

  down: async (queryInterface, Sequelize) => {
    // Revert: drop compound, restore global (not recommended)
    try {
      await queryInterface.sequelize.query(
        'ALTER TABLE invoices DROP CONSTRAINT IF EXISTS invoices_number_company_unique'
      );
      await queryInterface.sequelize.query(
        'ALTER TABLE invoices ADD CONSTRAINT invoices_invoice_number_key UNIQUE (invoice_number)'
      );
    } catch (err) {
      console.error('[Migration Rollback] Error:', err.message);
    }
  }
};
