const PrivacyPolicy = require('../../models/Dashboard/Settings/PrivacyPolicy');
const TermsConditions = require('../../models/Dashboard/Settings/TermsConditions');
const ContactUs = require('../../models/Dashboard/Settings/ContactUs');

const renderReadableDocument = (title, content) => `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${title}</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            max-width: 900px;
            margin: 40px auto;
            padding: 0 20px;
            color: #1f2937;
            background: #f9fafb;
        }
        .document {
            background: #ffffff;
            padding: 32px;
            border-radius: 12px;
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
        }
        h1 {
            margin-top: 0;
            color: #111827;
        }
    </style>
</head>
<body>
    <main class="document">
        <h1>${title}</h1>
        <div>${content}</div>
    </main>
</body>
</html>`;

// Privacy Policy Controllers
exports.createPrivacyPolicy = async (req, res) => {
    try {
        const privacyPolicy = new PrivacyPolicy({
            content: req.body.content
        });
        await privacyPolicy.save();
        res.status(201).json({ success: true,message: 'Privacy Policy created successfully', data: privacyPolicy });
    } catch (error) {
        res.status(400).json({ success: false, message: 'Failed to create Privacy Policy', error: error.message });
    }
};

exports.getPrivacyPolicy = async (req, res) => {
    try {
        const privacyPolicy = await PrivacyPolicy.findOne({ isActive: true }).sort({ createdAt: -1 });
        res.status(200).json({ success: true, message: 'Privacy Policy retrieved successfully', data: privacyPolicy });
    } catch (error) {
        res.status(400).json({ success: false,message: 'Failed to retrieve Privacy Policy', error: error.message });
    }
};

exports.viewPrivacyPolicy = async (req, res) => {
    try {
        const privacyPolicy = await PrivacyPolicy.findOne({ isActive: true }).sort({ createdAt: -1 });

        if (!privacyPolicy) {
            return res.status(404).send('<h1>Privacy Policy not found</h1>');
        }

        res.status(200).type('html').send(renderReadableDocument('Privacy Policy', privacyPolicy.content));
    } catch (error) {
        res.status(400).type('html').send(`<h1>Failed to retrieve Privacy Policy</h1><p>${error.message}</p>`);
    }
};

exports.updatePrivacyPolicy = async (req, res) => {
    try {
        const privacyPolicy = await PrivacyPolicy.findByIdAndUpdate(
            req.params.id,
            { content: req.body.content },
            { new: true, runValidators: true }
        );
        res.status(200).json({ success: true,message: 'Privacy Policy updated successfully', data: privacyPolicy });
    } catch (error) {
        res.status(400).json({ success: false, message  : 'Failed to update Privacy Policy', error: error.message });
    }
};

// Terms & Conditions Controllers
exports.createTermsConditions = async (req, res) => {
    try {
        const termsConditions = new TermsConditions({
            content: req.body.content
        });
        await termsConditions.save();
        res.status(201).json({ success: true, message: 'Terms & Conditions created successfully', data: termsConditions });
    } catch (error) {
        res.status(400).json({ success: false, message: 'Failed to create Terms & Conditions', error: error.message });
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

exports.viewTermsConditions = async (req, res) => {
    try {
        const termsConditions = await TermsConditions.findOne({ isActive: true }).sort({ createdAt: -1 });

        if (!termsConditions) {
            return res.status(404).send('<h1>Terms & Conditions not found</h1>');
        }

        res.status(200).type('html').send(renderReadableDocument('Terms & Conditions', termsConditions.content));
    } catch (error) {
        res.status(400).type('html').send(`<h1>Failed to retrieve Terms & Conditions</h1><p>${error.message}</p>`);
    }
};

exports.updateTermsConditions = async (req, res) => {
    try {
        const termsConditions = await TermsConditions.findByIdAndUpdate(
            req.params.id,
            { content: req.body.content },
            { new: true, runValidators: true }
        );
        res.status(200).json({ success: true, message: 'Terms & Conditions updated successfully', data: termsConditions });
    } catch (error) {
        res.status(400).json({ success: false,message: 'Failed to update Terms & Conditions', error: error.message });
    }
};

// Contact Us Controllers
exports.createContactUs = async (req, res) => {
    try {
        const { email } = req.body;
        
        // Check if email already exists
        const existingContactUs = await ContactUs.findOne({ email });

        if (existingContactUs) {
            return res.status(400).json({ success: false, message: 'Email already exists' });
        }

        // Create new contact us entry
        const contactUs = new ContactUs({
            email: email
        });
        
        await contactUs.save();
        res.status(201).json({ success: true, message: 'Contact Us entry created successfully', data: contactUs });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
};

exports.getContactUs = async (req, res) => {
    try {
        const contactUs = await ContactUs.findOne({ isActive: true }).sort({ createdAt: -1 });
        res.status(200).json({ success: true, message: 'Contact Us entry retrieved successfully', data: contactUs });
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
        res.status(200).json({ success: true,message: 'Contact Us entry updated successfully', data: contactUs });
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
