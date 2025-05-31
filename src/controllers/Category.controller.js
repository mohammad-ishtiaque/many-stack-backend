const Category = require('../models/Category');

exports.createCategory = async (req, res) => {
    try {
        const { name, price } = req.body;

        // Check if category already exists
        const existingCategory = await Category.findOne({ name: name.trim().toUpperCase() });
        if (existingCategory) {
            return res.status(400).json({
                success: false,
                message: 'Category with this name already exists'
            });
        }

        // Validate price
        if (price < 0) {
            return res.status(400).json({
                success: false,
                message: 'Price cannot be negative'
            });
        }

        const category = await Category.create({ 
            name: name.trim(),
            price 
        });

        res.status(201).json({
            success: true,
            category
        });
        
    } catch (error) {
        // Handle different types of errors
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: 'Category with this name already exists'
            });
        }
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
} 

exports.getAllCategories = async (req, res) => {
    try {
        const categories = await Category.find().sort({ name: 1 }); // Sort by name ascending
        res.status(200).json({
            success: true,
            count: categories.length,
            categories
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
}

exports.updateCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, price } = req.body;

        // If name is being updated, check for duplicates
        if (name) {
            const existingCategory = await Category.findOne({
                name: name.trim().toUpperCase(),
                _id: { $ne: id } // Exclude current category
            });
            
            if (existingCategory) {
                return res.status(400).json({
                    success: false,
                    message: 'Category with this name already exists'
                });
            }
        }

        // Validate price if it's being updated
        if (price !== undefined && price < 0) {
            return res.status(400).json({
                success: false,
                message: 'Price cannot be negative'
            });
        }

        const category = await Category.findByIdAndUpdate(
            id, 
            { 
                name: name ? name.trim() : undefined,
                price
            }, 
            { 
                new: true,
                runValidators: true
            }
        );

        if (!category) {
            return res.status(404).json({
                success: false,
                message: 'Category not found'
            });
        }

        res.status(200).json({
            success: true,
            category
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: 'Category with this name already exists'
            });
        }
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
}   

exports.deleteCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const category = await Category.findByIdAndDelete(id);
        
        if (!category) {
            return res.status(404).json({
                success: false,
                message: 'Category not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Category deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
}   




