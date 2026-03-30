const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const managementController = require('../controllers/managementController');

const jwt = require('jsonwebtoken');
const authController = require('../controllers/authController');

// Standard JWT auth middleware
const authMiddleware = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: "No token provided" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'admin_secret_key');
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ error: "Token invalid or expired" });
  }
};

// Public Auth Routes
router.post('/auth/login', authController.login);
router.post('/auth/request-otp', authController.requestOTP);
router.post('/auth/verify-login', authController.verifyOTPAndLogin);

// Protected Auth Routes
router.post('/auth/reset-password', authMiddleware, authController.resetPassword);

// Apply auth to all analytics and management routes
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
router.patch('/plans/update', managementController.updatePlanFeature);
router.patch('/plans/:id', managementController.updatePlan);

module.exports = router;
