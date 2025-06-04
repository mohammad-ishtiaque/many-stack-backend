const Expense = require('../models/Expense');
const { deleteFile } = require('../utils/unLinkFiles');

exports.createExpense = async (req, res) => {

    try {
        const { expenseName, expenseCategory, price, note } = req.body;
        const images = req.files ? req.files.map(file => file.path) : [];
        const userId = req.user.id || req.user._id;


        const expense = await Expense.create({
            expenseName,
            expenseCategory,
            price,
            note,
            images,
            user: userId,
        });

        res.status(201).json({
            success: true,
            message: 'Expense created successfully',
            expense,
        });


    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

exports.getAllExpenses = async (req, res) => {
    try {
        const expenses = await Expense.find();
        res.status(200).json({
            success: true,
            expenses,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};


exports.getExpenseById = async (req, res) => {
    try {
        const { id } = req.params;
        const expense = await Expense.findById(id);
        if (!expense) {
            return res.status(404).json({
                success: false,
                message: 'Expense not found',
            });
        }
        res.status(200).json({
            success: true,
            expense,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};


exports.updateExpense = async (req, res) => {
    try {
        const { id } = req.params;

        const existingExpense = await Expense.findById(id);
        if (!existingExpense) {
            return res.status(404).json({
                success: false,
                message: 'Expense not found',
            });
        }

        // Get new images if any were uploaded
        const newImages = req.files ? req.files.map(file => file.path) : [];

        const { expenseName, expenseCategory, price, note } = req.body;
        // Prepare update data
        const updateData = {
            expenseName,
            expenseCategory,
            price,
            note,
        };

        // If new images were uploaded, combine them with existing images
        if (newImages.length > 0) {
            updateData.images = [...(existingExpense.images || []), ...newImages];
        }

        const expense = await Expense.findByIdAndUpdate(id, updateData, { new: true });

        res.status(200).json({
            success: true,
            message: 'Expense updated successfully',
            expense,
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

exports.deleteExpense = async (req, res) => {
    try {
        const { id } = req.params;
        const existingExpense = await Expense.findById(id);
        const userId = req.user.id || req.user._id;
        if (existingExpense.user.toString() !== userId) {
            return res.status(403).json({ message: 'Not authorized to delete this expense' });
        }

        if (existingExpense.images && existingExpense.images.length > 0) {
            for (const imagesPath of existingExpense.images) {
                await deleteFile(imagesPath);
            }
        }

        await Expense.findByIdAndDelete(id);
        res.status(200).json({
            success: true,
            message: 'Expense deleted successfully',
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};





