const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { User, Company, Plan, Subscription, UserCompany } = require('../models');
const tokenService = require('../services/tokenService');
const { incrementBruteForce, clearBruteForce } = require('../middleware/rateLimit');
const { logSecurityEvent, EVENT_TYPES, SEVERITY } = require('../services/auditService');

// Cookie configuration
const REFRESH_COOKIE_NAME = 'refreshToken';
const isProduction = process.env.NODE_ENV === 'production';
const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,        // Not accessible via JavaScript
  secure: true,          // Always use secure (HTTPS) - required for sameSite 'none'
  sameSite: isProduction ? 'none' : 'lax',  // 'none' required for cross-origin cookies (Cloudflare→Railway)
  maxAge: 7 * 24 * 60 * 60 * 1000,  // 7 days
  path: '/'              // Available on all auth paths (refresh, logout, etc.)
};

/* ===============================
   REGISTER
================================ */
const register = async (req, res) => {
  try {
    const { companyName, email, password, name, phone, gstNumber, address } = req.body;

    // Check existing email
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Create company
    const company = await Company.create({
      name: companyName,
      gst_number: gstNumber,
      gst_registered: !!gstNumber,
      address: address,
      email: email
    });

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);  // Increased rounds

    // Create user
    const user = await User.create({
      company_id: company.id,
      email,
      password: hashedPassword,
      name,
      phone,
      role: 'owner',
      token_version: 1
    });

    // Create UserCompany relationship
    await UserCompany.create({
      user_id: user.id,
      company_id: company.id,
      role: 'owner'
    });

    // Find or create Free plan
    let freePlan = await Plan.findOne({ where: { plan_name: 'Free Account' } });

    if (!freePlan) {
      freePlan = await Plan.create({
        plan_name: 'Free Account',
        price: 0,
        billing_cycle: 'lifetime',
        max_users: 1,
        max_invoices_per_month: 50,
        max_products: 50,
        storage_limit: 100
      });
    }

    // Create trial subscription
    const trialEnd = new Date();
    trialEnd.setDate(trialEnd.getDate() + 14);

    await Subscription.create({
      company_id: company.id,
      plan_id: freePlan.id,
      start_date: new Date(),
      expiry_date: trialEnd,
      status: 'trial',
      payment_status: 'pending',
      usage: {
        invoices: 0,
        products: 0,
        eway_bills: 0,
        godowns: 0
      }
    });

    // Generate session ID
    const sessionId = crypto.randomUUID();
    const fingerprint = tokenService.generateDeviceFingerprint(req);
    const deviceInfo = {
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      timestamp: new Date().toISOString()
    };

    // Generate tokens
    const accessToken = tokenService.createAccessToken(user, sessionId);
    const refreshToken = await tokenService.createRefreshToken(
      user.id, sessionId, deviceInfo, fingerprint
    );

    // Set refresh token as HttpOnly cookie
    res.cookie(REFRESH_COOKIE_NAME, refreshToken, REFRESH_COOKIE_OPTIONS);

    res.status(201).json({
      message: 'Registration successful',
      accessToken,  // Short-lived, stored in memory
      expiresIn: 900,  // 15 minutes in seconds
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      },
      company: {
        id: company.id,
        name: company.name
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
};

/* ===============================
   LOGIN
================================ */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({
      where: { email },
      include: [
        {
          model: Company,
          include: [{ model: Subscription, include: [Plan] }]
        }
      ]
    });

    if (!user) {
      incrementBruteForce(email);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (!user.is_active) {
      incrementBruteForce(email);
      return res.status(401).json({ error: 'Account is deactivated' });
    }

    if (!user.password) {
      incrementBruteForce(email);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      incrementBruteForce(email);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Successful login - clear brute force counter
    clearBruteForce(email);

    // Fetch all companies this user has access to
    const userCompanies = await UserCompany.findAll({
      where: { user_id: user.id },
      include: [{ model: Company }]
    });

    const companies = userCompanies.map(uc => ({
      id: uc.Company.id,
      name: uc.Company.name,
      role: uc.role
    }));

    // Find the best plan across all these companies
    const companyIds = userCompanies.filter(uc => uc.role === 'owner').map(uc => uc.company_id);
    let maxBusinesses = 1;
    
    if (companyIds.length > 0) {
      const allSubs = await Subscription.findAll({
        where: { company_id: companyIds },
        include: [Plan]
      });
      allSubs.forEach(sub => {
        const limit = sub.Plan?.features?.manage_businesses || 1;
        if (limit > maxBusinesses) maxBusinesses = limit;
      });
    }

    // Update last login
    await user.update({ last_login: new Date() });

    // Generate session ID and tokens
    const sessionId = crypto.randomUUID();
    const fingerprint = tokenService.generateDeviceFingerprint(req);
    const deviceInfo = {
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      timestamp: new Date().toISOString()
    };

    // Generate tokens
    const accessToken = tokenService.createAccessToken(user, sessionId);
    const refreshToken = await tokenService.createRefreshToken(
      user.id, sessionId, deviceInfo, fingerprint
    );

    // Set refresh token as HttpOnly cookie
    res.cookie(REFRESH_COOKIE_NAME, refreshToken, REFRESH_COOKIE_OPTIONS);

    res.json({
      accessToken,  // Short-lived, client stores in memory
      expiresIn: 900,  // 15 minutes in seconds
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        permissions: user.permissions
      },
      maxBusinesses,
      company: user.Company ? {
        id: user.Company.id,
        name: user.Company.name,
        logo: user.Company.logo,
        currency: user.Company.currency
      } : null,
      companies,
      subscription: (user.Company && user.Company.Subscription)
        ? {
            plan: user.Company.Subscription.Plan,
            status: user.Company.Subscription.status,
            expiryDate: user.Company.Subscription.expiry_date,
            usage: user.Company.Subscription.usage
          }
        : null
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
};

/* ===============================
   REFRESH TOKEN
================================ */
const refreshToken = async (req, res) => {
  try {
    const refreshToken = req.cookies[REFRESH_COOKIE_NAME];
    
    if (!refreshToken) {
      return res.status(401).json({ 
        error: 'No refresh token provided',
        code: 'REFRESH_TOKEN_MISSING'
      });
    }

    const fingerprint = tokenService.generateDeviceFingerprint(req);
    const deviceInfo = {
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      timestamp: new Date().toISOString()
    };

    // Rotate refresh token (single-use)
    const rotation = await tokenService.rotateRefreshToken(
      refreshToken, 
      deviceInfo, 
      fingerprint
    );

    // Get user for access token
    const user = await User.findByPk(rotation.userId);
    if (!user || !user.is_active) {
      return res.status(401).json({ error: 'User not found or inactive' });
    }

    // Generate new access token
    const accessToken = tokenService.createAccessToken(user, rotation.sessionId);

    // Generate new refresh token
    const newRefreshToken = await tokenService.createRefreshToken(
      user.id, 
      rotation.sessionId, 
      deviceInfo, 
      fingerprint
    );

    // Set new refresh token as HttpOnly cookie
    res.cookie(REFRESH_COOKIE_NAME, newRefreshToken, REFRESH_COOKIE_OPTIONS);

    // Log token refresh
    await logSecurityEvent(EVENT_TYPES.TOKEN_REFRESH, {
      userId: user.id,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      metadata: { sessionId: rotation.sessionId }
    });

    res.json({
      accessToken,
      expiresIn: 900  // 15 minutes
    });

  } catch (error) {
    console.error('Token refresh error:', error);
    
    // Clear cookie on error
    res.clearCookie(REFRESH_COOKIE_NAME, { path: '/' });
    
    if (error.message.includes('reuse detected')) {
      await logSecurityEvent(EVENT_TYPES.TOKEN_REUSE_DETECTED, {
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        severity: SEVERITY.CRITICAL
      });
    }
    
    res.status(401).json({ 
      error: error.message || 'Invalid refresh token',
      code: 'REFRESH_FAILED'
    });
  }
};

/* ===============================
   LOGOUT
================================ */
const logout = async (req, res) => {
  try {
    const refreshToken = req.cookies[REFRESH_COOKIE_NAME];
    
    // Revoke refresh token if present
    if (refreshToken) {
      const tokenHash = tokenService.hashToken(refreshToken);
      await tokenService.revokeToken(tokenHash);
    }
    
    // Clear cookie
    res.clearCookie(REFRESH_COOKIE_NAME, { path: '/' });
    
    // Log logout
    if (req.user) {
      await logSecurityEvent(EVENT_TYPES.LOGOUT, {
        userId: req.user.id,
        ip: req.ip,
        userAgent: req.headers['user-agent']
      });
    }
    
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Logout failed' });
  }
};

/* ===============================
   LOGOUT ALL SESSIONS
================================ */
const logoutAll = async (req, res) => {
  try {
    const userId = req.user.id;
    const currentSessionId = req.user.sessionId;
    
    // Revoke all tokens except current session
    await tokenService.revokeAllUserTokens(userId, currentSessionId);
    
    // Increment token version to invalidate all access tokens
    await tokenService.incrementTokenVersion(userId);
    
    await logSecurityEvent(EVENT_TYPES.ALL_SESSIONS_REVOKED, {
      userId,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      severity: SEVERITY.HIGH
    });
    
    res.json({ message: 'All other sessions logged out successfully' });
  } catch (error) {
    console.error('Logout all error:', error);
    res.status(500).json({ error: 'Failed to logout all sessions' });
  }
};

/* ===============================
   GET PROFILE
================================ */
const getProfile = async (req, res) => {
  try {
    const user = req.user;

    const userCompanies = await UserCompany.findAll({
      where: { user_id: user.id },
      include: [{ model: Company }]
    });

    const companies = userCompanies.map(uc => ({
      id: uc.Company.id,
      name: uc.Company.name,
      role: uc.role
    }));

    const companyIds = userCompanies.filter(uc => uc.role === 'owner').map(uc => uc.company_id);
    let maxBusinesses = 1;
    
    if (companyIds.length > 0) {
      const allSubs = await Subscription.findAll({
        where: { company_id: companyIds },
        include: [Plan]
      });
      allSubs.forEach(sub => {
        const limit = sub.Plan?.features?.manage_businesses || 1;
        if (limit > maxBusinesses) maxBusinesses = limit;
      });
    }

    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        permissions: user.permissions
      },
      maxBusinesses,
      company: user.Company ? {
        id: user.Company.id,
        name: user.Company.name,
        gst_number: user.Company.gst_number,
        address: user.Company.address,
        city: user.Company.city,
        state: user.Company.state,
        pincode: user.Company.pincode,
        phone: user.Company.phone,
        email: user.Company.email,
        logo: user.Company.logo,
        signature: user.Company.signature,
        qr_code: user.Company.qr_code,
        tagline: user.Company.tagline,
        business_category: user.Company.business_category,
        invoice_prefix: user.Company.invoice_prefix,
        currency: user.Company.currency,
        bank_name: user.Company.bank_name,
        account_number: user.Company.account_number,
        ifsc_code: user.Company.ifsc_code,
        branch_name: user.Company.branch_name,
        terms_conditions: user.Company.terms_conditions,
        settings: user.Company.settings
      } : null,
      companies,
      subscription: (user.Company && user.Company.Subscription)
        ? {
            plan: user.Company.Subscription.Plan,
            status: user.Company.Subscription.status,
            expiryDate: user.Company.Subscription.expiry_date,
            usage: user.Company.Subscription.usage
          }
        : null
    });

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to get profile' });
  }
};

/* ===============================
   UPDATE PROFILE
================================ */
const updateProfile = async (req, res) => {
  try {
    const { name, phone } = req.body;

    await req.user.update({
      name,
      phone
    });

    res.json({ message: 'Profile updated successfully' });

  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
};

/* ===============================
   CHANGE PASSWORD
================================ */
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const validPassword = await bcrypt.compare(
      currentPassword,
      req.user.password
    );

    if (!validPassword) {
      return res.status(400).json({
        error: 'Current password is incorrect'
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Update password and increment token version
    await req.user.update({
      password: hashedPassword,
      token_version: (req.user.token_version || 1) + 1
    });

    // Revoke all refresh tokens except current session
    await tokenService.revokeAllUserTokens(req.user.id, req.user.sessionId);

    // Log password change
    await logSecurityEvent(EVENT_TYPES.PASSWORD_CHANGE, {
      userId: req.user.id,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      severity: SEVERITY.HIGH
    });

    res.json({ 
      message: 'Password changed successfully. Please log in again on other devices.' 
    });

  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Failed to change password' });
  }
};

/* ===============================
   SWITCH COMPANY
================================ */
const switchCompany = async (req, res) => {
  try {
    const { companyId } = req.params;
    
    // Verify user has access to this company
    const hasAccess = await UserCompany.findOne({
      where: { user_id: req.user.id, company_id: companyId }
    });

    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied to this company' });
    }

    await req.user.update({ company_id: companyId });

    res.json({ message: 'Switched company successfully' });
  } catch (error) {
    console.error('Switch company error:', error);
    res.status(500).json({ error: 'Failed to switch company' });
  }
};

/* ===============================
   GET ACTIVE SESSIONS
================================ */
const getSessions = async (req, res) => {
  try {
    const sessions = await tokenService.getUserSessions(req.user.id);
    
    // Mark current session
    const currentSessionId = req.user.sessionId;
    const sessionsWithCurrent = sessions.map(s => ({
      ...s.toJSON(),
      isCurrent: s.session_id === currentSessionId
    }));
    
    res.json({ sessions: sessionsWithCurrent });
  } catch (error) {
    console.error('Get sessions error:', error);
    res.status(500).json({ error: 'Failed to get sessions' });
  }
};

/* ===============================
   REVOKE SESSION
================================ */
const revokeSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    // Don't allow revoking current session through this endpoint
    if (sessionId === req.user.sessionId) {
      return res.status(400).json({ 
        error: 'Cannot revoke current session. Use logout instead.' 
      });
    }
    
    // Revoke tokens for this session
    const { RefreshToken } = require('../models');
    await RefreshToken.update(
      { revoked_at: new Date() },
      { 
        where: { 
          user_id: req.user.id,
          session_id: sessionId,
          revoked_at: null
        } 
      }
    );
    
    await logSecurityEvent(EVENT_TYPES.SESSION_REVOKED, {
      userId: req.user.id,
      ip: req.ip,
      metadata: { revokedSessionId: sessionId }
    });
    
    res.json({ message: 'Session revoked successfully' });
  } catch (error) {
    console.error('Revoke session error:', error);
    res.status(500).json({ error: 'Failed to revoke session' });
  }
};

module.exports = {
  register,
  login,
  refreshToken,
  logout,
  logoutAll,
  getProfile,
  updateProfile,
  changePassword,
  switchCompany,
  getSessions,
  revokeSession
};
