const mongoose = require('mongoose');
// const validator = require('validator');

const userSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: [true, 'First name is required'],
        trim: true
    },
    lastName: {
        type: String,
        required: [true, 'Last name is required'],
        trim: true
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        trim: true,
        lowercase: true
    },
    password: {
        type: String,
        required: [true, 'Password is required']
    },
    contact: {
        type: String,
        trim: true
    },
    nSiren: {
        type: String,
        trim: true
    },
    address: {
        streetNo: String,
        streetName: String,
        city: String,
        postalCode: String,
        country: String
    },
    countryCode: {
        type: String
    },
    currency: {
        type: String,
    },
    gender: {
        type: String,
        enum: ['MALE', 'FEMALE', 'OTHER']
    },
    profilePicture: {
        type: String,
        default: null
    },
    businessLogo: {
        type: String,
        default: null
    },
    role: { type: String, enum: ['user', 'admin', 'superadmin'], default: 'user' },
    isBlocked: { type: Boolean, default: false },
    //forgeet password code

    resetCode: { type: String },
    resetCodeExpires: { type: Date },

    //email verification fields
    isEmailVerified: {
        type: Boolean,
        default: false
    },
    verificationCode: {
        type: String
    },
    verificationCodeExpires: {
        type: Date
    },
    // Stripe customer ID
    stripeCustomerId: {
        type: String,
        default: null
    },
    subscription: {
        plan: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Subscription'
        },
        isActive: {
            type: Boolean,
            default: false
        },
        isTrial: {
            type: Boolean,
            default: false
        },
        startDate: {
            type: Date
        },
        endDate: {
            type: Date
        }
    },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
    createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);