const express = require('express');
const router = express.Router();
const { getPlans, getCurrentSubscription, upgradePlan, cancelSubscription, getUsage, processPayment, validateCoupon } = require('../controllers/subscriptionController');
const { authenticateToken, requireRole } = require('../middleware/auth');
const companyContext = require('../middleware/companyContext');

router.get('/plans', getPlans);

router.use(authenticateToken);
router.use(companyContext);

router.get('/current', getCurrentSubscription);
router.get('/usage', getUsage);
router.post('/upgrade', requireRole('owner'), upgradePlan);
router.post('/cancel', requireRole('owner'), cancelSubscription);
router.post('/payment', requireRole('owner'), processPayment);
router.post('/validate-coupon', requireRole('owner'), validateCoupon);

module.exports = router;
