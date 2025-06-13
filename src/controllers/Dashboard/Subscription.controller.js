const Subscription = require('../../models/Dashboard/Subscription');

exports.createSubscription = async (req, res) => {
    try {
        const { name, price, validity, features } = req.body;
        
        // Create subscription
        const subscription = await Subscription.create({
            name: name.trim(),
            price,
            validity,
            features: features || []
        });

        return res.status(201).json({
            success: true,
            subscription,
            message: 'Subscription created successfully'
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Error creating subscription',
            error: error.message
        });
    }
}


exports.getAllSubscriptions = async (req, res) => {
    try {
        const subscriptions = await Subscription.find({ isActive: true });

        res.status(200).json({
            success: true,
            subscriptions
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
}

exports.getSubscriptionById = async (req, res) => {
    try {
        const { id } = req.params;

        const subscription = await Subscription.findById(id);
        if (!subscription) {
            return res.status(404).json({
                success: false,
                message: 'Subscription not found'
            });
        }
        res.status(200).json({
            success: true,
            subscription
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }   
}

exports.updateSubscription = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, price, validity, features } = req.body;

        // Find and update subscription
        const subscription = await Subscription.findByIdAndUpdate(
            id,
            { 
                name: name ? name.trim() : undefined,
                price,
                validity,
                features
            }, 
            { 
                new: true,
                runValidators: true
            }
        );

        if (!subscription) {
            return res.status(404).json({
                success: false,
                message: 'Subscription not found'
            });
        }

        res.status(200).json({
            success: true,
            subscription
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
}

exports.deleteSubscription = async (req, res) => {
    try {
        const { id } = req.params;

        // Find and delete subscription
        const subscription = await Subscription.findByIdAndDelete(id);
        
        if (!subscription) {
            return res.status(404).json({
                success: false,
                message: 'Subscription not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Subscription deleted successfully'
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};