#!/usr/bin/env node
/**
 * Super Admin Password Reset Script for Admin Control Center
 * Usage: node resetSuperAdminPassword.js [email] [new_password]
 * 
 * This script connects to the admin database (mybillbook_admin) and resets
 * the password for the super admin user.
 */

const bcrypt = require('bcryptjs');
const { adminDB } = require('../config/db');
const { AdminUser } = require('../models/adminModels');

const DEFAULT_ADMIN_EMAIL = 'pachu.mgd@gmail.com';
const DEFAULT_NEW_PASSWORD = 'Admin@2026';

async function resetSuperAdminPassword() {
  try {
    // Get email and password from command line args or use defaults
    const email = process.argv[2] || DEFAULT_ADMIN_EMAIL;
    const newPassword = process.argv[3] || DEFAULT_NEW_PASSWORD;

    console.log('🔐 Super Admin Password Reset');
    console.log('================================');
    console.log('');
    console.log('🔍 Connecting to Admin Database...');

    // Test database connection
    await adminDB.authenticate();
    console.log('✅ Connected to Admin Database');
    console.log('');

    // Find the admin user
    console.log(`🔍 Looking for admin: ${email}`);
    const admin = await AdminUser.findOne({ where: { email } });

    if (!admin) {
      console.error('❌ Admin user not found:', email);
      console.log('');
      
      // List all admin users
      console.log('📋 Available admin users:');
      const admins = await AdminUser.findAll({
        attributes: ['id', 'email', 'name', 'role', 'is_active']
      });
      
      if (admins.length === 0) {
        console.log('   No admin users found. Creating default admin...');
        
        // Create default admin
        const hashedPassword = await bcrypt.hash(DEFAULT_NEW_PASSWORD, 10);
        await AdminUser.create({
          email: DEFAULT_ADMIN_EMAIL,
          password_hash: hashedPassword,
          name: 'Super Admin',
          role: 'super_admin',
          is_active: true
        });
        
        console.log('✅ Default admin created!');
        console.log('   Email:', DEFAULT_ADMIN_EMAIL);
        console.log('   Password:', DEFAULT_NEW_PASSWORD);
        console.log('');
        console.log('⚠️  Please change this password immediately after logging in.');
        
        process.exit(0);
      }
      
      admins.forEach(a => {
        console.log(`  - ${a.email} (${a.name}) [${a.role}] ${a.is_active ? '' : '(INACTIVE)'}`);
      });
      
      process.exit(1);
    }

    console.log('✅ Admin user found:', admin.email);
    console.log('   Name:', admin.name);
    console.log('   Role:', admin.role);
    console.log('   Status:', admin.is_active ? 'Active' : 'Inactive');
    console.log('');

    // Hash new password
    console.log('🔒 Hashing new password...');
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    console.log('💾 Updating password in database...');
    await admin.update({
      password_hash: hashedPassword,
      is_active: true
    });

    console.log('');
    console.log('✅ Password reset successful!');
    console.log('================================');
    console.log('   Email:', email);
    console.log('   New Password:', newPassword);
    console.log('');
    console.log('🌐 Login URL: https://admin.charisbilleasy.store');
    console.log('');
    console.log('⚠️  IMPORTANT: Change this password immediately after logging in!');
    console.log('');

    process.exit(0);

  } catch (error) {
    console.error('');
    console.error('❌ Error resetting password:', error.message);
    console.error('');
    
    if (error.message.includes('connect')) {
      console.error('💡 Database connection failed. Check:');
      console.error('   1. DATABASE_URL_ADMIN environment variable is set correctly');
      console.error('   2. PostgreSQL server is running');
      console.error('   3. Network access to database is allowed');
    }
    
    process.exit(1);
  }
}

// Run the reset function
resetSuperAdminPassword();
