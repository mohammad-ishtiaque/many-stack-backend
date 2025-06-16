const express = require('express');
const { createAdmin, getAllAdmins,deleteAdmin,createSuperAdmin } = require('../../controllers/Dashboard/makeAdmin.controller');
const { auth, superadminAuth } = require('../../middleware/auth');


const router = express.Router();

router.post('/make-admin', auth, superadminAuth, createAdmin);
router.get('/admins', auth, superadminAuth, getAllAdmins);
router.delete('/admin/:id', auth, superadminAuth, deleteAdmin);
router.post('/create-superAdmin',  createSuperAdmin); // Assuming createAdmin can handle superadmin creation

module.exports = router;