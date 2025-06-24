const mongoose = require('mongoose');

const allCategorySchema = new mongoose.Schema({
    categoryType: {
        type: String,
        required: true,
        enum: ['INTERVENTION', 'EXPENSE'],
    },
    categoryName: {
        type: String,
        required: true,
        unique:true,
        trim: true,
    },
    price: {
        type: Number,
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    },
}, { timestamps: true });

const AllCategory = mongoose.model('AllCategory', allCategorySchema);
module.exports = AllCategory;
