const { Plan, Subscription, Company, Coupon, PlanFeature } = require('../models');
const Razorpay = require('razorpay');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const validateCoupon = async (req, res) => {
  try {
    const { code, plan_id } = req.body;
    const coupon = await Coupon.findOne({ where: { code: code.toUpperCase(), is_active: true } });

    if (!coupon) {
      return res.status(404).json({ error: 'Invalid coupon code' });
    }

    if (coupon.expiry_date && new Date() > new Date(coupon.expiry_date)) {
      return res.status(400).json({ error: 'Coupon has expired' });
    }

    if (coupon.usage_count >= coupon.usage_limit) {
      return res.status(400).json({ error: 'Coupon usage limit reached' });
    }

    const plan = await Plan.findByPk(plan_id);
    if (!plan) {
      return res.status(404).json({ error: 'Plan not found' });
    }

    let discount = 0;
    if (coupon.discount_type === 'percentage') {
      discount = (parseFloat(plan.price) * parseFloat(coupon.discount_value)) / 100;
    } else {
      discount = parseFloat(coupon.discount_value);
    }

    const finalPrice = Math.max(0, parseFloat(plan.price) - discount);

    res.json({
      message: 'Coupon validated',
      coupon_id: coupon.id,
      discount,
      finalPrice
    });
  } catch (error) {
    console.error('Validate coupon error:', error);
    res.status(500).json({ error: 'Failed to validate coupon' });
  }
};

const getPlans = async (req, res) => {
  try {
    const plans = await Plan.findAll({
      where: { is_active: true },
      order: [['price', 'ASC']]
    });

    const planFeatures = await PlanFeature.findAll();

    const result = plans.map(plan => {
      const features = planFeatures.filter(pf => pf.plan_name === plan.plan_name);
      return {
        ...plan.toJSON(),
        granular_features: features
      };
    });

    res.json(result);
  } catch (error) {
    console.error('Get plans error:', error);
    res.status(500).json({ error: 'Failed to get plans' });
  }
};

const getCurrentSubscription = async (req, res) => {
  try {
    const subscription = await Subscription.findOne({
      where: { company_id: req.companyId },
      include: [{ model: Plan }]
    });

    if (!subscription) {
      return res.status(404).json({ error: 'No subscription found' });
    }

    res.json(subscription);
  } catch (error) {
    console.error('Get subscription error:', error);
    res.status(500).json({ error: 'Failed to get subscription' });
  }
};

const upgradePlan = async (req, res) => {
  try {
    const { plan_id, payment_reference, coupon_id } = req.body;

    const newPlan = await Plan.findByPk(plan_id);
    if (!newPlan) {
      return res.status(404).json({ error: 'Plan not found' });
    }

    const subscription = await Subscription.findOne({
      where: { company_id: req.companyId }
    });

    if (!subscription) {
      return res.status(404).json({ error: 'No subscription found' });
    }

    let finalPrice = parseFloat(newPlan.price);
    if (coupon_id) {
      const coupon = await Coupon.findByPk(coupon_id);
      if (coupon && coupon.is_active) {
        let discount = 0;
        if (coupon.discount_type === 'percentage') {
          discount = (finalPrice * parseFloat(coupon.discount_value)) / 100;
        } else {
          discount = parseFloat(coupon.discount_value);
        }
        finalPrice = Math.max(0, finalPrice - discount);
        
        // Increment usage
        await coupon.increment('usage_count');
      }
    }

    // Calculate new expiry date based on billing cycle
    const startDate = new Date();
    let expiryDate = new Date();
    
    if (newPlan.plan_name === 'Free Account' || newPlan.billing_cycle === 'lifetime') {
      expiryDate = null; // No expiry
    } else {
      switch (newPlan.billing_cycle) {
        case 'monthly':
          expiryDate.setMonth(expiryDate.getMonth() + 1);
          break;
        case '3month':
          expiryDate.setMonth(expiryDate.getMonth() + 3);
          break;
        case '6month':
          expiryDate.setMonth(expiryDate.getMonth() + 6);
          break;
        case 'yearly':
          expiryDate.setFullYear(expiryDate.getFullYear() + 1);
          break;
        default:
          expiryDate.setMonth(expiryDate.getMonth() + 3); // Fallback
      }
    }

    await subscription.update({
      plan_id: newPlan.id,
      coupon_id: coupon_id || null,
      price: finalPrice,
      start_date: startDate,
      expiry_date: expiryDate,
      status: 'active',
      payment_status: payment_reference ? 'paid' : 'pending'
    });

    const updatedSubscription = await Subscription.findOne({
      where: { company_id: req.companyId },
      include: [{ model: Plan }]
    });

    res.json({ 
      message: 'Plan upgraded successfully', 
      subscription: updatedSubscription 
    });
  } catch (error) {
    console.error('Upgrade plan error:', error);
    res.status(500).json({ error: 'Failed to upgrade plan' });
  }
};

