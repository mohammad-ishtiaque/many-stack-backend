const PrivacyPolicy = require('../../models/Dashboard/Settings/PrivacyPolicy');
const TermsConditions = require('../../models/Dashboard/Settings/TermsConditions');
const ContactUs = require('../../models/Dashboard/Settings/ContactUs');

// Privacy Policy Controllers
exports.createPrivacyPolicy = async (req, res) => {
    try {
        const privacyPolicy = new PrivacyPolicy({
            content: req.body.content
        });
        await privacyPolicy.save();
        res.status(201).json({ success: true, data: privacyPolicy });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
};

exports.getPrivacyPolicy = async (req, res) => {
    try {
        const privacyPolicy = await PrivacyPolicy.findOne({ isActive: true }).sort({ createdAt: -1 });
        res.status(200).json({ success: true, data: privacyPolicy });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
};

exports.updatePrivacyPolicy = async (req, res) => {
    try {
        const privacyPolicy = await PrivacyPolicy.findByIdAndUpdate(
            req.params.id,
            { content: req.body.content },
            { new: true, runValidators: true }
        );
        res.status(200).json({ success: true, data: privacyPolicy });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
};

// Terms & Conditions Controllers
exports.createTermsConditions = async (req, res) => {
    try {
        const termsConditions = new TermsConditions({
            content: req.body.content
        });
        await termsConditions.save();
        res.status(201).json({ success: true, data: termsConditions });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
};

exports.getTermsConditions = async (req, res) => {
    try {
        const termsConditions = await TermsConditions.findOne({ isActive: true }).sort({ createdAt: -1 });
        res.status(200).json({ success: true, data: termsConditions });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
};

exports.updateTermsConditions = async (req, res) => {
    try {
        const termsConditions = await TermsConditions.findByIdAndUpdate(
            req.params.id,
            { content: req.body.content },
            { new: true, runValidators: true }
        );
        res.status(200).json({ success: true, data: termsConditions });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
};

// Contact Us Controllers
exports.createContactUs = async (req, res) => {
    try {
        const contactUs = new ContactUs({
            content: req.body.content
        });
        await contactUs.save();
        res.status(201).json({ success: true, data: contactUs });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
};

exports.getContactUs = async (req, res) => {
    try {
        const contactUs = await ContactUs.findOne({ isActive: true }).sort({ createdAt: -1 });
        res.status(200).json({ success: true, data: contactUs });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
};

exports.updateContactUs = async (req, res) => {
    try {
        const contactUs = await ContactUs.findByIdAndUpdate(
            req.params.id,
            { content: req.body.content },
            { new: true, runValidators: true }
        );
        res.status(200).json({ success: true, data: contactUs });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
};

exports.deleteContactUs = async (req, res) => {
    try {
        const contactUs = await ContactUs.findByIdAndDelete(req.params.id);
        if (!contactUs) {
            return res.status(404).json({ success: false, message: 'Contact Us entry not found' });
        }
        res.status(200).json({ success: true, message: 'Contact Us entry deleted successfully' });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
}
