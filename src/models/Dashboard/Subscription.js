const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        default: 'Premium subscription'
    },
    price: {
        type: Number,
        required: true,
    },
    validity: {
        type: String,
        required: true,
        enum: ['Monthly', 'Yearly'],
        default: 'Monthly'
    },
    features: {
        type: [String],
        required: true,
        default: ['Access to all categories', 'Priority support', 'Exclusive content']
    },
    isActive: {
        type: Boolean,
        default: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

const Subscription = mongoose.model('Subscription', subscriptionSchema);

module.exports = Subscription;