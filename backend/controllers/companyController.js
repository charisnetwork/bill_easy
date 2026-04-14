const { Company, User, Subscription, Plan, UserCompany, Godown } = require("../models");
const bcrypt = require("bcryptjs");


/* =========================================================
   GET COMPANY DETAILS
========================================================= */

const getCompany = async (req, res) => {
  try {

    const company = await Company.findByPk(req.companyId, {
      include: [
        {
          model: User,
          attributes: ["id", "name", "email", "role", "is_active"]
        }
      ]
    });

    res.json(company);

  } catch (error) {

    console.error("Get company error:", error);

    res.status(500).json({
      error: "Failed to get company"
    });

  }
};


/* =========================================================
   UPDATE COMPANY
========================================================= */

const updateCompany = async (req, res) => {
  try {
    const {
      name,
      gst_number,
      address,
      city,
      state,
      pincode,
      phone,
      email,
      tagline,
      business_category,
      invoice_prefix,
      currency,
      bank_name,
      account_number,
      ifsc_code,
      branch_name,
      terms_conditions,
      settings
    } = req.body;

    const company = await Company.findByPk(req.companyId);
    if (!company) {
      return res.status(404).json({ error: "Company not found" });
    }

    // Merge settings instead of overwriting
    const newSettings = {
      ...(company.settings || {}),
      ...(settings || {})
    };

    await company.update({
      name,
      gst_number,
      address,
      city,
      state,
      pincode,
      phone,
      email,
      tagline,
      business_category,
      invoice_prefix,
      currency,
      bank_name,
      account_number,
      ifsc_code,
      branch_name,
      terms_conditions,
      settings: newSettings
    });

    const updatedCompany = await Company.findByPk(req.companyId);

    res.json({
      message: "Company updated successfully",
      company: updatedCompany
    });

  } catch (error) {
    console.error("Update company error:", error);
    res.status(500).json({ error: "Failed to update company" });
  }
};


/* =========================================================
   UPDATE COMPANY SETTINGS (PATCH)
========================================================= */

const updateSettings = async (req, res) => {
  try {
    const { settings, gst_number, gst_registered, enable_tds, enable_tcs } = req.body;
    
    const company = await Company.findByPk(req.companyId);
    if (!company) {
      return res.status(404).json({ error: "Company not found" });
    }

    const newSettings = {
      ...(company.settings || {}),
      ...(settings || {})
    };

    const updateData = { settings: newSettings };
    
    // Handle top-level fields
    if (gst_registered !== undefined) updateData.gst_registered = gst_registered;
    if (enable_tds !== undefined) updateData.enable_tds = enable_tds;
    if (enable_tcs !== undefined) updateData.enable_tcs = enable_tcs;
    
    if (gst_registered === false) {
      updateData.gst_number = "";
    } else if (gst_number !== undefined) {
      updateData.gst_number = gst_number;
    }

    await company.update(updateData);
    const updatedCompany = await Company.findByPk(req.companyId);

    res.json({
      message: "Settings updated successfully",
      company: updatedCompany
    });

  } catch (error) {
    console.error("Update settings error:", error);
    res.status(500).json({ error: "Failed to update settings" });
  }
};


/* =========================================================
   UPLOAD COMPANY LOGO
========================================================= */

const uploadLogo = async (req, res) => {

  try {

    const companyId = req.companyId;

    const logoPath = `/company/logos/${req.file.filename}`;

    await Company.update(
      { logo: logoPath },
      { where: { id: companyId } }
    );

    res.json({
      success: true,
      logo: logoPath
    });

  } catch (err) {

    console.error(err);

    res.status(500).json({
      error: "Logo upload failed"
    });

  }

};


/* =========================================================
   UPLOAD COMPANY SIGNATURE
========================================================= */

