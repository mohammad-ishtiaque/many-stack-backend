const express = require('express');
const router = express.Router();
const { getUser, updateUser, changePassword } = require('../controllers/User.controller');
const { auth } = require('../middleware/auth');

// Protected routes - require authentication
router.get('/profile', auth, getUser);
router.put('/profile', auth, updateUser);
router.put('/change-password', auth, changePassword);

module.exports = router; 