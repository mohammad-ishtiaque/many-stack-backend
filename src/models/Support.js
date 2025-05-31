const mongoose = require('mongoose');

const supportSchema = new mongoose.Schema({

subject: {
        type: String,
        required: true,
        trim: true,
    },

    message: {
        type: String,
        required: true,
        trim: true,
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },

    
}, { timestamps: true });

const Support = mongoose.model('Support', supportSchema);

module.exports = Support;
