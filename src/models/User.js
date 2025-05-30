const mongoose = require('mongoose');
// const validator = require('validator');

const userSchema = new mongoose.Schema({
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    contact: {
        type: String, required: true,
        // validate: {
        //     validator: (v) => validator.isMobilePhone(v, 'any'),
        //     message: 'Invalid phone number'
        // }
    },
    nSiren: { type: String },
    address: {
        streetNo: String,
        streetName: String,
        city: String,
        postalCode: String,
        country: String
    },
    gender: { type: String, enum: ['Male', 'Female', 'Other'] },
    password: { type: String, required: true },
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