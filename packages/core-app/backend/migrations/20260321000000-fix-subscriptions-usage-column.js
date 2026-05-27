'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Check if the usage column exists
    const tableInfo = await queryInterface.describeTable('subscriptions');
    
    if (tableInfo.usage) {
      // Change column if it exists to JSONB and update default value
      await queryInterface.changeColumn('subscriptions', 'usage', {
        type: Sequelize.JSONB,
        defaultValue: { invoices: 0, eway_bills: 0, godowns: 0, products: 0 }
      });
      
      // Update existing records to have the new structure if they are using the old one
      // This is a safety measure to ensure schema consistency
      await queryInterface.sequelize.query(`
        UPDATE "subscriptions" 
        SET "usage" = '{"invoices": 0, "eway_bills": 0, "godowns": 0, "products": 0}'::jsonb 
        WHERE "usage" IS NULL OR "usage"::text = '{}'::text OR "usage"->>'invoices' IS NULL;
      `);
    } else {
      // Add column if it doesn't exist
      await queryInterface.addColumn('subscriptions', 'usage', {
        type: Sequelize.JSONB,
        defaultValue: { invoices: 0, eway_bills: 0, godowns: 0, products: 0 }
      });
    }
  },

  async down(queryInterface, Sequelize) {
    // Reverting to previous state (JSON and old structure)
    await queryInterface.changeColumn('subscriptions', 'usage', {
      type: Sequelize.JSON,
      defaultValue: { invoices_this_month: 0, products_count: 0 }
    });
  }
};
