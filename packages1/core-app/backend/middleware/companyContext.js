const { UserCompany } = require("../models");

module.exports = async function (req, res, next) {
  try {
    // Check header first, then fallback to user's primary company
    let companyId = req.headers["x-company-id"] || req.user.company_id;

    // Company context resolved

    if (!companyId) {
      // Company ID missing warning
      return res.status(400).json({
        error: "Company ID missing"
      });
    }

    // Optional: Verify user actually belongs to this company if using header
    if (req.headers["x-company-id"]) {
      const access = await UserCompany.findOne({
        where: {
          user_id: req.user.id,
          company_id: companyId
        }
      });

      if (!access) {
        // Also check if they are the owner/admin of the company directly
        if (req.user.company_id !== companyId) {
          return res.status(403).json({
            error: "Company access denied"
          });
        }
      }
    }

    req.companyId = companyId;
    next();
  } catch (error) {
    // Error logged
    res.status(500).json({ error: "Failed to verify company context" });
  }
};
