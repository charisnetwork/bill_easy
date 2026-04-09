const { Plan, Subscription, Company, Coupon, PlanFeature, PlanPricing } = require('../models');
const Razorpay = require('razorpay');
const crypto = require('crypto');

let razorpay;
if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
  try {
    razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
  } catch (err) {
    console.error('❌ Failed to initialize Razorpay:', err.message);
  }
} else {
  console.warn('⚠️ Razorpay credentials missing. Payment features will be disabled.');
}

const validateCoupon = async (req, res) => {
  try {
    const { code, plan_id, duration_months } = req.body;
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

    // Get pricing for selected duration
    let basePrice = 0;
    if (duration_months) {
      const planPricing = await PlanPricing.findOne({
        where: { plan_id, duration_months, is_active: true }
      });
      if (planPricing) {
        basePrice = parseFloat(planPricing.price);
      } else {
        // Fallback to plan base price
        const plan = await Plan.findByPk(plan_id);
        if (!plan) return res.status(404).json({ error: 'Plan not found' });
        basePrice = parseFloat(plan.price) * duration_months;
      }
    } else {
      const plan = await Plan.findByPk(plan_id);
      if (!plan) return res.status(404).json({ error: 'Plan not found' });
      basePrice = parseFloat(plan.price);
    }

    let discount = 0;
    if (coupon.discount_type === 'percentage') {
      discount = (basePrice * parseFloat(coupon.discount_value)) / 100;
    } else {
      discount = parseFloat(coupon.discount_value);
    }

    const finalPrice = Math.max(0, basePrice - discount);

    res.json({
      message: 'Coupon validated',
      coupon_id: coupon.id,
      discount,
      finalPrice,
      basePrice
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
    const planPricing = await PlanPricing.findAll({
      where: { is_active: true },
      order: [['duration_months', 'ASC']]
    });

    const result = plans.map(plan => {
      const features = planFeatures.filter(pf => pf.plan_name === plan.plan_name);
      const pricing = planPricing.filter(pp => pp.plan_id === plan.id);
      return {
        ...plan.toJSON(),
        granular_features: features,
        pricing_options: pricing
      };
    });

    res.json(result);
  } catch (error) {
    console.error('Get plans error:', error);
    res.status(500).json({ error: 'Failed to get plans' });
  }
};

const getPlanPricing = async (req, res) => {
  try {
    const { plan_id } = req.params;
    const pricing = await PlanPricing.findAll({
      where: { plan_id, is_active: true },
      order: [['duration_months', 'ASC']]
    });
    res.json(pricing);
  } catch (error) {
    console.error('Get plan pricing error:', error);
    res.status(500).json({ error: 'Failed to get plan pricing' });
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
    const { plan_id, duration_months, payment_reference, coupon_id, order_id, signature, payment_id } = req.body;

    // Verify Razorpay signature if payment_id, order_id and signature are provided
    if (payment_id && order_id && signature) {
      if (!process.env.RAZORPAY_KEY_SECRET) {
        console.error('❌ RAZORPAY_KEY_SECRET is not set');
        return res.status(500).json({ error: 'Payment gateway not fully configured' });
      }

      const body = order_id + "|" + payment_id;
      const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(body.toString())
        .digest('hex');

      if (expectedSignature !== signature) {
        return res.status(400).json({ error: 'Invalid payment signature' });
      }
    }

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

    // Calculate base price based on duration
    let basePrice = 0;
    let selectedDuration = duration_months || 3; // Default to 3 months
    
    if (newPlan.plan_name === 'Free Account') {
      basePrice = 0;
      selectedDuration = null;
    } else if (duration_months) {
      // Check if custom pricing exists for this duration
      const planPricing = await PlanPricing.findOne({
        where: { plan_id, duration_months, is_active: true }
      });
      
      if (planPricing) {
        basePrice = parseFloat(planPricing.price);
      } else {
        // Calculate based on monthly price
        basePrice = parseFloat(newPlan.price) * duration_months;
      }
    } else {
      basePrice = parseFloat(newPlan.price);
    }

    // Apply coupon discount
    let finalPrice = basePrice;
    if (coupon_id) {
      const coupon = await Coupon.findByPk(coupon_id);
      if (coupon && coupon.is_active) {
        let discount = 0;
        if (coupon.discount_type === 'percentage') {
          discount = (basePrice * parseFloat(coupon.discount_value)) / 100;
        } else {
          discount = parseFloat(coupon.discount_value);
        }
        finalPrice = Math.max(0, basePrice - discount);
        
        // Increment usage
        await coupon.increment('usage_count');
      }
    }

    // Calculate new expiry date based on selected duration
    const startDate = new Date();
    let expiryDate = new Date();
    
    if (newPlan.plan_name === 'Free Account' || newPlan.billing_cycle === 'lifetime') {
      expiryDate = null; // No expiry
    } else if (selectedDuration) {
      expiryDate.setMonth(expiryDate.getMonth() + parseInt(selectedDuration));
    } else {
      // Fallback to default billing cycle
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
          expiryDate.setMonth(expiryDate.getMonth() + 3);
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
    const { plan_id, duration_months, coupon_id } = req.body;

    const plan = await Plan.findByPk(plan_id);
    if (!plan) {
      return res.status(404).json({ error: 'Plan not found' });
    }

    // Calculate base price based on duration
    let basePrice = 0;
    if (duration_months) {
      const planPricing = await PlanPricing.findOne({
        where: { plan_id, duration_months, is_active: true }
      });
      
      if (planPricing) {
        basePrice = parseFloat(planPricing.price);
      } else {
        basePrice = parseFloat(plan.price) * duration_months;
      }
    } else {
      basePrice = parseFloat(plan.price);
    }

    // Apply coupon discount
    let finalPrice = basePrice;
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
          discount = (basePrice * parseFloat(coupon.discount_value)) / 100;
        } else {
          discount = parseFloat(coupon.discount_value);
        }
        finalPrice = Math.max(0, basePrice - discount);
      }
    }

    if (finalPrice === 0) {
      return res.json({
        message: 'Free or discounted to zero, no payment needed',
        is_free: true
      });
    }

    const options = {
      amount: Math.round(finalPrice * 100), // convert to paise
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
      notes: {
        plan_id: plan.id,
        company_id: req.companyId,
        coupon_id: coupon_id || "",
        duration_months: duration_months || ""
      }
    };

    if (!razorpay) {
      return res.status(503).json({ error: 'Payment gateway not configured' });
    }

    const order = await razorpay.orders.create(options);


    res.json({
      message: 'Payment order created successfully',
      order,
      key_id: process.env.RAZORPAY_KEY_ID,
      finalPrice,
      basePrice
    });
  } catch (error) {
    console.error('Process payment error:', error);
    res.status(500).json({ error: 'Failed to create payment order' });
  }
};

