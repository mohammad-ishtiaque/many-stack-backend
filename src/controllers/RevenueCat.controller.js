const User = require('../models/User');

const mongoose = require('mongoose');

exports.handleWebhook = async (req, res) => {
    try {
        const { event } = req.body;
        const authHeader = req.headers.authorization;

        if (authHeader !== process.env.REVENUECAT_WEBHOOK_AUTH_TOKEN) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        if (!event) {
            return res.status(400).json({ message: 'Invalid payload' });
        }

        const { type, app_user_id, expiration_at_ms } = event;

        // Check if app_user_id is a valid MongoDB ObjectId
        if (!mongoose.Types.ObjectId.isValid(app_user_id)) {
            console.log(`Received webhook with invalid ObjectId: ${app_user_id}. This might be a test event.`);
            return res.status(200).json({ message: 'Webhook received, but user ID format is invalid (ignoring)' });
        }

        const user = await User.findById(app_user_id);

        if (!user) {
            console.log(`User not found for ID: ${app_user_id}`);
            return res.status(200).json({ message: 'User not found, but webhook received' });
        }

        // Initialize subscription object if it doesn't exist
        if (!user.subscription) {
            user.subscription = {};
        }

        switch (type) {
            case 'INITIAL_PURCHASE':
            case 'RENEWAL':
            case 'NON_RENEWING_PURCHASE':
                user.subscription.isActive = true;
                user.subscription.endDate = new Date(expiration_at_ms);
                break;
            case 'CANCELLATION':
            case 'EXPIRATION':
                user.subscription.isActive = false;
                // user.subscription.endDate = null; // Optional: keep the date for history
                break;
            default:
                console.log(`Unhandled event type: ${type}`);
        }

        console.log(`Updating subscription for user ${app_user_id}:`, user.subscription);
        await user.save();
        console.log(`Processed RevenueCat event: ${type} for user ${app_user_id}`);

        res.status(200).json({ message: 'Webhook processed successfully' });
    } catch (error) {
        console.error('Error processing RevenueCat webhook:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
