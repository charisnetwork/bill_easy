const express = require('express');
const router = express.Router();
const {
  getDashboard,
  getSalesReport,
  getPurchaseReport,
  getExpenseReport,
  getProfitLossReport,
  getGSTReport,
  getCustomerOutstanding,
  getSupplierOutstanding,
  getStockReport
} = require('../controllers/reportController');
const { authenticateToken } = require('../middleware/auth');
const companyContext = require('../middleware/companyContext');

router.use(authenticateToken);
router.use(companyContext);

router.get('/dashboard', getDashboard);
router.get('/sales', getSalesReport);
router.get('/purchases', getPurchaseReport);
router.get('/expenses', getExpenseReport);
router.get('/profit-loss', getProfitLossReport);
router.get('/gst', getGSTReport);
router.get('/customer-outstanding', getCustomerOutstanding);
router.get('/supplier-outstanding', getSupplierOutstanding);
router.get('/stock', getStockReport);

module.exports = router;
