const express = require('express');
const categoryController = require('../controllers/Category.controller');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Create new category
router.post('/create', auth, categoryController.createCategory);

// Get all categories
router.get('/get-all', auth, categoryController.getAllCategories);

// Update category
router.put('/update/:id', auth, categoryController.updateCategory);

// Delete category
router.delete('/delete/:id', auth, categoryController.deleteCategory);

module.exports = router;
