const express = require('express');
const router = express.Router();
const enquiryController = require('../controllers/enquiryController');

// POST /api/enquiries - Create a new enquiry
router.post('/', enquiryController.createEnquiry);

// GET /api/enquiries/test-email - Test email configuration
router.get('/test-email', enquiryController.testEmailConfig);

module.exports = router;
