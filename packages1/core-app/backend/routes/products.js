const express = require('express');
const router = express.Router();
const {
  getProducts, getProduct, createProduct, updateProduct, deleteProduct,
  adjustStock, getStockMovements,
  getCategories, createCategory, updateCategory, deleteCategory,
  importProducts
} = require('../controllers/productController');
const { authenticateToken, checkSubscriptionQuota } = require('../middleware/auth');
const { productValidation } = require('../middleware/validation');
const { uploadImportFile } = require('../services/uploadService');
const companyContext = require('../middleware/companyContext');

router.use(authenticateToken);
router.use(companyContext);

// Categories
router.get('/categories', getCategories);
router.post('/categories', createCategory);
router.put('/categories/:id', updateCategory);
router.delete('/categories/:id', deleteCategory);

// Products
router.get('/', getProducts);
router.get('/:id', getProduct);
router.get('/:id/movements', getStockMovements);
router.post('/', checkSubscriptionQuota('products'), productValidation, createProduct);
router.post('/import', uploadImportFile.single('file'), importProducts);
router.put('/:id', productValidation, updateProduct);
router.delete('/:id', deleteProduct);
router.post('/:id/stock', adjustStock);

module.exports = router;
