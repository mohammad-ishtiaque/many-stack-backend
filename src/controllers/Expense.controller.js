const Expense = require('../models/Expense');
const { deleteFile } = require('../utils/unLinkFiles');
const { getLocationName } = require('../utils/geocoder');

const singleDocToPDF = require('../utils/downloadpdf');

exports.createExpense = async (req, res) => {
    try {
        const { expenseName, expenseCategory, price, note, latitude, longitude } = req.body;
        const userId = req.user.id || req.user._id;

        // Get location name once for all images
        let location = 'Unknown Location';
        if (latitude && longitude) {
            location = await getLocationName(latitude, longitude);
        }

        // Process all images with the same location
        const images = req.files ? req.files.map(file => ({
            url: file.path,
            location: location,
            createdAt: new Date()
        })) : [];

        const expense = await Expense.create({
            expenseName,
            expenseCategory,
            price,
            note,
            images,
            user: userId,
        });

        await expense.populate('expenseCategory');

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
        const userId = req.user.id || req.user._id;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        const search = req.query.search || '';


        const fromDate = req.query.fromDate ? new Date(req.query.fromDate) : new Date(0);
        const toDate = req.query.toDate ? new Date(req.query.toDate) : new Date();

        // console.log(fromDate, toDate);
        let query = { user: userId };

        if (fromDate || toDate) {
            query.createdAt = {};
            if (fromDate) {
                fromDate.setHours(0, 0, 0, 0); // Set to start of the day
                query.createdAt.$gte = fromDate;
                // console.log(query.createdAt);
            }
            if (toDate) {
                toDate.setHours(23, 59, 59, 999); // Set to end of the day
                query.createdAt.$lte = toDate;
            }
        }

        // Search filter by catagory
        if (search) {
            query.expenseCategory = { $regex: search, $options: 'i' };
        }

        // Get total count with applied filters
        const totalCount = await Expense.countDocuments(query);
        const ex = await Expense.find()
        const totalExpense = ex.reduce((sum, exp) => sum + (exp.price || 0), 0);

        // Get filtered and paginated expenses
        const expenses = await Expense.find(query)
            .populate('expenseCategory')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .exec();


        if (expenses.length === 0) {
            return res.status(200).json({
                success: true,
                expenses: [],
                message: 'No expenses found for the given filters.',
                pagination: {
                    currentPage: page,
                    totalPages: 0,
                    totalItems: 0,
                    itemsPerPage: limit,
                    hasMore: false,
                    dateFilter: {
                        fromDate: fromDate?.toISOString(),
                        toDate: toDate?.toISOString()
                    }
                }
            });
        }

        res.status(200).json({
            success: true,
            expenses,
            totalExpense,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(totalCount / limit),
                totalItems: totalCount,
                itemsPerPage: limit,
                hasMore: totalCount > (skip + expenses.length),
                dateFilter: {
                    fromDate: fromDate?.toISOString(),
                    toDate: toDate?.toISOString()
                }
            }

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

        await expense.populate('expenseCategory');
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
        const { expenseName, expenseCategory, price, note, latitude, longitude } = req.body;

        const existingExpense = await Expense.findById(id);
        if (!existingExpense) {
            return res.status(404).json({
                success: false,
                message: 'Expense not found',
            });
        }

        // Get location name if new images are being added
        let location = 'Unknown Location';
        if (req.files && req.files.length > 0 && latitude && longitude) {
            location = await getLocationName(latitude, longitude);
        }

        // Process new images with location
        const newImages = req.files ? req.files.map(file => ({
            url: file.path,
            location: location,
            createdAt: new Date()
        })) : [];

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


exports.downloadSingleExpensePDF = async (req, res) => {
    try {
        const { id } = req.params;
        const expense = await Expense.findById(id);

        if (!expense) {
            return res.status(404).json({
                success: false,
                message: 'Expense not found'
            });
        }

        singleDocToPDF.generateExpensePDF(expense, res); // Directly streams PDF
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


