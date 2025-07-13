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
        enum: ['MONTHLY', 'ANNUALLY', 'FREE'],
        default: 'MONTHLY'
    },
    features: {
        type: [String],
        default: ['Access to all categories', 'Priority support', 'Exclusive content']
    },
    trialPeriodDays: {
        type: Number,
        default: 0,
        min: 0
    },
    isActive: {
        type: Boolean,
        default: false
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