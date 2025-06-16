const express = require('express');
const router = express.Router();
const { getAllUsers, getUserDetails, blockUser, unblockUser } = require('../../controllers/Dashboard/UserManagement.controller');
const { auth, adminOrSuperadmin } = require('../../middleware/auth');



router.get('/user-management/getAllUsers', auth, adminOrSuperadmin, getAllUsers);
router.get('/user-management/getUserDetails/:id', auth, adminOrSuperadmin, getUserDetails); // Assuming you want to use the same controller for details as well
router.put('/user-management/blockUser/:id', auth, adminOrSuperadmin, blockUser); // Assuming you want to use the same controller for blocking as well
router.put('/user-management/unBlockUser/:id', auth, adminOrSuperadmin, unblockUser); // Assuming you want to use the same controller for blocking as well


module.exports = router;