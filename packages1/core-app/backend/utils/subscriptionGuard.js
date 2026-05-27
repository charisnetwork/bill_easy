const { Subscription, Plan, Invoice, Product, UserCompany, Godown } = require('../models');
const { Op } = require('sequelize');

const SubscriptionGuard = {
  /**
   * Core logic to check if a company can perform an action
   * @param {string} companyId - The UUID of the company
   * @param {string} actionType - The feature or action being requested
   * @returns {Promise<boolean>}
   */
  canPerformAction: async (companyId, actionType) => {
    try {
      let subscription = await Subscription.findOne({
        where: { company_id: companyId },
        include: [Plan]
      });

      if (!subscription) return false;

      // Global Expiry Check: If expired, downgrade to 'Free Account'
      if (subscription.expiry_date && new Date() > new Date(subscription.expiry_date) && subscription.Plan.plan_name !== 'Free Account') {
        const freePlan = await Plan.findOne({ where: { plan_name: 'Free Account' } });
        if (freePlan) {
          await subscription.update({
            plan_id: freePlan.id,
            status: 'active',
            expiry_date: null // Free account doesn't expire in this context
          });
          // Refresh subscription object
          subscription = await Subscription.findOne({
            where: { company_id: companyId },
            include: [Plan]
          });
        }
      }

      const plan = subscription.Plan;
      if (!plan) return false;
      
      const features = plan.features || {};
      const planName = plan.plan_name;

      switch (actionType) {
        case 'ADD_BUSINESS':
          // Tier 1: Max 1, Tier 2: Max 2, Tier 3: Max 10 (as per seed)
          const businessCount = await UserCompany.count({ 
            where: { 
              user_id: (await UserCompany.findOne({ where: { company_id: companyId } })).user_id,
              role: 'owner' 
            } 
          });
          const businessLimit = features.manage_businesses || 1;
          return businessCount < businessLimit;

        case 'CREATE_INVOICE':
          const startOfMonth = new Date();
          startOfMonth.setDate(1);
          startOfMonth.setHours(0, 0, 0, 0);
          const invoiceCount = await Invoice.count({
            where: { company_id: companyId, createdAt: { [Op.gte]: startOfMonth } }
          });
          const invLimit = plan.max_invoices_per_month || 50;
          return invoiceCount < invLimit;

        case 'ADD_PRODUCT':
          const productCount = await Product.count({ where: { company_id: companyId } });
          const prodLimit = plan.max_products || 100;
          return productCount < prodLimit;

        case 'EWAY_BILL':
          if (planName === 'Free Account') return false;
          if (planName === 'Premium') {
            // Limited E-way bill check (e.g., max 5 per month for Premium)
            const startOfM = new Date();
            startOfM.setDate(1);
            const ewayCount = await Invoice.count({
                where: { 
                    company_id: companyId, 
                    eway_bill_number: { [Op.ne]: null },
                    createdAt: { [Op.gte]: startOfM }
                }
            });
            return ewayCount < 5;
          }
          return features.eway_bills === true;

        case 'MULTI_GODOWN':
          return features.multi_godowns === true;

        case 'STAFF_MANAGEMENT':
          return features.staff_attendance_payroll === true;

        case 'USER_ACTIVITY_TRACKER':
          return features.user_activity_tracker === true;

        default:
          return !!features[actionType];
      }
    } catch (error) {
      // Error logged
      return false;
    }
  }
};

module.exports = SubscriptionGuard;
