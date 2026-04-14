const jwt = require('jsonwebtoken');
const { User, Company, Subscription, Plan } = require('../models');
const { checkSubscriptionFeature } = require('../services/subscriptionService');

const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  let token = authHeader && authHeader.split(' ')[1];

  // If no token in header, check query parameters (for PDF downloads via window.open)
  if (!token && req.query.token) {
    token = req.query.token;
  }

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findByPk(decoded.userId, {
      include: [{ model: Company, include: [{ model: Subscription, include: [Plan] }] }]
    });

    if (!user || !user.is_active) {
      return res.status(401).json({ error: 'Invalid or inactive user' });
    }

    req.user = user;
    req.companyId = user.company_id;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};

const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
};

const checkPermission = (permission) => {
  return (req, res, next) => {
    const userPermissions = req.user.permissions || {};
    if (req.user.role === 'owner' || userPermissions[permission]) {
      return next();
    }
    return res.status(403).json({ error: `Permission required: ${permission}` });
  };
};

const checkSubscriptionQuota = (quotaType) => {
  return async (req, res, next) => {
    const subscription = req.user.Company?.Subscription;
    const plan = subscription?.Plan;

    if (!subscription || !plan) {
      return res.status(403).json({ error: 'No active subscription' });
    }

    if (subscription.status !== 'active' && subscription.status !== 'trial') {
      return res.status(403).json({ error: 'Subscription expired or inactive' });
    }

    const usage = subscription.usage || {};

    // Limits Logic
    const isFreeAccount = plan.plan_name === 'Free Account' || plan.plan_name === 'Free' || plan.plan_name === 'Zero Account';
    const isPremium = plan.plan_name === 'Premium';
    
    const invoiceLimit = isFreeAccount ? 50 : (isPremium ? 200 : plan.max_invoices_per_month);
    const productLimit = isFreeAccount ? 100 : (isPremium ? 1000 : plan.max_products);

    switch (quotaType) {
      case 'invoices':
        if ((usage.invoices || 0) >= invoiceLimit) {
          return res.status(403).json({ 
            error: `Monthly invoice limit reached (${invoiceLimit}). Upgrade to ${isPremium ? 'Enterprise' : 'Premium'} for more.`, 
            limit: invoiceLimit,
            used: (usage.invoices || 0)
          });
        }
        break;
      case 'products':
        if ((usage.products || 0) >= productLimit) {
          return res.status(403).json({ 
            error: `Product limit reached (${productLimit}). Upgrade to ${isPremium ? 'Enterprise' : 'Premium'} for more.`, 
            limit: productLimit,
            used: (usage.products || 0)
          });
        }
        break;
    }

    next();
  };
};

const checkFeatureAccess = (featureKey) => {
  return async (req, res, next) => {
    const hasAccess = await checkSubscriptionFeature(req.companyId, featureKey);

    if (hasAccess) {
      return next();
    }

    const planName = req.user.Company?.Subscription?.Plan?.plan_name || 'Free';
    return res.status(403).json({ 
      error: `Your current plan (${planName}) does not include access to this feature. Please upgrade.`,
      upgradeRequired: true
    });
  };
};

module.exports = { authenticateToken, requireRole, checkPermission, checkSubscriptionQuota, checkFeatureAccess };
