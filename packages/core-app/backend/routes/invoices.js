const express = require('express');
const router = express.Router();

const {
  getInvoices,
  getInvoice,
  createInvoice,
  updateInvoice,
  getNextInvoiceNumber,
  downloadInvoicePdf,
  bulkDownloadInvoices,
  generateEWayBill,
  deleteInvoice,
  recordPayment
} = require('../controllers/invoiceController');

const { authenticateToken, checkSubscriptionQuota, checkFeatureAccess } = require('../middleware/auth');
const { invoiceValidation } = require('../middleware/validation');
const companyContext = require('../middleware/companyContext');

router.use(authenticateToken);
router.use(companyContext);

/*
--------------------------------
LIST INVOICES
--------------------------------
*/

router.get('/', getInvoices);

/*
--------------------------------
INVOICE NUMBER
--------------------------------
*/

router.get('/next-number', getNextInvoiceNumber);

/*
--------------------------------
GET SINGLE INVOICE
--------------------------------
*/

router.get('/:id', getInvoice);

/*
--------------------------------
CREATE INVOICE
--------------------------------
*/

router.post(
  '/',
  checkSubscriptionQuota('invoices'),
  invoiceValidation,
  createInvoice
);

/*
--------------------------------
UPDATE INVOICE
--------------------------------
*/

router.put('/:id', invoiceValidation, updateInvoice);

/*
--------------------------------
DOWNLOAD PDF
--------------------------------
*/

router.get('/:id/pdf', downloadInvoicePdf);

/*
--------------------------------
BULK DOWNLOAD
--------------------------------
*/

router.post('/bulk-download', checkFeatureAccess('bulk_download_print_invoices'), bulkDownloadInvoices);

/*
--------------------------------
E-WAY BILL
--------------------------------
*/

router.post('/:id/eway-bill', checkFeatureAccess('eway_bills'), generateEWayBill);

/*
--------------------------------
PAYMENT
--------------------------------
*/

router.post('/:id/payment', recordPayment);

/*
--------------------------------
DELETE INVOICE
--------------------------------
*/

router.delete('/:id', deleteInvoice);

module.exports = router;
