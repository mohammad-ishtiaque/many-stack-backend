const express = require('express');
const router = express.Router();

const { updateAdmin, updatePassword } = require('../../controllers/Dashboard/Admin.controller');
const { adminOrSuperAdminAuth } = require('../../middleware/auth');

router.put('/update-admin', adminOrSuperAdminAuth, updateAdmin);
router.put('/update-password', adminOrSuperAdminAuth, updatePassword);

module.exports = router;
