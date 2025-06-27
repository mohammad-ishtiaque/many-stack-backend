const express = require('express');
const router = express.Router();
const { getAllUsers, getUserDetails, blockUser, unblockUser } = require('../../controllers/Dashboard/UserManagement.controller');
const {  adminOrSuperAdminAuth } = require('../../middleware/auth');



router.get('/user-management/getAllUsers',  adminOrSuperAdminAuth, getAllUsers);
router.get('/user-management/getUserDetails/:id',  adminOrSuperAdminAuth, getUserDetails); // Assuming you want to use the same controller for details as well
router.put('/user-management/blockUser/:id',  adminOrSuperAdminAuth, blockUser); // Assuming you want to use the same controller for blocking as well
router.put('/user-management/unBlockUser/:id',  adminOrSuperAdminAuth, unblockUser); // Assuming you want to use the same controller for blocking as well


module.exports = router;