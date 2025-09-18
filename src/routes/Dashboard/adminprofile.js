const express = require('express');
const router = express.Router();

const { updateAdmin, updatePassword, adminForgetPassword, adminVerifyCode, adminResendCode, getAdminProfile, resetAdminPassword } = require('../../controllers/Dashboard/Admin.controller');
const { adminOrSuperAdminAuth } = require('../../middleware/auth');
// const upload = require('../../utils/Upload');
const s3Upload = require('../../middleware/s3.upload');

router.put('/update-admin', adminOrSuperAdminAuth, s3Upload.single('image'), updateAdmin);
router.put('/update-password', adminOrSuperAdminAuth, updatePassword);
// router.post('/login', adminLogin);
router.post('/forget-password', adminForgetPassword);
router.post('/verify-code', adminVerifyCode);
router.post('/reset-password', resetAdminPassword);
router.post('/resend-code', adminResendCode);
router.get('/get-profile', adminOrSuperAdminAuth, getAdminProfile);



module.exports = router;
