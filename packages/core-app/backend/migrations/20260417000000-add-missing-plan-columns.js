'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const tableInfo = await queryInterface.describeTable('plans');

    // Add max_users column if it doesn't exist
    if (!tableInfo.max_users) {
      await queryInterface.addColumn('plans', 'max_users', {
        type: Sequelize.INTEGER,
        defaultValue: 1
      });
    }

    // Add max_invoices_per_month column if it doesn't exist
    if (!tableInfo.max_invoices_per_month) {
      await queryInterface.addColumn('plans', 'max_invoices_per_month', {
        type: Sequelize.INTEGER,
        defaultValue: 100
      });
    }

    // Add max_products column if it doesn't exist
    if (!tableInfo.max_products) {
      await queryInterface.addColumn('plans', 'max_products', {
        type: Sequelize.INTEGER,
        defaultValue: 100
      });
    }

    // Add storage_limit column if it doesn't exist
    if (!tableInfo.storage_limit) {
      await queryInterface.addColumn('plans', 'storage_limit', {
        type: Sequelize.INTEGER,
        defaultValue: 100
      });
    }

    // Add features column if it doesn't exist
    if (!tableInfo.features) {
      await queryInterface.addColumn('plans', 'features', {
        type: Sequelize.JSON,
        defaultValue: {}
      });
    }

    // Add is_active column if it doesn't exist
    if (!tableInfo.is_active) {
      await queryInterface.addColumn('plans', 'is_active', {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      });
    }

    // Check if billing_cycle column exists, if not add it
    if (!tableInfo.billing_cycle) {
      await queryInterface.addColumn('plans', 'billing_cycle', {
        type: Sequelize.ENUM('monthly', '3month', '6month', 'yearly', 'lifetime'),
        defaultValue: 'monthly'
      });
    }

    console.log('Migration completed: Added missing columns to plans table');
  },

  async down(queryInterface, Sequelize) {
    // Remove the columns that were added
    const columnsToRemove = [
      'max_users',
      'max_invoices_per_month',
      'max_products',
      'storage_limit',
      'features',
      'is_active'
    ];

    for (const column of columnsToRemove) {
      try {
        await queryInterface.removeColumn('plans', column);
      } catch (error) {
        console.log(`Column ${column} may not exist, skipping...`);
      }
    }
  }
};
