const express = require('express');
const router = express.Router();
const { getCustomers, getCustomer, createCustomer, updateCustomer, deleteCustomer, getCustomerLedger } = require('../controllers/customerController');
const { authenticateToken } = require('../middleware/auth');
const { customerValidation } = require('../middleware/validation');
const companyContext = require('../middleware/companyContext');

router.use(authenticateToken);
router.use(companyContext);

router.get('/', getCustomers);
router.get('/:id', getCustomer);
router.get('/:id/ledger', getCustomerLedger);
router.post('/', customerValidation, createCustomer);
router.put('/:id', customerValidation, updateCustomer);
router.delete('/:id', deleteCustomer);

module.exports = router;
