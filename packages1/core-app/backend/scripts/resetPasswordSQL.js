#!/usr/bin/env node
/**
 * Generate SQL to reset admin password (for direct DB execution)
 * This generates the SQL you can run directly in your database
 */

const bcrypt = require('bcryptjs');

const DEFAULT_NEW_PASSWORD = 'Admin@123456';

async function generateSQL() {
  try {
    const newPassword = process.argv[2] || DEFAULT_NEW_PASSWORD;
    const email = process.argv[3] || 'pachu.mgd@gmail.com';

    // Hash password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    console.log('-- SQL to reset admin password');
    console.log('-- Run this in your database (e.g., psql, pgAdmin, or Render SQL shell)');
    console.log('');
    console.log(`UPDATE "Users" SET `);
    console.log(`  password = '${hashedPassword}',`);
    console.log(`  reset_token = NULL,`);
    console.log(`  reset_token_expires_at = NULL,`);
    console.log(`  otp_code = NULL,`);
    console.log(`  otp_expires_at = NULL`);
    console.log(`WHERE email = '${email}';`);
    console.log('');
    console.log(`-- Alternative: Reset by user ID if you know it`);
    console.log(`-- UPDATE "Users" SET password = '${hashedPassword}' WHERE id = 'YOUR-USER-ID';`);
    console.log('');
    console.log('-- After running the SQL, login with:');
    console.log(`-- Email: ${email}`);
    console.log(`-- Password: ${newPassword}`);

  } catch (error) {
    console.error('Error:', error.message);
  }
}

generateSQL();
