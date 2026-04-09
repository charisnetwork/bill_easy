const { DataTypes } = require('sequelize');
const { saasDB } = require('../config/db');

const Company = saasDB.define('Company', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  name: { type: DataTypes.STRING },
  createdAt: { type: DataTypes.DATE }
}, { tableName: 'companies', timestamps: true });

const Plan = saasDB.define('Plan', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  plan_name: { type: DataTypes.STRING },
  price: { type: DataTypes.DECIMAL(10, 2) },
  billing_cycle: { type: DataTypes.ENUM('monthly','3month','6month','yearly','lifetime'), defaultValue: 'monthly' }
}, { tableName: 'plans' });

const PlanPricing = saasDB.define('PlanPricing', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  plan_id: { type: DataTypes.UUID, allowNull: false },
  duration_months: { type: DataTypes.INTEGER, allowNull: false },
  duration_label: { type: DataTypes.STRING, allowNull: false },
  price: { type: DataTypes.DECIMAL(10,2), allowNull: false },
  original_price: { type: DataTypes.DECIMAL(10,2), allowNull: false },
  discount_percent: { type: DataTypes.DECIMAL(5,2), defaultValue: 0 },
  discount_amount: { type: DataTypes.DECIMAL(10,2), defaultValue: 0 },
  is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
  is_popular: { type: DataTypes.BOOLEAN, defaultValue: false }
}, { tableName: 'plan_pricing' });

const PlanFeature = saasDB.define('PlanFeature', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  plan_name: { type: DataTypes.STRING, allowNull: false },
  feature_key: { type: DataTypes.STRING, allowNull: false },
  is_enabled: { type: DataTypes.BOOLEAN, defaultValue: false }
}, { tableName: 'plan_features' });

const Coupon = saasDB.define('Coupon', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  code: { type: DataTypes.STRING, allowNull: false, unique: true },
  discount_type: { type: DataTypes.ENUM('percentage', 'flat'), defaultValue: 'percentage' },
  discount_value: { type: DataTypes.DECIMAL(10,2), defaultValue: 0 },
  expiry_date: { type: DataTypes.DATE },
  usage_limit: { type: DataTypes.INTEGER, defaultValue: 100 },
  usage_count: { type: DataTypes.INTEGER, defaultValue: 0 },
  affiliate_id: { type: DataTypes.UUID, allowNull: true },
  is_active: { type: DataTypes.BOOLEAN, defaultValue: true }
}, { tableName: 'coupons' });

const Subscription = saasDB.define('Subscription', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  company_id: { type: DataTypes.UUID },
  plan_id: { type: DataTypes.UUID },
  coupon_id: { type: DataTypes.UUID, allowNull: true },
  price: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
  status: { type: DataTypes.ENUM('active', 'expired', 'cancelled', 'trial') },
  payment_status: { type: DataTypes.ENUM('paid', 'pending', 'failed') },
  start_date: { type: DataTypes.DATE },
  expiry_date: { type: DataTypes.DATE },
  createdAt: { type: DataTypes.DATE }
}, { tableName: 'subscriptions' });

const Invoice = saasDB.define('Invoice', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  total_amount: { type: DataTypes.DECIMAL(12, 2) },
  company_id: { type: DataTypes.UUID },
  createdAt: { type: DataTypes.DATE }
}, { tableName: 'invoices' });

const User = saasDB.define('User', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  name: { type: DataTypes.STRING },
  email: { type: DataTypes.STRING },
  phone: { type: DataTypes.STRING },
  company_id: { type: DataTypes.UUID },
  role: { type: DataTypes.ENUM('owner', 'admin', 'staff'), defaultValue: 'staff' }
}, { tableName: 'users' });

// Associations for Reporting
Company.hasMany(Subscription, { foreignKey: 'company_id' });
Subscription.belongsTo(Company, { foreignKey: 'company_id' });
Subscription.belongsTo(Plan, { foreignKey: 'plan_id' });
Subscription.belongsTo(Coupon, { foreignKey: 'coupon_id' });
Coupon.hasMany(Subscription, { foreignKey: 'coupon_id' });
Company.hasMany(User, { foreignKey: 'company_id' });

// Plan Pricing Associations
Plan.hasMany(PlanPricing, { foreignKey: 'plan_id' });
PlanPricing.belongsTo(Plan, { foreignKey: 'plan_id' });

// Coupon - Affiliate Relationship (Cross-database)
const { Affiliate } = require('./adminModels');
Coupon.belongsTo(Affiliate, { foreignKey: 'affiliate_id', as: 'affiliate', constraints: false });
Affiliate.hasMany(Coupon, { foreignKey: 'affiliate_id', as: 'coupons', constraints: false });

module.exports = { 
  Company, 
  Subscription, 
  Plan, 
  PlanFeature,
  PlanPricing,
  Invoice,
  User,
  Coupon
};
