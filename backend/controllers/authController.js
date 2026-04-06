const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { User, Company, Plan, Subscription, UserCompany } = require('../models');
const { Op } = require('sequelize');
const { sendEmailViaAPI } = require('../utils/mailer');

// Helper function to mask email
const maskEmail = (email) => {
  const [localPart, domain] = email.split('@');
  const maskedLocal = localPart.charAt(0) + '***';
  return `${maskedLocal}@${domain}`;
};

/* ===============================
   REGISTER
================================ */
const register = async (req, res) => {
  try {
    console.log('Registration request body:', { ...req.body, password: '***' });
    const { companyName, email, password, name, phone, gstNumber, address } = req.body;

    // Check existing email
    const existingUserByEmail = await User.findOne({ where: { email } });
    if (existingUserByEmail) {
      return res.status(400).json({ 
        error: 'ACCOUNT_EXISTS',
        message: 'An account with this email already exists',
        maskedEmail: maskEmail(existingUserByEmail.email)
      });
    }

    // Check existing mobile number
    if (phone) {
      const existingUserByPhone = await User.findOne({ where: { phone } });
      if (existingUserByPhone) {
        return res.status(400).json({ 
          error: 'ACCOUNT_EXISTS',
          message: 'An account with this mobile number already exists',
          maskedEmail: maskEmail(existingUserByPhone.email)
        });
      }
    }

    console.log('Creating company with GST:', gstNumber);
    // Create company
    const company = await Company.create({
      name: companyName,
      gst_number: gstNumber,
      gst_registered: !!gstNumber,
      address: address,
      email: email
    });
    console.log('Company created:', company.id, 'GST saved:', company.gst_number);

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await User.create({
      company_id: company.id,
      email,
      password: hashedPassword,
      name,
      phone,
      role: 'owner'
    });

    // Create UserCompany association
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
        max_products: 100,
        features: {
          gst_billing: true,
          inventory_management: true,
          reports: true,
          quotations: true,
          eway_bills: false,
          multi_godowns: false,
          staff_attendance_payroll: false,
          manage_businesses: 1,
          user_activity_tracker: false
        },
        is_active: true
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

    // Generate JWT
    const token = jwt.sign(
      { userId: user.id, companyId: company.id },
      process.env.JWT_SECRET,
      {
        expiresIn: process.env.JWT_EXPIRES_IN || '7d'
      }
    );

    res.status(201).json({
      message: 'Registration successful',
      token,
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
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (!user.is_active) {
      return res.status(401).json({ error: 'Account is deactivated' });
    }

    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

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

    // Find the best plan across all these companies to determine overall account limits
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

    // Generate JWT
    const token = jwt.sign(
      { userId: user.id, companyId: user.company_id },
      process.env.JWT_SECRET,
      {
        expiresIn: process.env.JWT_EXPIRES_IN || '7d'
      }
    );

    res.json({
      token,
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
   GET PROFILE
================================ */
const getProfile = async (req, res) => {
  try {
    const user = req.user;

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

    // Find the best plan across all these companies to determine overall account limits
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

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await req.user.update({
      password: hashedPassword
    });

    res.json({ message: 'Password changed successfully' });

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
   EMAIL OTP - GENERATE AND SEND
================================ */
const generateAndSendOTP = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Find user by email
    const user = await User.findOne({ where: { email } });

    if (!user) {
      // Don't reveal if user exists
      return res.status(200).json({
        message: 'If an account exists with this email, an OTP has been sent.',
        maskedEmail: maskEmail(email)
      });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Set expiry to 5 minutes from now
    const otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000);

    // Save OTP to user record
    await user.update({
      otp_code: otp,
      otp_expires_at: otpExpiresAt
    });

    // Send OTP via Brevo API
    try {
      const senderEmail = process.env.SMTP_FROM || 'support@charisbilleasy.store';
      
      await sendEmailViaAPI({
        to: email,
        subject: 'Your BillEasy Password Reset OTP',
        textContent: `
Hello ${user.name},

Your OTP for password reset is: ${otp}

This OTP is valid for 5 minutes.

If you did not request this, please ignore this email.

Best regards,
BillEasy Team
        `,
        htmlContent: `
          <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px;">
            <div style="background: #2563eb; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
              <h2 style="margin: 0;">BillEasy Password Reset</h2>
            </div>
            <div style="background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
              <p style="color: #374151; font-size: 16px;">Hello <strong>${user.name}</strong>,</p>
              <p style="color: #374151;">Your OTP for password reset is:</p>
              <div style="background: #ffffff; border: 2px dashed #2563eb; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px;">
                <span style="font-size: 32px; font-weight: bold; color: #2563eb; letter-spacing: 8px;">${otp}</span>
              </div>
              <p style="color: #6b7280; font-size: 14px;">This OTP is valid for <strong>5 minutes</strong>.</p>
              <p style="color: #6b7280; font-size: 12px; margin-top: 30px;">If you did not request this, please ignore this email.</p>
            </div>
          </div>
        `
      });

      console.log(`🔐 OTP sent to ${email}: ${otp}`);

      res.json({
        message: 'If an account exists with this email, an OTP has been sent.',
        maskedEmail: maskEmail(email),
        // Debug only - remove in production
        debugOtp: process.env.NODE_ENV !== 'production' ? otp : undefined
      });

    } catch (emailError) {
      console.error('Failed to send OTP email:', emailError);
      res.status(500).json({ error: 'Failed to send OTP email' });
    }

  } catch (error) {
    console.error('Generate OTP error:', error);
    res.status(500).json({ error: 'Failed to process request' });
  }
};


/* ===============================
   VERIFY OTP
================================ */
const verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ error: 'Email and OTP are required' });
    }

    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.status(400).json({ error: 'Invalid OTP' });
    }

    // Check if OTP matches and is not expired
    if (user.otp_code !== otp) {
      return res.status(400).json({ error: 'Invalid OTP' });
    }

    if (new Date() > new Date(user.otp_expires_at)) {
      return res.status(400).json({ error: 'OTP has expired' });
    }

    // Generate a temporary reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await user.update({
      reset_token: resetToken,
      reset_token_expires_at: resetTokenExpiresAt,
      // Clear OTP after verification
      otp_code: null,
      otp_expires_at: null
    });

    res.json({
      message: 'OTP verified successfully',
      resetToken,
      expiresAt: resetTokenExpiresAt
    });

  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({ error: 'Failed to verify OTP' });
  }
};


