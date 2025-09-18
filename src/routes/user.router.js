const express = require('express');
const router = express.Router();
const userController = require('../controllers/User.controller');
const authController = require('../controllers/Auth.controller');
const { userAuth } = require('../middleware/auth');
// const upload = require('../utils/Upload');
const s3Upload = require('../middleware/s3.upload');



router.get('/profile', userAuth,  userController.getUser);
router.put('/profile/update',userAuth,  userController.updateUser);
router.post('/logout', userAuth, authController.logout);
router.put('/profile/change-password', userAuth, userController.changePassword);
router.post('/profile/upload-logo', userAuth, s3Upload.single('businessLogo'), userController.uploadBusinessLogo);
router.post('/profile/upload-picture', userAuth, s3Upload.single('profilePicture'), userController.uploadProfilePicture);
router.put('/profile/update-picture', userAuth, s3Upload.single('profilePicture'), userController.updateProfilePicture);
router.get('/subscription', userAuth, userController.getTheSubscription);
router.delete('/delete', userAuth, userController.deleteUser);


module.exports = router;
