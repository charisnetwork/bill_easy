const express = require('express');
const router = express.Router();
const { 
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
} = require('../controllers/subscriptionController');
const { authenticateToken, requireRole } = require('../middleware/auth');
const companyContext = require('../middleware/companyContext');

router.get('/plans', getPlans);
router.get('/pricing/:plan_id', getPlanPricing);

router.use(authenticateToken);
router.use(companyContext);

router.get('/current', getCurrentSubscription);
router.get('/usage', getUsage);
router.post('/upgrade', requireRole('owner'), upgradePlan);
router.post('/cancel', requireRole('owner'), cancelSubscription);
router.post('/payment', requireRole('owner'), processPayment);
router.post('/validate-coupon', requireRole('owner'), validateCoupon);

// Admin routes for plan pricing
router.get('/admin/pricing', requireRole('owner'), getAllPlanPricing);
router.post('/admin/pricing', requireRole('owner'), createPlanPricing);
router.delete('/admin/pricing/:id', requireRole('owner'), deletePlanPricing);

module.exports = router;
