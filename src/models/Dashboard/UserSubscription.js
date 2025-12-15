const mongoose = require('mongoose');

const userSubscriptionSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    subscription: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Subscription',
    },
    stripeCustomerId: {
        type: String,
    },
    stripeSubscriptionId: {
        type: String,
    },
    stripePriceId: {
        type: String
    },
    status: {
        type: String,
        enum: ['active', 'canceled', 'incomplete', 'incomplete_expired', 'past_due', 'trialing', 'unpaid'],
        default: 'incomplete'
    },
    currentPeriodStart: {
        type: Date
    },
    currentPeriodEnd: {
        type: Date
    },
    cancelAtPeriodEnd: {
        type: Boolean,
        default: false
    },
    canceledAt: {
        type: Date
    },
    trialStart: {
        type: Date
    },
    trialEnd: {
        type: Date
    },
    trialPeriodDays: {
        type: Number,
        default: 0,
        min: 0
    },
    amount: {
        type: Number,
    },
    currency: {
        type: String,
        default: 'usd'
    },
    interval: {
        type: String,
        enum: ['month', 'year'],
        required: true
    },
    intervalCount: {
        type: Number,
        default: 1
    },
    metadata: {
        type: Map,
        of: String
    },
    isActive: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

// Index for efficient queries
userSubscriptionSchema.index({ user: 1, isActive: 1 });
userSubscriptionSchema.index({ stripeSubscriptionId: 1 });
userSubscriptionSchema.index({ status: 1 });

const UserSubscription = mongoose.model('UserSubscription', userSubscriptionSchema);

module.exports = UserSubscription; 