// Admin: Create plan pricing
const createPlanPricing = async (req, res) => {
  try {
    const { plan_id, duration_months, duration_label, price, original_price, discount_percent, is_popular } = req.body;
    
    const discount_amount = original_price ? (original_price - price) : 0;
    
    const [pricing, created] = await PlanPricing.findOrCreate({
      where: { plan_id, duration_months },
      defaults: {
        duration_label,
        price,
        original_price: original_price || price,
        discount_percent: discount_percent || 0,
        discount_amount,
        is_popular: is_popular || false
      }
    });

    if (!created) {
      await pricing.update({
        duration_label,
        price,
        original_price: original_price || price,
        discount_percent: discount_percent || 0,
        discount_amount,
        is_popular: is_popular || false
      });
    }

    res.json({ message: 'Plan pricing saved successfully', pricing });
  } catch (error) {
    console.error('Create plan pricing error:', error);
    res.status(500).json({ error: 'Failed to create plan pricing' });
  }
};

// Admin: Get all plan pricing
const getAllPlanPricing = async (req, res) => {
  try {
    const pricing = await PlanPricing.findAll({
      include: [{ model: Plan, attributes: ['plan_name'] }],
      order: [['plan_id', 'ASC'], ['duration_months', 'ASC']]
    });
    res.json(pricing);
  } catch (error) {
    console.error('Get all plan pricing error:', error);
    res.status(500).json({ error: 'Failed to get plan pricing' });
  }
};

// Admin: Delete plan pricing
const deletePlanPricing = async (req, res) => {
  try {
    const { id } = req.params;
    await PlanPricing.destroy({ where: { id } });
    res.json({ message: 'Plan pricing deleted successfully' });
  } catch (error) {
    console.error('Delete plan pricing error:', error);
    res.status(500).json({ error: 'Failed to delete plan pricing' });
  }
};

module.exports = { 
  getPlans, 
  getPlanPricing,
  getCurrentSubscription, 
  upgradePlan, 
  cancelSubscription, 
  getUsage, 
  processPayment, 
  validateCoupon,
  createPlanPricing,
  getAllPlanPricing,
  deletePlanPricing
};
