const express = require('express');
const router = express.Router();
const {
  getEWayBills,
  generateEWayBill,
  getEWayBillDetails,
  downloadEWayBillPdf
} = require('../controllers/ewayBillController');
const { authenticateToken, checkFeatureAccess } = require('../middleware/auth');
const companyContext = require('../middleware/companyContext');

router.use(authenticateToken);
router.use(companyContext);
router.use(checkFeatureAccess('eway_bills'));

router.get('/', getEWayBills);
router.get('/:id', getEWayBillDetails);
router.get('/:id/pdf', downloadEWayBillPdf);
router.post('/generate', generateEWayBill);

module.exports = router;
