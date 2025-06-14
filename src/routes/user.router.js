const express = require('express');
const router = express.Router();
const userController = require('../controllers/User.controller');
const authController = require('../controllers/Auth.controller');
const { auth } = require('../middleware/auth');
const upload = require('../utils/Upload');
router.get('/profile', auth,  userController.getUser);
router.put('/profile/update',auth,  userController.updateUser);
router.post('/logout', auth, authController.logout);
router.put('/profile/change-password', auth, userController.changePassword);
router.post('/profile/upload-logo', auth, upload.single('businessLogo'), userController.uploadBusinessLogo);


module.exports = router;
