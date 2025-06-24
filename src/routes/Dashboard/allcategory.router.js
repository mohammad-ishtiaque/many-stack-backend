const express = require('express');
const router = express.Router();

const {
    createCategory,
    getAllCategories,
    updateCategory,
    deleteCategory,
    getCategoryById
} = require('../../controllers/Dashboard/AllCategory.controller');      
const {auth, adminOrSuperadmin } = require('../../middleware/auth');

router.post('/create',auth, adminOrSuperadmin, createCategory);
router.get('/all',auth, adminOrSuperadmin, getAllCategories);
router.put('/update/:id',auth, adminOrSuperadmin, updateCategory);
router.delete('/delete/:id',auth, adminOrSuperadmin, deleteCategory);
router.get('/:id',auth, adminOrSuperadmin, getCategoryById);

module.exports = router;