#!/usr/bin/env node
/**
 * Generate SQL to reset Super Admin password (for direct DB execution)
 * Usage: node generateResetSQL.js [new_password] [email]
 */

const bcrypt = require('bcryptjs');

const DEFAULT_NEW_PASSWORD = 'Admin@2026';
const DEFAULT_EMAIL = 'pachu.mgd@gmail.com';

async function generateSQL() {
  try {
    const newPassword = process.argv[2] || DEFAULT_NEW_PASSWORD;
    const email = process.argv[3] || DEFAULT_EMAIL;

    // Hash password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    console.log('-- =====================================================');
    console.log('-- SUPER ADMIN PASSWORD RESET SQL');
    console.log('-- =====================================================');
    console.log('-- Run this in your ADMIN database (mybillbook_admin)');
    console.log('-- You can use: psql, pgAdmin, or Render SQL shell');
    console.log('');
    console.log('-- Update password for super admin:');
    console.log(`UPDATE "AdminUsers" SET `);
    console.log(`  password_hash = '${hashedPassword}',`);
    console.log(`  is_active = true,`);
    console.log(`  updated_at = NOW()`);
    console.log(`WHERE email = '${email}';`);
    console.log('');
    console.log('-- Alternative: Reset by ID (if you know the admin ID):');
    console.log(`-- UPDATE "AdminUsers" SET password_hash = '${hashedPassword}' WHERE id = 'YOUR-ADMIN-ID';`);
    console.log('');
    console.log('-- List all admin users:');
    console.log(`-- SELECT id, email, name, role, is_active FROM "AdminUsers";`);
    console.log('');
    console.log('-- =====================================================');
    console.log('-- LOGIN CREDENTIALS AFTER RESET:');
    console.log('-- =====================================================');
    console.log(`-- URL:      https://admin.charisbilleasy.store`);
    console.log(`-- Email:    ${email}`);
    console.log(`-- Password: ${newPassword}`);
    console.log('-- =====================================================');
    console.log('');
    console.log('⚠️  IMPORTANT: Change this password immediately after logging in!');

  } catch (error) {
    console.error('Error:', error.message);
  }
}

generateSQL();
