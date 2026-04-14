const { Product, Category, StockMovement, Subscription, Godown, StockLevel, sequelize } = require('../models');
const { Op } = require('sequelize');
const SubscriptionGuard = require('../utils/subscriptionGuard');

const getProducts = async (req, res) => {
  try {
    const { search, category_id, low_stock, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const where = { company_id: req.companyId };

    if (search) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { sku: { [Op.iLike]: `%${search}%` } },
        { barcode: { [Op.iLike]: `%${search}%` } }
      ];
    }

    if (category_id) {
      where.category_id = category_id;
    }

    if (low_stock === 'true') {
      where.stock_quantity = { [Op.lte]: sequelize.col('low_stock_alert') };
    }

    const { count, rows } = await Product.findAndCountAll({
      where,
      include: [
        { model: Category, attributes: ['id', 'name'] },
        { model: StockLevel, include: [{ model: Godown, attributes: ['name'] }] }
      ],
      order: [['name', 'ASC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      products: rows,
      total: count,
      page: parseInt(page),
      totalPages: Math.ceil(count / limit)
    });

  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ error: 'Failed to get products' });
  }
};

const getProduct = async (req, res) => {
  try {

    const product = await Product.findOne({
      where: { id: req.params.id, company_id: req.companyId },
      include: [{ model: Category }]
    });

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json(product);

  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({ error: 'Failed to get product' });
  }
};

const createProduct = async (req, res) => {
  try {
    console.log('Create product request body:', req.body);
    let {
      name,
      sku,
      hsn_code,
      unit,
      gst_rate,
      purchase_price,
      sale_price,
      stock_quantity,
      low_stock_alert,
      barcode,
      description,
      category_id,
      type
    } = req.body;

    if (!type) type = 'product';

    // Parse numeric fields
    const parsedPurchasePrice = parseFloat(purchase_price) || 0;
    const parsedSalePrice = parseFloat(sale_price) || 0;
    const parsedStockQuantity = parseFloat(stock_quantity) || 0;
    const parsedLowStockAlert = parseFloat(low_stock_alert) || 10;
    const parsedGstRate = parseFloat(gst_rate);

    if (type === 'service') {
      unit = null;
      stock_quantity = 0;
      low_stock_alert = 0;

      if (parsedGstRate !== 0 && parsedGstRate !== 18) {
        gst_rate = 18;
      }
    }

    const product = await Product.create({
      company_id: req.companyId,
      category_id: (!category_id || category_id === 'none') ? null : category_id,
      name,
      sku,
      hsn_code,
      type,
      unit,
      gst_rate: isNaN(parsedGstRate) ? 18 : parsedGstRate,
      purchase_price: parsedPurchasePrice,
      sale_price: parsedSalePrice,
      stock_quantity: parsedStockQuantity,
      low_stock_alert: parsedLowStockAlert,
      barcode,
      description
    });

    const subscription = await Subscription.findOne({
      where: { company_id: req.companyId }
    });

    if (subscription) {
      const usage = { ... (subscription.usage || { invoices: 0, products: 0, eway_bills: 0, godowns: 0 }) };
      usage.products = (usage.products || 0) + 1;
      await subscription.update({ usage });
    }

    if (type === 'product' && stock_quantity && parseFloat(stock_quantity) > 0) {
      const defaultGodown = await Godown.findOne({
        where: { company_id: req.companyId, is_default: true }
      });
      
      const godownId = defaultGodown ? defaultGodown.id : null;

      if (godownId) {
        await StockLevel.create({
          company_id: req.companyId,
          product_id: product.id,
          godown_id: godownId,
          quantity: parseFloat(stock_quantity)
        });
      }

      await StockMovement.create({
        company_id: req.companyId,
        product_id: product.id,
        godown_id: godownId,
        type: 'in',
        quantity: stock_quantity,
        previous_stock: 0,
        new_stock: stock_quantity,
        reference_type: 'opening',
        notes: 'Opening stock'
      });
    }

    res.status(201).json({
      message: 'Product created successfully',
      product
    });

  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({ error: 'Failed to create product' });
  }
};

const updateProduct = async (req, res) => {
  try {
    console.log('Update product request body:', req.body);
    let {
      name,
      sku,
      hsn_code,
      unit,
      gst_rate,
      purchase_price,
      sale_price,
      low_stock_alert,
      barcode,
      description,
      category_id,
      type
    } = req.body;

    const product = await Product.findOne({
      where: { id: req.params.id, company_id: req.companyId }
    });

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    if (!type) type = product.type || 'product';

    // Parse numeric fields
    const parsedPurchasePrice = parseFloat(purchase_price) || 0;
    const parsedSalePrice = parseFloat(sale_price) || 0;
    const parsedLowStockAlert = parseFloat(low_stock_alert) || 0;
    const parsedGstRate = parseFloat(gst_rate);

    if (type === 'service') {
      unit = null;
      low_stock_alert = 0;

      if (parsedGstRate !== 0 && parsedGstRate !== 18) {
        gst_rate = 18;
      }
    }

    await product.update({
      name,
      sku,
      hsn_code,
      unit,
      gst_rate: isNaN(parsedGstRate) ? (product.gst_rate || 18) : parsedGstRate,
      purchase_price: parsedPurchasePrice,
      sale_price: parsedSalePrice,
      low_stock_alert: parsedLowStockAlert,
      barcode,
      description,
      category_id: (!category_id || category_id === 'none') ? null : category_id,
      type
    });

    res.json({
      message: 'Product updated successfully',
      product
    });

  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ error: 'Failed to update product' });
  }
};