const uploadSignature = async (req, res) => {

  try {

    const companyId = req.companyId;

    const signaturePath = `/company/signatures/${req.file.filename}`;

    await Company.update(
      { signature: signaturePath },
      { where: { id: companyId } }
    );

    res.json({
      success: true,
      signature: signaturePath
    });

  } catch (err) {

    console.error(err);

    res.status(500).json({
      error: "Signature upload failed"
    });

  }

};


/* =========================================================
   UPLOAD COMPANY QR CODE
========================================================= */

const uploadQRCode = async (req, res) => {
  try {
    const companyId = req.companyId;
    const qrCodePath = `/company/qrcodes/${req.file.filename}`;
    await Company.update(
      { qr_code: qrCodePath },
      { where: { id: companyId } }
    );
    res.json({
      success: true,
      qr_code: qrCodePath
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: "QR Code upload failed"
    });
  }
};


/* =========================================================
   GET COMPANY USERS
========================================================= */

const getUsers = async (req, res) => {

  try {

    const users = await User.findAll({
      where: { company_id: req.companyId },
      attributes: [
        "id",
        "name",
        "email",
        "phone",
        "role",
        "permissions",
        "is_active",
        "last_login",
        "created_at"
      ]
    });

    res.json(users);

  } catch (error) {

    console.error("Get users error:", error);

    res.status(500).json({
      error: "Failed to get users"
    });

  }

};


/* =========================================================
   ADD USER
========================================================= */

