const { 
  Company, 
  Subscription, 
  Plan, 
  PlanFeature,
  Invoice,
  User,
  Coupon
} = require('../../../backend/models');

const { Affiliate } = require('./adminModels');

// Ensure associations required by Admin Panel are present
// Many are already defined in backend/models/index.js, but we re-verify/add ones specific to Admin's view
if (!Company.hasAlias && !Company.associations.Subscriptions) {
  Company.hasMany(Subscription, { foreignKey: 'company_id' });
}
if (!Subscription.associations.Company) {
  Subscription.belongsTo(Company, { foreignKey: 'company_id' });
}
if (!Subscription.associations.Plan) {
  Subscription.belongsTo(Plan, { foreignKey: 'plan_id' });
}
if (!Subscription.associations.Coupon) {
  Subscription.belongsTo(Coupon, { foreignKey: 'coupon_id' });
}
if (!Coupon.associations.Subscriptions) {
  Coupon.hasMany(Subscription, { foreignKey: 'coupon_id' });
}

// Coupon - Affiliate Relationship (Cross-database / Cross-model linking)
// The backend Coupon might already have an Affiliate association, but here we might want to link it 
// to the Admin-managed Affiliate model if they are stored in the Admin DB.
// However, looking at backend/models/index.js, Affiliate is also defined there.
// If DATABASE_URL and DATABASE_URL_ADMIN are different, we must use the one from AdminModels.
Coupon.belongsTo(Affiliate, { foreignKey: 'affiliate_id', as: 'affiliate', constraints: false });
Affiliate.hasMany(Coupon, { foreignKey: 'affiliate_id', as: 'coupons', constraints: false });

module.exports = { 
  Company, 
  Subscription, 
  Plan, 
  PlanFeature,
  Invoice,
  User,
  Coupon
};
