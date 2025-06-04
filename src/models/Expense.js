const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({

    expenseName: {
        type: String,
        required: true,
    },
    expenseCategory: {
        type: String,
        required: true,
    },
    price: {
        type: Number,
        required: true,
    },
    note: {
        type: String,
    },
    images: {
        type: [String],
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
}, { timestamps: true });

module.exports = mongoose.model('Expense', expenseSchema);
    