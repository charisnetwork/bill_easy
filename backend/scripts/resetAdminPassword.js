#!/usr/bin/env node
/**
 * Admin Password Reset Script
 * Usage: node resetAdminPassword.js <email> <new_password>
 * Or run without args to reset pachu.mgd@gmail.com with a default password
 */

const bcrypt = require('bcryptjs');
const { User } = require('../models');

const DEFAULT_ADMIN_EMAIL = 'pachu.mgd@gmail.com';
const DEFAULT_NEW_PASSWORD = 'Admin@123456';

async function resetPassword() {
  try {
    // Get email and password from command line args or use defaults
    const email = process.argv[2] || DEFAULT_ADMIN_EMAIL;
    const newPassword = process.argv[3] || DEFAULT_NEW_PASSWORD;

    console.log('🔍 Looking for user:', email);

    // Find the user
    const user = await User.findOne({ where: { email } });

    if (!user) {
      console.error('❌ User not found:', email);
      
      // List all owner users to help identify correct email
      console.log('\n📋 Available owner users:');
      const owners = await User.findAll({ 
        where: { role: 'owner' },
        attributes: ['id', 'email', 'name', 'role']
      });
      owners.forEach(u => {
        console.log(`  - ${u.email} (${u.name})`);
      });
      process.exit(1);
    }

    console.log('✅ User found:', user.email);
    console.log('   Name:', user.name);
    console.log('   Role:', user.role);

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await user.update({
      password: hashedPassword,
      reset_token: null,
      reset_token_expires_at: null,
      otp_code: null,
      otp_expires_at: null
    });

    console.log('\n✅ Password reset successful!');
    console.log('   Email:', email);
    console.log('   New Password:', newPassword);
    console.log('\n⚠️  Please change this password immediately after logging in.');

    process.exit(0);

  } catch (error) {
    console.error('❌ Error resetting password:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run the reset function
resetPassword();
