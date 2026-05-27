/**
 * Migration: Add Security Tables
 * - Add token_version to users table
 * - Create refresh_tokens table
 * - Create activity_logs table
 */

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const { DataTypes } = Sequelize;
    
    // 1. Add token_version to users table
    const userTableInfo = await queryInterface.describeTable('users');
    if (!userTableInfo.token_version) {
      await queryInterface.addColumn('users', 'token_version', {
        type: DataTypes.INTEGER,
        defaultValue: 1,
        allowNull: false
      });
    }
    
    // 2. Create refresh_tokens table
    const tables = await queryInterface.showAllTables();
    if (!tables.includes('refresh_tokens')) {
      await queryInterface.createTable('refresh_tokens', {
        id: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true
        },
        token_hash: {
          type: DataTypes.STRING(128),
          allowNull: false,
          unique: true
        },
        user_id: {
          type: DataTypes.UUID,
          allowNull: false,
          references: {
            model: 'users',
            key: 'id'
          },
          onDelete: 'CASCADE'
        },
        session_id: {
          type: DataTypes.STRING(64),
          allowNull: false
        },
        device_info: {
          type: DataTypes.JSON,
          defaultValue: {}
        },
        fingerprint: {
          type: DataTypes.STRING(64),
          allowNull: true
        },
        expires_at: {
          type: DataTypes.DATE,
          allowNull: false
        },
        created_at: {
          type: DataTypes.DATE,
          defaultValue: DataTypes.NOW
        },
        rotated_at: {
          type: DataTypes.DATE,
          defaultValue: DataTypes.NOW
        },
        used_at: {
          type: DataTypes.DATE,
          allowNull: true
        },
        revoked_at: {
          type: DataTypes.DATE,
          allowNull: true
        }
      });
      
      // Add indexes for refresh_tokens
      const checkAndAddIndex = async (tableName, columns) => {
        try {
          await queryInterface.addIndex(tableName, columns);
        } catch (error) {
          if (error.name === 'SequelizeDatabaseError' && error.message.includes('already exists')) {
             console.log(`Index on ${tableName} for columns ${columns.join(',')} already exists. Skipping.`);
          } else {
             throw error;
          }
        }
      };

      await checkAndAddIndex('refresh_tokens', ['token_hash']);
      await checkAndAddIndex('refresh_tokens', ['user_id']);
      await checkAndAddIndex('refresh_tokens', ['session_id']);
      await checkAndAddIndex('refresh_tokens', ['expires_at']);
      await checkAndAddIndex('refresh_tokens', ['revoked_at']);
    }
    
    // 3. Create activity_logs table
    if (!tables.includes('activity_logs')) {
      await queryInterface.createTable('activity_logs', {
        id: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true
        },
        user_id: {
          type: DataTypes.UUID,
          allowNull: true,
          references: {
            model: 'users',
            key: 'id'
          },
          onDelete: 'SET NULL'
        },
        company_id: {
          type: DataTypes.UUID,
          allowNull: true,
          references: {
            model: 'companies',
            key: 'id'
          },
          onDelete: 'SET NULL'
        },
        action: {
          type: DataTypes.STRING,
          allowNull: false
        },
        entity_type: {
          type: DataTypes.STRING,
          allowNull: true
        },
        entity_id: {
          type: DataTypes.STRING,
          allowNull: true
        },
        details: {
          type: DataTypes.JSON,
          defaultValue: {}
        },
        created_at: {
          type: DataTypes.DATE,
          defaultValue: DataTypes.NOW
        }
      });
      
      // Add indexes for activity_logs
      const checkAndAddIndex = async (tableName, columns) => {
        try {
          await queryInterface.addIndex(tableName, columns);
        } catch (error) {
          if (error.name === 'SequelizeDatabaseError' && error.message.includes('already exists')) {
             console.log(`Index on ${tableName} for columns ${columns.join(',')} already exists. Skipping.`);
          } else {
             throw error;
          }
        }
      };

      await checkAndAddIndex('activity_logs', ['user_id']);
      await checkAndAddIndex('activity_logs', ['company_id']);
      await checkAndAddIndex('activity_logs', ['action']);
      await checkAndAddIndex('activity_logs', ['created_at']);
    }
    
    console.log('✅ Security migration completed successfully');
  },
  
  down: async (queryInterface, Sequelize) => {
    // Reverse the migration
    await queryInterface.removeColumn('users', 'token_version');
    await queryInterface.dropTable('refresh_tokens');
    await queryInterface.dropTable('activity_logs');
    
    console.log('✅ Security migration rolled back');
  }
};