const cancelSubscription = async (req, res) => {
  try {
    const subscription = await Subscription.findOne({
      where: { company_id: req.companyId }
    });

    if (!subscription) {
      return res.status(404).json({ error: 'No subscription found' });
    }

    await subscription.update({ status: 'cancelled' });
    res.json({ message: 'Subscription cancelled successfully' });
  } catch (error) {
    console.error('Cancel subscription error:', error);
    res.status(500).json({ error: 'Failed to cancel subscription' });
  }
};

const getUsage = async (req, res) => {
  try {
    const subscription = await Subscription.findOne({
      where: { company_id: req.companyId },
      include: [{ model: Plan }]
    });

    if (!subscription) {
      return res.status(404).json({ error: 'No subscription found' });
    }

    const usage = subscription.usage || {};
    const plan = subscription.Plan;

    res.json({
      invoices: {
        used: (usage.invoices || 0),
        limit: plan.max_invoices_per_month,
        percentage: (((usage.invoices || 0)) / plan.max_invoices_per_month) * 100
      },
      products: {
        used: (usage.products || 0),
        limit: plan.max_products,
        percentage: (((usage.products || 0)) / plan.max_products) * 100
      },
      users: {
        limit: plan.max_users
      },
      storage: {
        limit: plan.storage_limit
      }
    });
  } catch (error) {
    console.error('Get usage error:', error);
    res.status(500).json({ error: 'Failed to get usage' });
  }
};

// Razorpay payment endpoint
const processPayment = async (req, res) => {
  try {
    const { plan_id, coupon_id } = req.body;

    const plan = await Plan.findByPk(plan_id);
    if (!plan) {
      return res.status(404).json({ error: 'Plan not found' });
    }

    let finalPrice = parseFloat(plan.price);
    if (coupon_id) {
      const coupon = await Coupon.findByPk(coupon_id);
      if (coupon && coupon.is_active) {
        // Validate coupon again
        if (coupon.expiry_date && new Date() > new Date(coupon.expiry_date)) {
            return res.status(400).json({ error: 'Coupon has expired' });
        }
        if (coupon.usage_count >= coupon.usage_limit) {
            return res.status(400).json({ error: 'Coupon usage limit reached' });
        }

        let discount = 0;
        if (coupon.discount_type === 'percentage') {
          discount = (finalPrice * parseFloat(coupon.discount_value)) / 100;
        } else {
          discount = parseFloat(coupon.discount_value);
        }
        finalPrice = Math.max(0, finalPrice - discount);
      }
    }

    if (finalPrice === 0) {
      return res.json({
        message: 'Free or discounted to zero, no payment needed',
        is_free: true
      });
    }

    const options = {
      amount: Math.round(finalPrice * 100), // amount in the smallest currency unit
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
      notes: {
        plan_id: plan.id,
        company_id: req.companyId,
        coupon_id: coupon_id || ""
      }
    };

    const order = await razorpay.orders.create(options);

    res.json({
      message: 'Payment order created successfully',
      order,
      key_id: process.env.RAZORPAY_KEY_ID
    });
  } catch (error) {
    console.error('Process payment error:', error);
    res.status(500).json({ error: 'Failed to create payment order' });
  }
};

module.exports = { getPlans, getCurrentSubscription, upgradePlan, cancelSubscription, getUsage, processPayment, validateCoupon };
