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
    gender: {
        type: String,
        enum: ['Male', 'Female', 'Other']
    },
    profilePicture: {
        type: String,
        default: 'uploads/profile-pictures/default.png'
    },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    isBlocked: { type: Boolean, default: false },
    resetCode: { type: String },
    resetCodeExpires: { type: Date },
    subscription: {
        plan: { type: mongoose.Schema.Types.ObjectId, ref: 'Subscription' },
        startDate: Date,
        endDate: Date
    },
    createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);