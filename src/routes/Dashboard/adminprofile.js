const express = require('express');
const router = express.Router();

const { updateAdmin, updatePassword, adminForgetPassword, adminVerifyCode, adminResendCode, adminLogin, resetAdminPassword } = require('../../controllers/Dashboard/Admin.controller');
const { adminOrSuperAdminAuth } = require('../../middleware/auth');

router.put('/update-admin', adminOrSuperAdminAuth, updateAdmin);
router.put('/update-password', adminOrSuperAdminAuth, updatePassword);
router.post('/login', adminLogin);
router.post('/forget-password', adminForgetPassword);
router.post('/verify-code', adminVerifyCode);
router.post('/reset-password', resetAdminPassword);
router.post('/resend-code', adminResendCode);


module.exports = router;