/* ===============================
   SEND RESET LINK (JWT TOKEN)
================================ */
const sendResetLink = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const user = await User.findOne({ where: { email } });

    if (!user) {
      // Don't reveal if user exists
      return res.status(200).json({
        message: 'If an account exists with this email, a reset link has been sent.',
        maskedEmail: maskEmail(email)
      });
    }

    // Generate JWT reset token (valid for 1 hour)
    const resetToken = jwt.sign(
      { userId: user.id, purpose: 'password-reset' },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    const resetLink = `https://charisbilleasy.store/reset-password?token=${resetToken}`;

    // Send reset link via Brevo API
    try {
      await sendEmailViaAPI({
        to: email,
        subject: 'Reset Your BillEasy Password',
        textContent: `
Hello ${user.name},

Click the link below to reset your password:

${resetLink}

This link is valid for 1 hour.

If you did not request this, please ignore this email.

Best regards,
BillEasy Team
        `,
        htmlContent: `
          <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px;">
            <div style="background: #2563eb; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
              <h2 style="margin: 0;">Reset Your Password</h2>
            </div>
            <div style="background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
              <p style="color: #374151; font-size: 16px;">Hello <strong>${user.name}</strong>,</p>
              <p style="color: #374151;">Click the button below to reset your password:</p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${resetLink}" style="background: #2563eb; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold;">Reset Password</a>
              </div>
              <p style="color: #6b7280; font-size: 14px; text-align: center;">Or copy this link:</p>
              <p style="background: #e5e7eb; padding: 10px; border-radius: 4px; font-size: 12px; word-break: break-all; color: #374151;">${resetLink}</p>
              <p style="color: #6b7280; font-size: 14px;">This link is valid for <strong>1 hour</strong>.</p>
              <p style="color: #6b7280; font-size: 12px; margin-top: 30px;">If you did not request this, please ignore this email.</p>
            </div>
          </div>
        `
      });

      console.log(`🔗 Reset link sent to ${email}`);

      res.json({
        message: 'If an account exists with this email, a reset link has been sent.',
        maskedEmail: maskEmail(email)
      });

    } catch (emailError) {
      console.error('Failed to send reset link:', emailError);
      res.status(500).json({ error: 'Failed to send reset link' });
    }

  } catch (error) {
    console.error('Send reset link error:', error);
    res.status(500).json({ error: 'Failed to process request' });
  }
};


