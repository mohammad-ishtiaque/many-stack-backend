const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Category name is required'],
        unique: true,
        trim: true,
        uppercase: true
    },
    price: {
        type: Number,
        required: [true, 'Price is required'],
        min: [0, 'Price cannot be negative']
    },
}, {
    timestamps: true
}); 

// Add a pre-save hook to handle name formatting
categorySchema.pre('save', function(next) {
    // Ensure name is properly formatted
    if (this.name) {
        this.name = this.name.trim().toUpperCase();
    }
    next();
});

const Category = mongoose.model('Category', categorySchema);

module.exports = Category;
