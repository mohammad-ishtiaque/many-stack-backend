const express = require('express');
const router = express.Router();

const {
    createCategory,
    getAllCategories,
    updateCategory,
    deleteCategory,
    getCategoryById
} = require('../../controllers/Dashboard/AllCategory.controller');      
const {auth, adminAuth } = require('../../middleware/auth');

router.post('/create',auth, adminAuth, createCategory);
router.get('/all',auth, adminAuth, getAllCategories);
router.put('/update/:id',auth, adminAuth, updateCategory);
router.delete('/delete/:id',auth, adminAuth, deleteCategory);
router.get('/:id',auth, adminAuth, getCategoryById);

module.exports = router;