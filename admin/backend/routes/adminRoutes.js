const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { AdminUser } = require('../models/adminModels');
const analyticsController = require('../controllers/analyticsController');
const managementController = require('../controllers/managementController');

// Public login route (no auth required)
router.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }
    
    // Find admin user
    const admin = await AdminUser.findOne({
      where: { email, is_active: true }
    });
    
    if (!admin) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Verify password
    const isValidPassword = await bcrypt.compare(password, admin.password_hash);
    
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Update last login
    await admin.update({ last_login: new Date() });
    
    // Return admin secret for subsequent requests
    res.json({
      success: true,
      message: 'Login successful',
      adminSecret: process.env.ADMIN_SECRET,
      user: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        role: admin.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Developer-only simple auth middleware
const authMiddleware = (req, res, next) => {
  const secret = req.headers['x-admin-secret'];
  if (secret === process.env.ADMIN_SECRET) {
    return next();
  }
  return res.status(403).json({ error: "Unauthorized access" });
};

router.use(authMiddleware);

// Dashboard & Analytics
router.get('/dashboard/summary', analyticsController.getSummary);
router.get('/dashboard/revenue', analyticsController.getRevenueAnalytics);
router.get('/dashboard/subscribers', analyticsController.getSubscribers);

// Coupon Management
router.get('/coupons', managementController.getCoupons);
router.post('/coupons', managementController.createCoupon);
router.put('/coupons/:id', managementController.updateCoupon);
router.delete('/coupons/:id', managementController.deleteCoupon);

// Affiliate Management
router.get('/affiliates', managementController.getAffiliates);
router.post('/affiliates', managementController.createAffiliate);
router.delete('/affiliates/:id', managementController.deleteAffiliate);

// Coupon Detailed Analytics
router.get('/coupons/:id/analytics', analyticsController.getCouponAnalytics);

// Plan & Feature Management
router.get('/plans', managementController.getPlans);
router.get('/plans/with-pricing', managementController.getPlansWithPricing);
router.patch('/plans/update', managementController.updatePlanFeature);
router.patch('/plans/:id', managementController.updatePlan);

// Plan Pricing Management
router.get('/plan-pricing', managementController.getPlanPricing);
router.get('/plan-pricing/:plan_id', managementController.getPlanPricing);
router.post('/plan-pricing', managementController.createPlanPricing);
router.put('/plan-pricing/:id', managementController.updatePlanPricing);
router.delete('/plan-pricing/:id', managementController.deletePlanPricing);

module.exports = router;
