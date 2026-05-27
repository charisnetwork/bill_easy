const { Godown, StockLevel, StockMovement, Product, Subscription, Plan, sequelize } = require('../models');

const getGodowns = async (req, res) => {
  try {
    const godowns = await Godown.findAll({
      where: { company_id: req.companyId, is_active: true }
    });
    res.json(godowns);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch godowns" });
  }
};

const createGodown = async (req, res) => {
  try {
    const { name, address } = req.body;

    const godown = await Godown.create({
      company_id: req.companyId,
      name,
      address,
      is_default: false
    });

    res.status(201).json(godown);
  } catch (error) {
    res.status(500).json({ error: "Failed to create godown" });
  }
};

const transferStock = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { product_id, from_godown_id, to_godown_id, quantity, notes } = req.body;
    const qty = parseFloat(quantity);

    if (from_godown_id === to_godown_id) {
      throw new Error("Source and destination godowns must be different");
    }

    // Check source stock
    const sourceStock = await StockLevel.findOne({
      where: { product_id, godown_id: from_godown_id, company_id: req.companyId },
      transaction
    });

    if (!sourceStock || parseFloat(sourceStock.quantity) < qty) {
      throw new Error("Insufficient stock in source godown");
    }

    // Deduct from source
    await sourceStock.decrement('quantity', { by: qty, transaction });

    // Add to destination
    const [destStock, created] = await StockLevel.findOrCreate({
      where: { product_id, godown_id: to_godown_id, company_id: req.companyId },
      defaults: { quantity: 0 },
      transaction
    });
    await destStock.increment('quantity', { by: qty, transaction });

    // Record movements
    await StockMovement.create({
      company_id: req.companyId,
      product_id,
      godown_id: from_godown_id,
      type: 'transfer',
      quantity: qty,
      notes: `Transfer Out: ${notes || ''}`
    }, { transaction });

    await StockMovement.create({
      company_id: req.companyId,
      product_id,
      godown_id: to_godown_id,
      type: 'transfer',
      quantity: qty,
      notes: `Transfer In: ${notes || ''}`
    }, { transaction });

    await transaction.commit();
    res.json({ message: "Stock transferred successfully" });
  } catch (error) {
    if (transaction) await transaction.rollback();
    res.status(500).json({ error: error.message || "Failed to transfer stock" });
  }
};

const deleteGodown = async (req, res) => {
  try {
    const { id } = req.params;
    const godown = await Godown.findOne({ 
      where: { id, company_id: req.companyId } 
    });

    if (!godown) {
      return res.status(404).json({ error: "Godown not found" });
    }

    if (godown.is_default) {
      return res.status(400).json({ error: "Cannot delete the default godown" });
    }

    // Check if there is any stock in this godown
    const stock = await StockLevel.findOne({
      where: { godown_id: id, quantity: { [sequelize.Sequelize.Op.gt]: 0 } }
    });

    if (stock) {
      return res.status(400).json({ error: "Cannot delete godown with existing stock. Please transfer stock first." });
    }

    await godown.destroy();
    res.json({ message: "Godown deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete godown" });
  }
};

const updateGodown = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, address, is_active } = req.body;
    
    const godown = await Godown.findOne({ 
      where: { id, company_id: req.companyId } 
    });

    if (!godown) {
      return res.status(404).json({ error: "Godown not found" });
    }

    await godown.update({ name, address, is_active });
    res.json({ message: "Godown updated successfully", godown });
  } catch (error) {
    res.status(500).json({ error: "Failed to update godown" });
  }
};

module.exports = {
  getGodowns,
  createGodown,
  updateGodown,
  deleteGodown,
  transferStock
};