/* ===============================
   RESET PASSWORD (via Token)
================================ */
const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ error: 'Token and new password are required' });
    }

    // Verify JWT token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (jwtError) {
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }

    // Check if token is for password reset
    if (decoded.purpose !== 'password-reset') {
      return res.status(400).json({ error: 'Invalid token purpose' });
    }

    const user = await User.findByPk(decoded.userId);

    if (!user) {
      return res.status(400).json({ error: 'User not found' });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await user.update({
      password: hashedPassword,
      reset_token: null,
      reset_token_expires_at: null
    });

    console.log(`🔑 Password reset successful for ${user.email}`);

    res.json({ message: 'Password reset successful' });

  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Failed to reset password' });
  }
};


/* ===============================
   RESET PASSWORD (via OTP)
================================ */
const resetPasswordWithOTP = async (req, res) => {
  try {
    const { resetToken, newPassword } = req.body;

    if (!resetToken || !newPassword) {
      return res.status(400).json({ error: 'Reset token and new password are required' });
    }

    // Find user with valid reset token
    const user = await User.findOne({
      where: {
        reset_token: resetToken,
        reset_token_expires_at: {
          [Op.gt]: new Date()
        }
      }
    });

    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password and clear tokens
    await user.update({
      password: hashedPassword,
      otp_code: null,
      otp_expires_at: null,
      reset_token: null,
      reset_token_expires_at: null
    });

    res.json({ message: 'Password reset successful' });

  } catch (error) {
    console.error('Reset password with OTP error:', error);
    res.status(500).json({ error: 'Failed to reset password' });
  }
};


// Legacy reset requests storage (in production use Redis)
const resetRequests = new Map();

/* ===============================
   LEGACY: REQUEST PASSWORD RESET
================================ */
const requestReset = async (req, res) => {
  try {
    const { email, phone } = req.body;
    
    if (!email && !phone) {
      return res.status(400).json({ error: 'Email or phone number required' });
    }

    const user = await User.findOne({
      where: email ? { email } : { phone }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const resetToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = Date.now() + 10 * 60 * 1000;
    
    resetRequests.set(resetToken, {
      userId: user.id,
      otp,
      expiresAt,
      email: user.email,
      phone: user.phone
    });

    console.log(`🔐 Password Reset OTP for ${user.email}: ${otp}`);

    res.json({
      message: 'OTP sent successfully',
      resetToken,
      debugOtp: process.env.NODE_ENV !== 'production' ? otp : undefined,
      maskedEmail: maskEmail(user.email),
      maskedPhone: user.phone ? `${user.phone.slice(0, 4)}****${user.phone.slice(-2)}` : null
    });

  } catch (error) {
    console.error('Request reset error:', error);
    res.status(500).json({ error: 'Failed to process reset request' });
  }
};

/* ===============================
   LEGACY: VERIFY OTP & RESET
================================ */
const verifyReset = async (req, res) => {
  try {
    const { resetToken, otp, newPassword } = req.body;

    const resetData = resetRequests.get(resetToken);
    
    if (!resetData) {
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }

    if (Date.now() > resetData.expiresAt) {
      resetRequests.delete(resetToken);
      return res.status(400).json({ error: 'OTP expired' });
    }

    if (resetData.otp !== otp) {
      return res.status(400).json({ error: 'Invalid OTP' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await User.update(
      { password: hashedPassword },
      { where: { id: resetData.userId } }
    );

    resetRequests.delete(resetToken);

    res.json({ message: 'Password reset successful' });

  } catch (error) {
    console.error('Verify reset error:', error);
    res.status(500).json({ error: 'Failed to reset password' });
  }
};

module.exports = {
  register,
  login,
  getProfile,
  updateProfile,
  changePassword,
  switchCompany,
  requestReset,
  verifyReset,
  generateAndSendOTP,
  verifyOTP,
  sendResetLink,
  resetPassword,
  resetPasswordWithOTP
};
