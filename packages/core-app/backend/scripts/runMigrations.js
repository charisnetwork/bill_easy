/**
 * Run Database Migrations
 * Executes migration files in order
 */

const fs = require('fs');
const path = require('path');
const { sequelize } = require('../models');

const runMigrations = async () => {
  try {
    console.log('🔄 Running database migrations...');
    
    // Check if migrations table exists
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS _migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) UNIQUE NOT NULL,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Get executed migrations
    const [executed] = await sequelize.query('SELECT name FROM _migrations');
    const executedNames = executed.map(e => e.name);
    
    // Get migration files
    const migrationsDir = path.join(__dirname, '..', 'migrations');
    if (!fs.existsSync(migrationsDir)) {
      console.log('✅ No migrations directory found, skipping');
      return;
    }
    
    const files = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith('.js'))
      .sort();
    
    for (const file of files) {
      if (executedNames.includes(file)) {
        console.log(`⏭️  Migration ${file} already executed`);
        continue;
      }
      
      console.log(`📝 Running migration: ${file}`);
      const migration = require(path.join(migrationsDir, file));
      
      await migration.up(sequelize.getQueryInterface(), sequelize.Sequelize);
      
      // Record migration
      await sequelize.query(
        'INSERT INTO _migrations (name) VALUES (?)',
        { replacements: [file] }
      );
      
      console.log(`✅ Migration ${file} completed`);
    }
    
    console.log('✅ All migrations completed successfully');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
};

// Run if called directly
if (require.main === module) {
  runMigrations()
    .then(() => {
      console.log('Migrations done');
      process.exit(0);
    })
    .catch(err => {
      console.error('Migration error:', err);
      process.exit(1);
    });
}

module.exports = runMigrations;