const deleteProduct = async (req, res) => {
  try {

    const product = await Product.findOne({
      where: { id: req.params.id, company_id: req.companyId }
    });

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    await product.destroy();

    const subscription = await Subscription.findOne({
      where: { company_id: req.companyId }
    });

    if (subscription) {
      const usage = subscription.usage || {
        invoices: 0,
        products: 0,
        eway_bills: 0,
        godowns: 0
      };

      usage.products = Math.max(
        0,
        (usage.products || 0) - 1
      );

      await subscription.update({ usage });
    }

    res.json({ message: 'Product deleted successfully' });

  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ error: 'Failed to delete product' });
  }
};

const adjustStock = async (req, res) => {
  try {

    const { quantity, type, notes } = req.body;

    const product = await Product.findOne({
      where: { id: req.params.id, company_id: req.companyId }
    });

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const previousStock = parseFloat(product.stock_quantity);
    let newStock;

    if (type === 'in') {
      newStock = previousStock + parseFloat(quantity);
    } else if (type === 'out') {
      newStock = previousStock - parseFloat(quantity);

      if (newStock < 0) {
        return res.status(400).json({ error: 'Insufficient stock' });
      }

    } else {
      newStock = parseFloat(quantity);
    }

    await product.update({ stock_quantity: newStock });

    // Also update default godown stock if it exists
    const defaultGodown = await Godown.findOne({
      where: { company_id: req.companyId, is_default: true }
    });

    if (defaultGodown) {
      const [stockLevel] = await StockLevel.findOrCreate({
        where: { product_id: product.id, godown_id: defaultGodown.id },
        defaults: { company_id: req.companyId, quantity: 0 }
      });

      if (type === 'in') {
        await stockLevel.increment('quantity', { by: parseFloat(quantity) });
      } else if (type === 'out') {
        await stockLevel.decrement('quantity', { by: parseFloat(quantity) });
      } else {
        await stockLevel.update({ quantity: parseFloat(quantity) });
      }
    }

    await StockMovement.create({
      company_id: req.companyId,
      product_id: product.id,
      godown_id: defaultGodown ? defaultGodown.id : null,
      type: type === 'in' ? 'in' : type === 'out' ? 'out' : 'adjustment',
      quantity: Math.abs(parseFloat(quantity)),
      previous_stock: previousStock,
      new_stock: newStock,
      reference_type: 'manual',
      notes
    });

    res.json({
      message: 'Stock adjusted successfully',
      product: { ...product.toJSON(), stock_quantity: newStock }
    });

  } catch (error) {
    console.error('Adjust stock error:', error);
    res.status(500).json({ error: 'Failed to adjust stock' });
  }
};

const getStockMovements = async (req, res) => {
  try {

    const { startDate, endDate, type } = req.query;

    const where = {
      product_id: req.params.id
    };

    if (startDate && endDate) {
      where.created_at = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    }

    if (type) {
      where.type = type;
    }

    const movements = await StockMovement.findAll({
      where,
      order: [['created_at', 'DESC']]
    });

    res.json(movements);

  } catch (error) {
    console.error('Get stock movements error:', error);
    res.status(500).json({ error: 'Failed to get stock movements' });
  }
};

const getCategories = async (req, res) => {
  try {

    const categories = await Category.findAll({
      where: { company_id: req.companyId },
      order: [['name', 'ASC']]
    });

    res.json(categories);

  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ error: 'Failed to get categories' });
  }
};

const createCategory = async (req, res) => {
  try {
    let { name, description } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Category name is required' });
    }

    name = name.trim();

    // Case-insensitive check for existing category for this company
    const existing = await Category.findOne({
      where: {
        company_id: req.companyId,
        name: sequelize.where(
          sequelize.fn('LOWER', sequelize.col('name')),
          '=',
          name.toLowerCase()
        )
      }
    });

    if (existing) {
      return res.status(400).json({ error: 'Category already exists' });
    }

    const category = await Category.create({
      company_id: req.companyId,
      name,
      description
    });

    res.status(201).json({
      message: 'Category created successfully',
      category
    });

  } catch (error) {
    console.error('Create category error:', error);
    res.status(500).json({ error: 'Failed to create category' });
  }
};

