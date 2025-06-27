const express = require('express');
const router = express.Router();

const {
    createCategory,
    getAllCategories,
    updateCategory,
    deleteCategory,
    getCategoryById
} = require('../../controllers/Dashboard/AllCategory.controller');      
const { adminOrSuperAdminAuth } = require('../../middleware/auth');

router.post('/create', adminOrSuperAdminAuth, createCategory);
router.get('/all', adminOrSuperAdminAuth, getAllCategories);
router.put('/update/:id', adminOrSuperAdminAuth, updateCategory);
router.delete('/delete/:id', adminOrSuperAdminAuth, deleteCategory);
router.get('/:id', adminOrSuperAdminAuth, getCategoryById);

module.exports = router;