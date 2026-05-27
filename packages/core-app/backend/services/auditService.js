/**
 * Audit Service - Security Event Logging
 * 
 * Logs security-relevant events for monitoring and incident response
 */

const { ActivityLog } = require('../models');

const SEVERITY = {
  INFO: 'info',
  WARNING: 'warning',
  HIGH: 'high',
  CRITICAL: 'critical'
};

const EVENT_TYPES = {
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGIN_FAILED: 'LOGIN_FAILED',
  LOGOUT: 'LOGOUT',
  TOKEN_REFRESH: 'TOKEN_REFRESH',
  TOKEN_REUSE_DETECTED: 'TOKEN_REUSE_DETECTED',
  PASSWORD_CHANGE: 'PASSWORD_CHANGE',
  PASSWORD_RESET_REQUEST: 'PASSWORD_RESET_REQUEST',
  PASSWORD_RESET_COMPLETE: 'PASSWORD_RESET_COMPLETE',
  BRUTE_FORCE_DETECTED: 'BRUTE_FORCE_DETECTED',
  UNAUTHORIZED_ACCESS: 'UNAUTHORIZED_ACCESS',
  PERMISSION_DENIED: 'PERMISSION_DENIED',
  TENANT_ACCESS_DENIED: 'TENANT_ACCESS_DENIED',
  SESSION_REVOKED: 'SESSION_REVOKED',
  ALL_SESSIONS_REVOKED: 'ALL_SESSIONS_REVOKED',
  SUSPICIOUS_ACTIVITY: 'SUSPICIOUS_ACTIVITY'
};

/**
 * Log a security event
 */
const logSecurityEvent = async (eventType, details) => {
  try {
    const {
      userId,
      companyId,
      email,
      ip,
      userAgent,
      metadata = {},
      severity = SEVERITY.INFO
    } = details;
    
    // Log to console for immediate visibility
    console.log(`[Security] ${eventType}:`, {
      userId: userId || email || 'unknown',
      ip,
      severity,
      ...metadata
    });
    
    // Store in database (ActivityLog for now - consider dedicated SecurityLog table)
    await ActivityLog.create({
      user_id: userId,
      company_id: companyId,
      action: eventType,
      entity_type: 'security',
      entity_id: metadata.sessionId || null,
      details: {
        ...metadata,
        email,
        ip_address: ip,
        user_agent: userAgent,
        severity
      }
    });
    
    // For critical events, could also send alerts (email, Slack, etc.)
    if (severity === SEVERITY.CRITICAL) {
      // await sendCriticalAlert(eventType, details);
      console.error(`🚨 CRITICAL SECURITY EVENT: ${eventType}`, details);
    }
  } catch (error) {
    // Don't let audit logging failures break the application
    console.error('Failed to log security event:', error);
  }
};

/**
 * Log authentication attempt
 */
const logAuthAttempt = async (req, success, user = null, error = null) => {
  const eventType = success ? EVENT_TYPES.LOGIN_SUCCESS : EVENT_TYPES.LOGIN_FAILED;
  
  await logSecurityEvent(eventType, {
    userId: user?.id,
    companyId: user?.company_id,
    email: req.body?.email,
    ip: req.ip,
    userAgent: req.headers['user-agent'],
    severity: success ? SEVERITY.INFO : SEVERITY.WARNING,
    metadata: {
      error: error?.message,
      timestamp: new Date().toISOString()
    }
  });
};

/**
 * Log token refresh
 */
const logTokenRefresh = async (req, userId, sessionId, rotated = true) => {
  await logSecurityEvent(EVENT_TYPES.TOKEN_REFRESH, {
    userId,
    ip: req.ip,
    userAgent: req.headers['user-agent'],
    metadata: {
      sessionId,
      rotated
    }
  });
};

/**
 * Log suspicious activity
 */
const logSuspiciousActivity = async (req, reason, details = {}) => {
  await logSecurityEvent(EVENT_TYPES.SUSPICIOUS_ACTIVITY, {
    ip: req.ip,
    userAgent: req.headers['user-agent'],
    severity: SEVERITY.HIGH,
    metadata: {
      reason,
      ...details
    }
  });
};

module.exports = {
  SEVERITY,
  EVENT_TYPES,
  logSecurityEvent,
  logAuthAttempt,
  logTokenRefresh,
  logSuspiciousActivity
};
