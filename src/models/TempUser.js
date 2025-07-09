const mongoose = require('mongoose');

const tempUserSchema = new mongoose.Schema({
    firstName: String,
    lastName: String,
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: String,
    contact: String,
    currency: String,
    nSiren: String,
    address: {
        streetNo: String,
        streetName: String,
        city: String,
        postalCode: String,
        country: String
    },
    gender: String,
    role: String,
    verificationCode: String,
    verificationCodeExpires: Date,
    createdAt: {
        type: Date,
        default: Date.now,
        expires: 900 // Document will be automatically deleted after 15 minutes
    }
});

module.exports = mongoose.model('TempUser', tempUserSchema);