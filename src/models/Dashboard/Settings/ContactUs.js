const mongoose = require('mongoose');

const contactUsSchema = new mongoose.Schema({
    email: {
        type: [String],
        required: true
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

const ContactUs = mongoose.model('ContactUs', contactUsSchema);

module.exports = ContactUs;