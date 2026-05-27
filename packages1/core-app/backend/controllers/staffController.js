const { Staff, StaffAttendance } = require('../models');

const getStaff = async (req, res) => {
  try {
    const staff = await Staff.findAll({ where: { company_id: req.companyId } });
    res.json(staff);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch staff' });
  }
};

const addStaff = async (req, res) => {
  try {
    const { name, phone, role, salary } = req.body;
    const staff = await Staff.create({
      company_id: req.companyId,
      name, phone, role, salary
    });
    res.status(201).json(staff);
  } catch (error) {
    res.status(500).json({ error: 'Failed to add staff member' });
  }
};

const recordAttendance = async (req, res) => {
  try {
    const { staff_id, date, status, notes } = req.body;
    const attendance = await StaffAttendance.create({
      staff_id, date, status, notes
    });
    res.status(201).json(attendance);
  } catch (error) {
    res.status(500).json({ error: 'Failed to record attendance' });
  }
};

module.exports = { getStaff, addStaff, recordAttendance };
