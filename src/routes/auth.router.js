const express = require('express');
const router = express.Router();
const authController = require('../controllers/Auth.controller');

router.post('/register',  authController.register);
router.post('/verify-email', authController.verifyEmail);
router.post('/login', authController.login);
router.post('/forgot-password', authController.forgotPassword);
router.post('/verify-code', authController.verifyCode);
router.post('/reset-password', authController.resetPassword);
router.post('/logout',  authController.logout);

module.exports = router;
