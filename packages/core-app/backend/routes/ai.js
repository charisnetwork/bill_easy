const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
const { authenticateToken } = require('../middleware/auth');
const companyContext = require('../middleware/companyContext');

router.post('/chat', authenticateToken, companyContext, aiController.chatWithAssistant);
router.post('/process-pdf', authenticateToken, companyContext, aiController.processPDFExtract);
router.get('/health', (req, res) => res.json({ status: 'ai service is up' }));

module.exports = router;
