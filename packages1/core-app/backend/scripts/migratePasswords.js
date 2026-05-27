/**
 * Migration script to handle users without passwords
 * Run this after deploying the nullable password fix
 */

require('dotenv').config();
const bcrypt = require('bcryptjs');
const { sequelize, User } = require('../models');

const migratePasswords = async () => {
  try {
    console.log('Connecting to database...');
    await sequelize.authenticate();
    console.log('Database connected');

    // Find all users without passwords
    const usersWithoutPassword = await User.findAll({
      where: {
        password: null
      }
    });

    console.log(`Found ${usersWithoutPassword.length} users without passwords`);

    if (usersWithoutPassword.length === 0) {
      console.log('No migration needed');
      process.exit(0);
    }

    // Option 1: Set a random password and force reset (more secure)
    // Option 2: Set a default password based on email (for development)
    
    for (const user of usersWithoutPassword) {
      // Generate a default password from email (before @ symbol) + "123"
      const emailPrefix = user.email.split('@')[0];
      const defaultPassword = `${emailPrefix}123`;
      
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(defaultPassword, salt);
      
      await user.update({ password: hashedPassword });
      
      console.log(`Set password for ${user.email}: ${defaultPassword}`);
    }

    console.log('Migration completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
};

migratePasswords();
