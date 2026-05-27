const express = require('express');
const router = express.Router();
const {
  getQuotations,
  getQuotation,
  createQuotation,
  updateQuotation,
  deleteQuotation,
  downloadQuotationPdf
} = require('../controllers/quotationController');
const { authenticateToken } = require('../middleware/auth');
const companyContext = require('../middleware/companyContext');

router.use(authenticateToken);
router.use(companyContext);

router.get('/', getQuotations);
router.get('/next-number', require('../controllers/quotationController').getNextQuotationNumber);
router.get('/:id', getQuotation);
router.get('/:id/pdf', downloadQuotationPdf);
router.post('/', createQuotation);
router.put('/:id', updateQuotation);
router.delete('/:id', deleteQuotation);

module.exports = router;
