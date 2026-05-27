const express = require('express');
const router = express.Router();
const companyController = require('../controllers/companyController');
const godownController = require('../controllers/godownController');
const { authenticateToken, checkFeatureAccess } = require('../middleware/auth');
const companyContext = require('../middleware/companyContext');
const { uploadLogo, uploadSignature, uploadQRCode } = require('../services/uploadService');

router.use(authenticateToken);
router.use(companyContext);

// Company Profile
router.get('/', companyController.getCompany);
router.put('/', companyController.updateCompany);
router.patch('/settings', companyController.updateSettings);
router.post('/add-business', companyController.addCompany);
router.post('/customize-invoice', companyController.updateInvoiceCustomization);

// Assets
router.post('/upload-logo', uploadLogo.single('logo'), companyController.uploadLogo);
router.post('/upload-signature', uploadSignature.single('signature'), companyController.uploadSignature);
router.post('/upload-qr', uploadQRCode.single('qr_code'), companyController.uploadQRCode);

// User Management
router.get('/users', companyController.getUsers);
router.post('/users', companyController.addUser);
router.put('/users/:id', companyController.updateUser);
router.delete('/users/:id', companyController.deleteUser);

// Godowns
router.get('/godowns', godownController.getGodowns);
router.post('/godowns', checkFeatureAccess('multi_godowns'), godownController.createGodown);
router.put('/godowns/:id', checkFeatureAccess('multi_godowns'), godownController.updateGodown);
router.delete('/godowns/:id', checkFeatureAccess('multi_godowns'), godownController.deleteGodown);
router.post('/stock-transfer', godownController.transferStock);

module.exports = router;
