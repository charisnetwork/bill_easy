'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // 1. Check if column exists
    const tableInfo = await queryInterface.describeTable('plans');
    
    if (!tableInfo.price_per_month) {
      console.log('[Migration] Adding price_per_month column to plans table...');
      await queryInterface.addColumn('plans', 'price_per_month', {
        type: Sequelize.DECIMAL(10, 2),
        defaultValue: 0,
        allowNull: true
      });
      console.log('[Migration] Column added successfully.');

      // Set initial values based on plan_name
      await queryInterface.sequelize.query(`
        UPDATE plans SET price_per_month = 299 WHERE plan_name = 'Premium';
      `);
      await queryInterface.sequelize.query(`
        UPDATE plans SET price_per_month = 599 WHERE plan_name = 'Enterprise';
      `);
      console.log('[Migration] Initial price_per_month values set.');
    } else {
      console.log('[Migration] Column price_per_month already exists in plans table.');
    }
  },

  down: async (queryInterface, Sequelize) => {
    const tableInfo = await queryInterface.describeTable('plans');
    if (tableInfo.price_per_month) {
      await queryInterface.removeColumn('plans', 'price_per_month');
    }
  }
};
