const express = require('express');
const router = express.Router();
const cookieParser = require('cookie-parser');
const { 
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
} = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');
const { 
  registerValidation, 
  loginValidation 
} = require('../middleware/validation');
const { 
  authLimiter, 
  bruteForceProtection 
} = require('../middleware/rateLimit');

// Cookie parser for refresh token handling
router.use(cookieParser());

/* ===============================
   PUBLIC ROUTES
================================ */

// Register - general rate limit
router.post('/register', registerValidation, register);

// Login - strict rate limit + brute force protection
router.post('/login', 
  authLimiter,         // 5 attempts per 15 min per email
  bruteForceProtection, // Account-level lockout after 10 failures
  loginValidation, 
  login
);

// Refresh token - requires HttpOnly cookie
router.post('/refresh', refreshToken);

/* ===============================
   PROTECTED ROUTES
================================ */

// Logout - revoke refresh token
router.post('/logout', authenticateToken, logout);

// Logout all sessions except current
router.post('/logout-all', authenticateToken, logoutAll);

// Get profile
router.get('/profile', authenticateToken, getProfile);

// Update profile
router.put('/profile', authenticateToken, updateProfile);

// Change password
router.post('/change-password', authenticateToken, changePassword);

// Switch company
router.post('/switch-company/:companyId', authenticateToken, switchCompany);

// Get active sessions
router.get('/sessions', authenticateToken, getSessions);

// Revoke specific session
router.post('/sessions/:sessionId/revoke', authenticateToken, revokeSession);

module.exports = router;
