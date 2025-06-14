const mongoose = require('mongoose');

const privacyPolicySchema = new mongoose.Schema({
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

const PrivacyPolicy = mongoose.model('PrivacyPolicy', privacyPolicySchema);


module.exports = PrivacyPolicy;