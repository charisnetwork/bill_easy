const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { AdminUser, AdminOTP } = require('../models/adminModels');
const { Op } = require('sequelize');

const ADMIN_EMAIL = 'pachu.mgd@gmail.com';
const ADMIN_PHONE = '9986995848';

exports.login = async (req, res) => {
  const { identifier, password } = req.body;

  if (identifier !== ADMIN_EMAIL && identifier !== ADMIN_PHONE) {
    return res.status(403).json({ error: "Unauthorized user" });
  }

  // Ensure Admin user exists
  let admin = await AdminUser.findOne({ where: { email: ADMIN_EMAIL } });
  if (!admin) {
    const hashedPassword = await bcrypt.hash('admin123', 10); // Default temp password
    admin = await AdminUser.create({
      email: ADMIN_EMAIL,
      phone: ADMIN_PHONE,
      password: hashedPassword
    });
  }

  const isMatch = await bcrypt.compare(password, admin.password);
  if (!isMatch) {
    return res.status(400).json({ error: "Invalid password" });
  }

  // Check if password reset is needed (30 days)
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const needsReset = admin.last_password_reset < thirtyDaysAgo;

  const token = jwt.sign(
    { id: admin.id, role: 'admin' },
    process.env.JWT_SECRET || 'admin_secret_key',
    { expiresIn: '24h' }
  );

  res.json({
    token,
    needsReset,
    message: needsReset ? "Password reset required (30 days policy)" : "Login successful"
  });
};

exports.requestOTP = async (req, res) => {
  const { identifier } = req.body; // email or phone

  if (identifier !== ADMIN_EMAIL && identifier !== ADMIN_PHONE) {
    return res.status(403).json({ error: "Unauthorized user" });
  }

  // Ensure Admin user exists
  let admin = await AdminUser.findOne({ where: { email: ADMIN_EMAIL } });
  if (!admin) {
    const hashedPassword = await bcrypt.hash('admin123', 10); // Default temp password
    admin = await AdminUser.create({
      email: ADMIN_EMAIL,
      phone: ADMIN_PHONE,
      password: hashedPassword
    });
  }

  // Generate 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expires_at = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

  await AdminOTP.create({
    email: ADMIN_EMAIL,
    otp,
    expires_at
  });

  // In a real app, send OTP via email/SMS here.
  // For now, we return it for testing/convenience as requested or just log it.
  console.log(`[ADMIN OTP] Code for ${ADMIN_EMAIL}: ${otp}`);

  res.json({ message: "OTP sent successfully", dev_otp: otp });
};

exports.verifyOTPAndLogin = async (req, res) => {
  const { identifier, otp, password } = req.body;

  if (identifier !== ADMIN_EMAIL && identifier !== ADMIN_PHONE) {
    return res.status(403).json({ error: "Unauthorized user" });
  }

  const validOtp = await AdminOTP.findOne({
    where: {
      email: ADMIN_EMAIL,
      otp,
      expires_at: { [Op.gt]: new Date() },
      verified: false
    }
  });

  if (!validOtp) {
    return res.status(400).json({ error: "Invalid or expired OTP" });
  }

  const admin = await AdminUser.findOne({ where: { email: ADMIN_EMAIL } });
  
  const isMatch = await bcrypt.compare(password, admin.password);
  if (!isMatch) {
    return res.status(400).json({ error: "Invalid password" });
  }

  // Mark OTP as used
  validOtp.verified = true;
  await validOtp.save();

  // Check if password reset is needed (30 days)
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const needsReset = admin.last_password_reset < thirtyDaysAgo;

  const token = jwt.sign(
    { id: admin.id, role: 'admin' },
    process.env.JWT_SECRET || 'admin_secret_key',
    { expiresIn: '24h' }
  );

  res.json({
    token,
    needsReset,
    message: needsReset ? "Password reset required (30 days policy)" : "Login successful"
  });
};

exports.resetPassword = async (req, res) => {
  const { newPassword } = req.body;
  const adminId = req.user.id;

  const hashedPassword = await bcrypt.hash(newPassword, 10);
  await AdminUser.update(
    { 
      password: hashedPassword, 
      last_password_reset: new Date() 
    },
    { where: { id: adminId } }
  );

  res.json({ message: "Password reset successfully" });
};
