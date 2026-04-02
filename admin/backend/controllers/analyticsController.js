const { 
  Company, 
  Subscription, 
  Plan, 
  Invoice,
  User,
  Coupon
} = require('../models/saasModels');
const { Affiliate } = require('../models/adminModels');
const { Op, fn, col } = require('sequelize');

// GET /admin/dashboard/summary
exports.getSummary = async (req, res) => {
  try {
    const totalSubscribers = await Subscription.count({ where: { status: 'active' } });
    const totalRevenue = await Subscription.sum('price', { where: { payment_status: 'paid' } }) || 0;
    
    // Group by plan type
    const plans = await Plan.findAll();
    const planCounts = await Promise.all(plans.map(async (plan) => {
      const count = await Subscription.count({ 
        where: { plan_id: plan.id, status: 'active' } 
      });
      return { plan_name: plan.plan_name, count };
    }));

    res.json({
      totalSubscribers,
      totalRevenue,
      planCounts
    });
  } catch (error) {
    console.error("Summary Error:", error);
    res.status(500).json({ error: "Failed to fetch summary: " + error.message });
  }
};

// GET /admin/dashboard/revenue?type=weekly|monthly
exports.getRevenueAnalytics = async (req, res) => {
  try {
    const { type } = req.query;
    let results;

    // Use camelCase 'createdAt' - Sequelize with underscored:true maps it to 'created_at'
    if (type === 'weekly') {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      results = await Subscription.findAll({
        attributes: [
          [fn('date', col('created_at')), 'date'],
          [fn('sum', col('price')), 'revenue']
        ],
        where: {
          payment_status: 'paid',
          createdAt: { [Op.gte]: sevenDaysAgo }
        },
        group: [fn('date', col('created_at'))],
        order: [[fn('date', col('created_at')), 'ASC']]
      });
    } else {
      // Monthly
      results = await Subscription.findAll({
        attributes: [
          [fn('date_trunc', 'month', col('created_at')), 'month'],
          [fn('sum', col('price')), 'revenue']
        ],
        where: { payment_status: 'paid' },
        group: [fn('date_trunc', 'month', col('created_at'))],
        order: [[fn('date_trunc', 'month', col('created_at')), 'ASC']]
      });
    }

    res.json(results);
  } catch (error) {
    console.error("Revenue Analytics Error:", error);
    res.status(500).json({ error: "Failed to fetch revenue analytics: " + error.message });
  }
};

// GET /admin/dashboard/subscribers
exports.getSubscribers = async (req, res) => {
  try {
    // Use camelCase 'createdAt' for ordering
    const subscriptions = await Subscription.findAll({
      order: [['createdAt', 'DESC']]
    });

    const detailedSubscribers = await Promise.all(subscriptions.map(async (sub) => {
      const plan = sub.plan_id ? await Plan.findByPk(sub.plan_id) : null;
      const company = sub.company_id ? await Company.findByPk(sub.company_id) : null;
      const coupon = sub.coupon_id ? await Coupon.findByPk(sub.coupon_id) : null;

      const subData = sub.toJSON();
      return {
        ...subData,
        createdAt: subData.createdAt || subData.created_at, // Robust mapping
        Plan: plan,
        Company: company,
        Coupon: coupon
      };
    }));

    res.json(detailedSubscribers);
  } catch (error) {
    console.error("Subscribers Error:", error);
    res.status(500).json({ error: "Failed to fetch subscribers: " + error.message });
  }
};

// GET /admin/coupons/:id/analytics
exports.getCouponAnalytics = async (req, res) => {
  try {
    const { id } = req.params;
    const coupon = await Coupon.findByPk(id);
    if (!coupon) return res.status(404).json({ error: "Coupon not found" });

    let affiliate = null;
    if (coupon.affiliate_id) {
        affiliate = await Affiliate.findByPk(coupon.affiliate_id);
    }

    const usageCount = await Subscription.count({ where: { coupon_id: id } });
    const totalRevenue = await Subscription.sum('price', { 
      where: { coupon_id: id, payment_status: 'paid' } 
    }) || 0;

    const subscriptions = await Subscription.findAll({
      where: { coupon_id: id },
      order: [['createdAt', 'DESC']]
    });

    const detailedUsers = await Promise.all(subscriptions.map(async (sub) => {
        const company = sub.company_id ? await Company.findByPk(sub.company_id) : null;
        const plan = sub.plan_id ? await Plan.findByPk(sub.plan_id) : null;
        const subData = sub.toJSON();
        return {
            ...subData,
            createdAt: subData.createdAt || subData.created_at,
            Company: company,
            Plan: plan
        };
    }));

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const weeklyPerformance = await Subscription.findAll({
      attributes: [
        [fn('date', col('created_at')), 'date'],
        [fn('count', col('id')), 'count'],
        [fn('sum', col('price')), 'revenue']
      ],
      where: {
        coupon_id: id,
        createdAt: { [Op.gte]: sevenDaysAgo }
      },
      group: [fn('date', col('created_at'))],
      order: [[fn('date', col('created_at')), 'ASC']]
    });

    res.json({
      coupon: { ...coupon.toJSON(), affiliate },
      usageCount,
      totalRevenue,
      users: detailedUsers,
      weeklyPerformance
    });
  } catch (error) {
    console.error("Coupon Analytics Error:", error);
    res.status(500).json({ error: "Failed to fetch coupon analytics: " + error.message });
  }
};
