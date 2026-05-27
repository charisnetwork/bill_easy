#!/usr/bin/env node
/**
 * Standalone migration runner for Railway deployment
 * This script runs all migrations in the migrations folder
 */

require('dotenv').config();
const { sequelize } = require('./models');

const runMigrations = async () => {
  try {
    console.log('Starting database migrations...');
    
    // Get database connection
    await sequelize.authenticate();
    console.log('Database connected');
    
    const queryInterface = sequelize.getQueryInterface();
    const { DataTypes } = require('sequelize');
    
    // ============================================
    // Migration: Add missing columns to plans table
    // ============================================
    console.log('Running migration: add-missing-plan-columns');
    
    const tableInfo = await queryInterface.describeTable('plans');
    
    // Add max_users column if it doesn't exist
    if (!tableInfo.max_users) {
      console.log('  - Adding max_users column');
      await queryInterface.addColumn('plans', 'max_users', {
        type: DataTypes.INTEGER,
        defaultValue: 1
      });
    }
    
    // Add max_invoices_per_month column if it doesn't exist
    if (!tableInfo.max_invoices_per_month) {
      console.log('  - Adding max_invoices_per_month column');
      await queryInterface.addColumn('plans', 'max_invoices_per_month', {
        type: DataTypes.INTEGER,
        defaultValue: 100
      });
    }
    
    // Add max_products column if it doesn't exist
    if (!tableInfo.max_products) {
      console.log('  - Adding max_products column');
      await queryInterface.addColumn('plans', 'max_products', {
        type: DataTypes.INTEGER,
        defaultValue: 100
      });
    }
    
    // Add storage_limit column if it doesn't exist
    if (!tableInfo.storage_limit) {
      console.log('  - Adding storage_limit column');
      await queryInterface.addColumn('plans', 'storage_limit', {
        type: DataTypes.INTEGER,
        defaultValue: 100
      });
    }
    
    // Add features column if it doesn't exist
    if (!tableInfo.features) {
      console.log('  - Adding features column');
      await queryInterface.addColumn('plans', 'features', {
        type: DataTypes.JSON,
        defaultValue: {}
      });
    }
    
    // Add is_active column if it doesn't exist
    if (!tableInfo.is_active) {
      console.log('  - Adding is_active column');
      await queryInterface.addColumn('plans', 'is_active', {
        type: DataTypes.BOOLEAN,
        defaultValue: true
      });
    }
    
    // Check if billing_cycle column exists, if not add it
    if (!tableInfo.billing_cycle) {
      console.log('  - Adding billing_cycle column');
      await queryInterface.addColumn('plans', 'billing_cycle', {
        type: DataTypes.ENUM('monthly', '3month', '6month', 'yearly', 'lifetime'),
        defaultValue: 'monthly'
      });
    }
    
    console.log('Migration completed: Added missing columns to plans table');
    
    // ============================================
    // Migration: Fix subscriptions usage column (if needed)
    // ============================================
    console.log('Running migration: fix-subscriptions-usage-column');
    
    const subTableInfo = await queryInterface.describeTable('subscriptions');
    
    if (subTableInfo.usage) {
      console.log('  - Usage column exists, updating to JSONB');
      await queryInterface.changeColumn('subscriptions', 'usage', {
        type: DataTypes.JSONB,
        defaultValue: { invoices: 0, eway_bills: 0, godowns: 0, products: 0 }
      });
      
      // Update existing records
      await sequelize.query(`
        UPDATE "subscriptions" 
        SET "usage" = '{"invoices": 0, "eway_bills": 0, "godowns": 0, "products": 0}'::jsonb 
        WHERE "usage" IS NULL OR "usage"::text = '{}'::text OR "usage"->>'invoices' IS NULL;
      `);
    } else {
      console.log('  - Adding usage column');
      await queryInterface.addColumn('subscriptions', 'usage', {
        type: DataTypes.JSONB,
        defaultValue: { invoices: 0, eway_bills: 0, godowns: 0, products: 0 }
      });
    }
    
    console.log('Migration completed: Fixed subscriptions usage column');
    
    console.log('\n✅ All migrations completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
};

runMigrations();
