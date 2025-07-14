const express = require('express');
const router = express.Router();
const userController = require('../controllers/User.controller');
const authController = require('../controllers/Auth.controller');
const { userAuth } = require('../middleware/auth');
const upload = require('../utils/Upload');
router.get('/profile', userAuth,  userController.getUser);
router.put('/profile/update',userAuth,  userController.updateUser);
router.post('/logout', userAuth, authController.logout);
router.put('/profile/change-password', userAuth, userController.changePassword);
router.post('/profile/upload-logo', userAuth, upload.single('businessLogo'), userController.uploadBusinessLogo);
router.post('/profile/upload-picture', userAuth, upload.single('profilePicture'), userController.uploadProfilePicture);
router.put('/profile/update-picture', userAuth, upload.single('profilePicture'), userController.updateProfilePicture);
router.get('/subscription', userAuth, userController.getTheSubscription);



module.exports = router;
