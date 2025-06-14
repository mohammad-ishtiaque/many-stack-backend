const mongoose = require('mongoose');

const termsConditionsSchema = new mongoose.Schema({
    content: {
        type: String,
        required: true
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

const TermsConditions = mongoose.model('TermsConditions', termsConditionsSchema);

module.exports = TermsConditions;