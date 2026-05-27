const express = require('express');
const router = express.Router();
const { getPayments, createPayment, deletePayment } = require('../controllers/paymentController');
const { authenticateToken } = require('../middleware/auth');
const companyContext = require('../middleware/companyContext');

router.use(authenticateToken);
router.use(companyContext);

router.get('/', getPayments);
router.post('/', createPayment);
router.delete('/:id', deletePayment);

module.exports = router;
