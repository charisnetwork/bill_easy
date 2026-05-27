const express = require('express');
const router = express.Router();
const enquiryController = require('../controllers/enquiryController');

// POST /api/enquiries - Create a new enquiry
router.post('/', enquiryController.createEnquiry);

module.exports = router;
