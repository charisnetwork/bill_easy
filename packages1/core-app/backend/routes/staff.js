const express = require('express');
const router = express.Router();
const { getStaff, addStaff, recordAttendance } = require('../controllers/staffController');
const { authenticateToken, requireRole, checkFeatureAccess } = require('../middleware/auth');
const companyContext = require('../middleware/companyContext');

router.use(authenticateToken);
router.use(companyContext);
router.use(checkFeatureAccess('staff_attendance_payroll'));

router.get('/', getStaff);
router.post('/', requireRole('owner', 'admin'), addStaff);
router.post('/attendance', requireRole('owner', 'admin'), recordAttendance);

module.exports = router;