const addUser = async (req, res) => {

  try {

    const { name, email, password, phone, role, permissions } = req.body;

    const existingUser = await User.findOne({
      where: { email }
    });

    if (existingUser) {
      return res.status(400).json({
        error: "Email already exists"
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      company_id: req.companyId,
      name,
      email,
      password: hashedPassword,
      phone,
      role: role || "staff",
      permissions: permissions || {}
    });

    res.status(201).json({
      message: "User added successfully",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {

    console.error("Add user error:", error);

    res.status(500).json({
      error: "Failed to add user"
    });

  }

};


/* =========================================================
   UPDATE USER
========================================================= */

const updateUser = async (req, res) => {

  try {

    const { id } = req.params;

    const { name, phone, role, permissions, is_active } = req.body;

    const user = await User.findOne({
      where: {
        id,
        company_id: req.companyId
      }
    });

    if (!user) {
      return res.status(404).json({
        error: "User not found"
      });
    }

    await user.update({
      name,
      phone,
      role,
      permissions,
      is_active
    });

    res.json({
      message: "User updated successfully"
    });

  } catch (error) {

    console.error("Update user error:", error);

    res.status(500).json({
      error: "Failed to update user"
    });

  }

};


/* =========================================================
   DELETE USER
========================================================= */

const deleteUser = async (req, res) => {

  try {

    const { id } = req.params;

    if (id === req.user.id) {

      return res.status(400).json({
        error: "Cannot delete your own account"
      });

    }

    const user = await User.findOne({
      where: {
        id,
        company_id: req.companyId
      }
    });

    if (!user) {

      return res.status(404).json({
        error: "User not found"
      });

    }

    if (user.role === "owner") {

      return res.status(400).json({
        error: "Cannot delete owner account"
      });

    }

    await user.destroy();

    res.json({
      message: "User deleted successfully"
    });

  } catch (error) {

    console.error("Delete user error:", error);

    res.status(500).json({
      error: "Failed to delete user"
    });

  }

};

/* =========================================================
   ADD ADDITIONAL BUSINESS (PLAN RESTRICTED)
========================================================= */

const addCompany = async (req, res) => {
  try {
    const { name, gst_number, address, city, state, pincode, phone, email } = req.body;
    
    // 1. Count existing businesses owned by this user
    const userCompanies = await UserCompany.findAll({ 
      where: { user_id: req.user.id, role: 'owner' },
      attributes: ['company_id']
    });
    
    const companyIds = userCompanies.map(uc => uc.company_id);
    const currentCount = companyIds.length;

    // 2. Identify the highest business limit among all active subscriptions
    const subscriptions = await Subscription.findAll({
      where: { company_id: companyIds, status: ['active', 'trial'] },
      include: [Plan]
    });

    let maxBusinesses = 1; // Default for Free/Zero
    let currentHighestPlan = 'Free Account';

    subscriptions.forEach(sub => {
      let features = sub.Plan?.features || {};
      if (typeof features === 'string') {
        try { features = JSON.parse(features); } catch (e) { features = {}; }
      }
      
      const planLimit = parseInt(features.manage_businesses) || 1;
      if (planLimit > maxBusinesses) {
        maxBusinesses = planLimit;
        currentHighestPlan = sub.Plan.plan_name;
      }
    });
    
    console.log(`[AddCompany] User: ${req.user.email} | Current: ${currentCount} | Max: ${maxBusinesses} (${currentHighestPlan})`);

    // 3. Validation: Block if limit reached
    if (currentCount >= maxBusinesses) {
      return res.status(403).json({ 
        error: `Limit Reached: Your ${currentHighestPlan} plan allows up to ${maxBusinesses} businesses. You already have ${currentCount}.`,
        currentCount,
        maxLimit: maxBusinesses,
        needsUpgrade: true
      });
    }

    // 4. Create new company
    const company = await Company.create({
      name, gst_number, address, city, state, pincode, phone, email
    });

    // 5. Link user as owner
    await UserCompany.create({
      user_id: req.user.id,
      company_id: company.id,
      role: 'owner'
    });

    // 6. Assign a default 'Zero Account' (Free) plan to the new business
    const freePlan = await Plan.findOne({ where: { plan_name: 'Free Account' } });
    if (freePlan) {
      const expiryDate = new Date();
      expiryDate.setFullYear(expiryDate.getFullYear() + 10);
      
      await Subscription.create({
        company_id: company.id,
        plan_id: freePlan.id,
        status: 'active',
        payment_status: 'paid',
        expiry_date: expiryDate,
        usage: { invoices: 0, products: 0, eway_bills: 0, godowns: 0 }
      });
    }

    res.status(201).json({ 
      message: 'New business created successfully', 
      company 
    });

  } catch (error) {
    console.error('Add company error:', error);
    res.status(500).json({ error: 'Failed to create business: ' + error.message });
  }
};

/* =========================================================
   GODOWNS (PLAN RESTRICTED)
========================================================= */

const getGodowns = async (req, res) => {
  try {
    const godowns = await Godown.findAll({ where: { company_id: req.companyId } });
    res.json(godowns);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch godowns' });
  }
};

const addGodown = async (req, res) => {
  try {
    const { name, location } = req.body;
    const godown = await Godown.create({
      company_id: req.companyId,
      name,
      location
    });
    res.status(201).json(godown);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create godown' });
  }
};

/* =========================================================
   INVOICE CUSTOMIZATION
========================================================= */

const updateInvoiceCustomization = async (req, res) => {
  try {
    const { businessType, columnLabels, columnToggles, headerColor, menuColor, textSize } = req.body;

    const company = await Company.findByPk(req.companyId);
    if (!company) {
      return res.status(404).json({ error: "Company not found" });
    }

    // Update the customization fields
    await company.update({
      invoice_business_category: businessType,
      invoice_column_labels: columnLabels,
      invoice_column_toggles: columnToggles,
      invoice_header_color: headerColor,
      invoice_menu_color: menuColor,
      invoice_text_size: textSize
    });

    res.json({ message: 'Invoice settings updated successfully', settings: company });

  } catch (error) {
    console.error('Update customization error:', error);
    res.status(500).json({ error: 'Update failed', message: error.message });
  }
};


/* =========================================================
   EXPORT CONTROLLER FUNCTIONS
========================================================= */

module.exports = {

  getCompany,
  updateCompany,
  updateSettings,

  uploadLogo,
  uploadSignature,
  uploadQRCode,

  getUsers,
  addUser,
  updateUser,
  deleteUser,
  addCompany,
  getGodowns,
  addGodown,
  updateInvoiceCustomization
  };
