const express = require('express');
const router = express.Router();

const { updateAdmin, updatePassword } = require('../../controllers/Dashboard/Admin.controller');
const {auth, adminOrSuperadmin} = require('../../middleware/auth');

router.put('/update-admin', auth, adminOrSuperadmin, updateAdmin);
router.put('/update-password', auth, adminOrSuperadmin, updatePassword);

module.exports = router;
