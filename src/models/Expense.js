const mongoose = require('mongoose');


const imageSchema = new mongoose.Schema({
    url: { type: String },
    location: { type: String },
    createdAt: { type: Date, default: Date.now }
});

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
    images: [imageSchema],
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
}, { timestamps: true });

module.exports = mongoose.model('Expense', expenseSchema);
    