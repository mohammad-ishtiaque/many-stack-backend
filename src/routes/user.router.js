const express = require('express');
const router = express.Router();
const userController = require('../controllers/User.controller');
const authController = require('../controllers/Auth.controller');
const { auth } = require('../middleware/auth');

router.get('/profile', auth,  userController.getUser);
router.put('/profile/update',auth,  userController.updateUser);
router.post('/logout', auth, authController.logout);
router.put('/profile/change-password', auth, userController.changePassword);
module.exports = router;
