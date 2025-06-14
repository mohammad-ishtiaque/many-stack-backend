const AllCategory = require('../../models/Dashboard/AllCategory');

exports.createCategory = async (req, res) => {
    try {
        const { categoryType, categoryName, price } = req.body;

        // Validate required fields
        if (!categoryType || !categoryName) {
            return res.status(400).json({ message: 'Category type and name are required.' });
        }

        // Create new category
        const newCategory = new AllCategory({
            categoryType,
            categoryName,
            price
        });

        await newCategory.save();
        res.status(201).json({ message: 'Category created successfully', data: newCategory });
    } catch (error) {
        console.error('Error creating category:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

exports.getAllCategories = async (req, res) => {
    try {
        const categories = await AllCategory.find();
        res.status(200).json({ message: 'Categories retrieved successfully', data: categories });
    } catch (error) {
        console.error('Error retrieving categories:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}


exports.updateCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const { categoryType, categoryName, price } = req.body;

        // Validate required fields
        if (!categoryType || !categoryName) {
            return res.status(400).json({ message: 'Category type and name are required.' });
        }

        // Update category
        const updatedCategory = await AllCategory.findByIdAndUpdate(id, {
            categoryType,
            categoryName,
            price
        }, { new: true });

        if (!updatedCategory) {
            return res.status(404).json({ message: 'Category not found.' });
        }

        res.status(200).json({ message: 'Category updated successfully', data: updatedCategory });
    } catch (error) {
        console.error('Error updating category:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

exports.deleteCategory = async (req, res) => {
    try {
        const { id } = req.params;

        // Delete category
        const deletedCategory = await AllCategory.findByIdAndDelete(id);

        if (!deletedCategory) {
            return res.status(404).json({ message: 'Category not found.' });
        }

        res.status(200).json({ message: 'Category deleted successfully' });
    } catch (error) {
        console.error('Error deleting category:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

exports.getCategoryById = async (req, res) => {
    try {
        const { id } = req.params;

        // Find category by ID
        const category = await AllCategory.findById(id);

        if (!category) {
            return res.status(404).json({ message: 'Category not found.' });
        }

        res.status(200).json({ message: 'Category retrieved successfully', data: category });
    } catch (error) {
        console.error('Error retrieving category:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

