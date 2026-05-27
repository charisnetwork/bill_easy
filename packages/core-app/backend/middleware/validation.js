const { body, validationResult } = require('express-validator');

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

const registerValidation = [
  body('companyName').trim().notEmpty().withMessage('Company name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('name').trim().notEmpty().withMessage('Name is required'),
  handleValidationErrors
];

const loginValidation = [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required'),
  handleValidationErrors
];

const customerValidation = [
  body('name').trim().notEmpty().withMessage('Customer name is required'),
  handleValidationErrors
];

const productValidation = [
  body('name').trim().notEmpty().withMessage('Product name is required'),
  body('purchase_price').isNumeric().withMessage('Purchase price must be a number'),
  body('sale_price').isNumeric().withMessage('Sale price must be a number'),
  body('stock_quantity').optional().isNumeric().withMessage('Stock quantity must be a number'),
  body('low_stock_alert').optional().isNumeric().withMessage('Low stock alert must be a number'),
  handleValidationErrors
];

const invoiceValidation = [
  body('customer_id').notEmpty().withMessage('Customer is required'),
  body('items').isArray({ min: 1 }).withMessage('At least one item is required'),
  handleValidationErrors
];

module.exports = {
  handleValidationErrors,
  registerValidation,
  loginValidation,
  customerValidation,
  productValidation,
  invoiceValidation
};
