const Category = require('../models/Category');

exports.createCategory = async (req, res) => {
    try {
        const { name, price } = req.body;

        // Get user ID from auth token
        const userId = req.user.id || req.user._id;

        // Check if category already exists
        // const existingCategory = await Category.findOne({ 
        //     name: name.trim(),
        //     user: userId
        // });
        
        // if (existingCategory) {
        //     return res.status(400).json({
        //         success: false,
        //         message: 'You already have a category with this name'
        //     });
        // }

        // Validate price
        if (price < 0) {
            return res.status(400).json({
                success: false,
                message: 'Price cannot be negative'
            });
        }

        // Create category with user reference from token
        const category = await Category.create({ 
            name: name.trim(),
            price,
            user: userId
        });

        // Populate user details in response
        // await category.populate('user', 'firstName lastName email');

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
        // Get user ID from auth token
        const userId = req.user.id || req.user._id;

        // Find categories for the authenticated user
        const categories = await Category.find({ user: userId })
            .sort({ name: 1 })
            // .populate('user');

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
        const userId = req.user.id || req.user._id;

        // First check if the category exists and belongs to the user
        const existingCategory = await Category.findOne({ _id: id, user: userId });
        
        if (!existingCategory) {
            return res.status(404).json({
                success: false,
                message: 'Category not found or you do not have permission to update it'
            });
        }

        // If name is being updated, check for duplicates
        if (name && name !== existingCategory.name) {
            const duplicateCategory = await Category.findOne({
                name: name.trim().toUpperCase(),
                user: userId,
                _id: { $ne: id }
            });
            
            if (duplicateCategory) {
                return res.status(400).json({
                    success: false,
                    message: 'You already have a category with this name'
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

        // Update the category
        const category = await Category.findOneAndUpdate(
            { _id: id, user: userId },
            { 
                name: name ? name.trim() : undefined,
                price
            }, 
            { 
                new: true,
                runValidators: true
            }
        )
        // populate('user', 'firstName lastName email');

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
        const userId = req.user.id || req.user._id;

        // Find and delete category only if it belongs to the user
        const category = await Category.findOneAndDelete({ _id: id, user: userId });
        
        if (!category) {
            return res.status(404).json({
                success: false,
                message: 'Category not found or you do not have permission to delete it'
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
};




