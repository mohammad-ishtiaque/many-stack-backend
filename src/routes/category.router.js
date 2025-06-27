const express = require('express');
const categoryController = require('../controllers/Category.controller');
const { userAuth } = require('../middleware/auth');

const router = express.Router();

// Create new category
router.post('/create', userAuth, categoryController.createCategory);

// Get all categories
router.get('/get-all', userAuth, categoryController.getAllCategories);

// Update category
router.put('/update/:id', userAuth, categoryController.updateCategory);

// Delete category
router.delete('/delete/:id', userAuth, categoryController.deleteCategory);

module.exports = router;
