const express = require('express');
const { createAdmin, getAllAdmins,deleteAdmin,createSuperAdmin } = require('../../controllers/Dashboard/MakeAdmin.controller');
const {  superAdminAuth } = require('../../middleware/auth');


const router = express.Router();

router.post('/make-admin',  superAdminAuth, createAdmin);
router.get('/admins',  superAdminAuth, getAllAdmins);
router.delete('/admin/:id',  superAdminAuth, deleteAdmin);
router.post('/create-superAdmin',  createSuperAdmin); // Assuming createAdmin can handle superadmin creation

module.exports = router;