const updateCategory = async (req, res) => {
  try {

    const { name, description } = req.body;

    const category = await Category.findOne({
      where: { id: req.params.id, company_id: req.companyId }
    });

    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    await category.update({ name, description });

    res.json({
      message: 'Category updated successfully',
      category
    });

  } catch (error) {
    console.error('Update category error:', error);
    res.status(500).json({ error: 'Failed to update category' });
  }
};

const deleteCategory = async (req, res) => {
  try {

    const category = await Category.findOne({
      where: { id: req.params.id, company_id: req.companyId }
    });

    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    const productCount = await Product.count({
      where: { category_id: category.id }
    });

    if (productCount > 0) {
      return res.status(400).json({
        error: 'Cannot delete category with existing products'
      });
    }

    await category.destroy();

    res.json({ message: 'Category deleted successfully' });

  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({ error: 'Failed to delete category' });
  }
};

const XLSX = require('xlsx');

const importProducts = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Please upload a file' });
    }

    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    
    // Get data as array of arrays to handle headers and empty rows strictly
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, blankrows: false });

    if (rows.length <= 1) {
      return res.status(400).json({ error: 'File is empty or contains only headers' });
    }

    const headers = rows[0].map(h => String(h || '').toLowerCase().trim());
    const dataRows = rows.slice(1);

    const companyId = req.companyId;
    const itemsToInsert = [];
    
    // Column Mapping Logic (Fuzzy/Multi-alias)
    const mappingSchema = {
      name: ['item name', 'product name', 'name', 'item', 'product', 'description'],
      hsn_code: ['hsn code', 'hsn', 'hsncode'],
      sale_price: ['sale price', 'selling price', 'mrp', 'rate', 'price'],
      purchase_price: ['purchase price', 'buy price', 'cost price', 'cost'],
      stock_quantity: ['opening stock', 'stock', 'quantity', 'qty'],
      gst_rate: ['gst %', 'gst', 'tax %', 'tax', 'gst rate'],
      category_name: ['category', 'group', 'type']
    };

    // Map header names to their indices
    const colMap = {};
    Object.keys(mappingSchema).forEach(key => {
      const index = headers.findIndex(h => mappingSchema[key].includes(h));
      if (index !== -1) colMap[key] = index;
    });

    // Fallback to fixed indices if some critical columns are missing
    if (colMap.name === undefined) colMap.name = 0; 

    // Cache categories to avoid constant DB queries
    const existingCategories = await Category.findAll({ where: { company_id: companyId } });
    const categoryCache = {};
    existingCategories.forEach(cat => {
      categoryCache[cat.name.toLowerCase().trim()] = cat.id;
    });

    for (const row of dataRows) {
      // 1. Skip if row is essentially empty
      if (!row || row.length === 0) continue;

      const itemName = row[colMap.name];
      
      // 2. Empty Row Filtering: Skip if Item Name is null or empty
      if (itemName === undefined || itemName === null || String(itemName).trim() === '') {
        continue;
      }

      let categoryId = null;
      if (colMap.category_name !== undefined) {
        const catName = String(row[colMap.category_name] || '').trim();
        if (catName) {
          const lowerCatName = catName.toLowerCase();
          if (categoryCache[lowerCatName]) {
            categoryId = categoryCache[lowerCatName];
          } else {
            // Auto-create category if it doesn't exist
            const newCat = await Category.create({ 
              company_id: companyId, 
              name: catName 
            }, { transaction });
            categoryId = newCat.id;
            categoryCache[lowerCatName] = categoryId;
          }
        }
      }

      const item = {
        company_id: companyId,
        type: 'product',
        unit: 'Units',
        name: String(itemName).trim(),
        category_id: categoryId,
        hsn_code: colMap.hsn_code !== undefined ? String(row[colMap.hsn_code] || '') : '',
        sale_price: colMap.sale_price !== undefined ? parseFloat(row[colMap.sale_price]) || 0 : 0,
        purchase_price: colMap.purchase_price !== undefined ? parseFloat(row[colMap.purchase_price]) || 0 : 0,
        stock_quantity: colMap.stock_quantity !== undefined ? parseFloat(row[colMap.stock_quantity]) || 0 : 0,
        gst_rate: colMap.gst_rate !== undefined ? parseFloat(row[colMap.gst_rate]) || 0 : 0,
        low_stock_alert: 10
      };

      itemsToInsert.push(item);
    }

    if (itemsToInsert.length > 0) {
      // Use bulkCreate within a transaction
      await Product.bulkCreate(itemsToInsert, { transaction });
    }

    await transaction.commit();

    res.json({ 
      message: `Successfully imported ${itemsToInsert.length} items.`,
      totalProcessed: dataRows.length,
      imported: itemsToInsert.length
    });

  } catch (error) {
    if (transaction) await transaction.rollback();
    console.error('Import products error:', error);
    res.status(500).json({ error: 'Failed to import products: ' + error.message });
  }
};

module.exports = {
  getProducts, getProduct, createProduct, updateProduct, deleteProduct,
  adjustStock, getStockMovements,
  getCategories, createCategory, updateCategory, deleteCategory,
  importProducts
};
