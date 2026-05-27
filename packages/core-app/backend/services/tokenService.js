/**
 * Token Service - Secure JWT and Refresh Token Management
 * 
 * Features:
 * - Short-lived access tokens (15 minutes)
 * - Refresh token rotation (refresh tokens are single-use)
 * - Token fingerprinting for binding to device/session
 * - Token revocation capability
 * - Secure token generation with crypto
 */

const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { promisify } = require('util');
const { RefreshToken, User } = require('../models');

// Token Configuration
const TOKEN_CONFIG = {
  access: {
    expiresIn: '15m',        // 15 minutes - short-lived
    issuer: 'bill-easy-api',
    audience: 'bill-easy-client'
  },
  refresh: {
    expiresIn: '7d',         // 7 days - but rotatable
    issuer: 'bill-easy-api',
    audience: 'bill-easy-client'
  }
};

/**
 * Generate cryptographically secure random token
 */
const generateSecureToken = (length = 64) => {
  return crypto.randomBytes(length).toString('hex');
};

/**
 * Hash token for database storage (prevents token theft if DB is compromised)
 */
const hashToken = (token) => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

/**
 * Generate device fingerprint from request
 */
const generateDeviceFingerprint = (req) => {
  const data = `${req.ip}:${req.headers['user-agent'] || 'unknown'}`;
  return crypto.createHash('sha256').update(data).digest('hex').substring(0, 32);
};

/**
 * Create access token (JWT)
 */
const createAccessToken = (user, sessionId) => {
  return jwt.sign(
    {
      sub: user.id,                    // Subject: userId
      tid: user.company_id,            // Tenant ID (company)
      role: user.role,                 // Role for RBAC
      sid: sessionId,                  // Session ID for revocation
      ver: user.token_version || 1,    // Token version for mass logout
      jti: crypto.randomUUID()         // Unique token ID
    },
    process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET,
    TOKEN_CONFIG.access
  );
};

/**
 * Create refresh token (stored hashed in DB, plaintext returned)
 */
const createRefreshToken = async (userId, sessionId, deviceInfo, fingerprint) => {
  const plainToken = generateSecureToken(64);
  const tokenHash = hashToken(plainToken);
  
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);
  
  await RefreshToken.create({
    token_hash: tokenHash,
    user_id: userId,
    session_id: sessionId,
    device_info: deviceInfo,
    fingerprint: fingerprint,
    expires_at: expiresAt,
    created_at: new Date(),
    rotated_at: new Date()
  });
  
  return plainToken;
};

/**
 * Rotate refresh token (single-use: old token marked as used, new token issued)
 * This detects token reuse (potential theft)
 */
const rotateRefreshToken = async (plainToken, deviceInfo, fingerprint) => {
  const tokenHash = hashToken(plainToken);
  
  const existingToken = await RefreshToken.findOne({
    where: { 
      token_hash: tokenHash,
      revoked_at: null
    }
  });
  
  if (!existingToken) {
    throw new Error('Invalid refresh token');
  }
  
  if (existingToken.expires_at < new Date()) {
    throw new Error('Refresh token expired');
  }
  
  // Check for token reuse (potential theft)
  if (existingToken.used_at) {
    // Token was already used - possible replay attack!
    console.warn('🚨 TOKEN REUSE DETECTED - Potential theft!', {
      userId: existingToken.user_id,
      tokenId: existingToken.id
    });
    
    // Revoke all tokens for this user
    await revokeAllUserTokens(existingToken.user_id);
    
    // Notify user (async - don't wait)
    // await notifyUserOfSuspiciousActivity(existingToken.user_id);
    
    throw new Error('Token reuse detected. All sessions revoked for security.');
  }
  
  // Check fingerprint match (optional - prevents token theft across devices)
  if (existingToken.fingerprint && existingToken.fingerprint !== fingerprint) {
    console.warn('⚠️ Device fingerprint mismatch', {
      userId: existingToken.user_id,
      expected: existingToken.fingerprint,
      actual: fingerprint
    });
    // Don't throw error, but log for security monitoring
  }
  
  // Mark token as used
  existingToken.used_at = new Date();
  await existingToken.save();
  
  // Generate new refresh token
  const newRefreshToken = await createRefreshToken(
    existingToken.user_id,
    existingToken.session_id,
    deviceInfo,
    fingerprint
  );
  
  return {
    refreshToken: newRefreshToken,
    userId: existingToken.user_id,
    sessionId: existingToken.session_id
  };
};

/**
 * Verify refresh token (without rotation - for validation only)
 */
const verifyRefreshToken = async (plainToken) => {
  const tokenHash = hashToken(plainToken);
  
  const token = await RefreshToken.findOne({
    where: {
      token_hash: tokenHash,
      revoked_at: null,
      used_at: null,
      expires_at: { [require('sequelize').Op.gt]: new Date() }
    }
  });
  
  return token;
};

/**
 * Revoke a specific token
 */
const revokeToken = async (tokenHash) => {
  await RefreshToken.update(
    { revoked_at: new Date() },
    { where: { token_hash: tokenHash } }
  );
};

/**
 * Revoke all tokens for a user (mass logout)
 */
const revokeAllUserTokens = async (userId, exceptSessionId = null) => {
  const where = { 
    user_id: userId, 
    revoked_at: null 
  };
  
  if (exceptSessionId) {
    where.session_id = { [require('sequelize').Op.ne]: exceptSessionId };
  }
  
  await RefreshToken.update(
    { revoked_at: new Date() },
    { where }
  );
};

/**
 * Increment user token version (invalidates all existing access tokens)
 */
const incrementTokenVersion = async (userId) => {
  await User.update(
    { token_version: require('sequelize').literal('COALESCE(token_version, 1) + 1') },
    { where: { id: userId } }
  );
};

/**
 * Clean up expired/used tokens (run periodically)
 */
const cleanupOldTokens = async (olderThanDays = 30) => {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - olderThanDays);
  
  const result = await RefreshToken.destroy({
    where: {
      [require('sequelize').Op.or]: [
        { expires_at: { [require('sequelize').Op.lt]: new Date() } },
        { used_at: { [require('sequelize').Op.lt]: cutoff } },
        { revoked_at: { [require('sequelize').Op.lt]: cutoff } }
      ]
    }
  });
  
  console.log(`🧹 Cleaned up ${result} old refresh tokens`);
  return result;
};

/**
 * Get active sessions for a user
 */
const getUserSessions = async (userId) => {
  return await RefreshToken.findAll({
    where: {
      user_id: userId,
      revoked_at: null,
      expires_at: { [require('sequelize').Op.gt]: new Date() }
    },
    order: [['created_at', 'DESC']],
    attributes: ['id', 'session_id', 'device_info', 'created_at', 'rotated_at', 'expires_at']
  });
};

module.exports = {
  createAccessToken,
  createRefreshToken,
  rotateRefreshToken,
  verifyRefreshToken,
  revokeToken,
  revokeAllUserTokens,
  incrementTokenVersion,
  cleanupOldTokens,
  getUserSessions,
  generateDeviceFingerprint,
  hashToken,
  TOKEN_CONFIG
};
