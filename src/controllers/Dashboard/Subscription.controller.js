const Subscription = require('../../models/Dashboard/Subscription');
const { getStripePrice } = require('../../config/stripe');

exports.createSubscription = async (req, res) => {
    try {
        const { name, price, validity, features } = req.body;
        
        // Create subscription
        const subscription = await Subscription.create({
            name: name.trim(),
            price,
            validity : validity.toUpperCase(), // Ensure validity is stored in uppercase
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
            message: 'Subscriptions retrieved successfully',
            subscriptions
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
}

// New endpoint for getting subscriptions with Stripe price information
exports.getAllSubscriptionsWithStripe = async (req, res) => {
    try {
        const subscriptions = await Subscription.find({ isActive: true });

        // Add Stripe price information to each subscription
        const subscriptionsWithStripe = await Promise.all(
            subscriptions.map(async (subscription) => {
                try {
                    const stripePrice = await getStripePrice(subscription);
                    return {
                        ...subscription.toObject(),
                        stripePriceId: stripePrice.id
                    };
                } catch (error) {
                    console.error(`Error getting Stripe price for subscription ${subscription._id}:`, error);
                    // Return subscription without Stripe info if there's an error
                    return {
                        ...subscription.toObject(),
                        stripePriceId: null,
                        stripeError: error.message
                    };
                }
            })
        );

        res.status(200).json({
            success: true,
            message: 'Subscriptions with Stripe information retrieved successfully',
            subscriptions: subscriptionsWithStripe
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
            message: 'Subscription retrieved successfully',
            subscription
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }   
}

// New endpoint for getting subscription by ID with Stripe price information
exports.getSubscriptionByIdWithStripe = async (req, res) => {
    try {
        const { id } = req.params;

        const subscription = await Subscription.findById(id);
        if (!subscription) {
            return res.status(404).json({
                success: false,
                message: 'Subscription not found'
            });
        }

        // Add Stripe price information
        try {
            const stripePrice = await getStripePrice(subscription);
            const subscriptionWithStripe = {
                ...subscription.toObject(),
                stripePriceId: stripePrice.id
            };

            res.status(200).json({
                success: true,
                message: 'Subscription with Stripe information retrieved successfully',
                subscription: subscriptionWithStripe
            });
        } catch (error) {
            console.error('Error getting Stripe price:', error);
            res.status(200).json({
                success: true,
                message: 'Subscription retrieved successfully (Stripe price unavailable)',
                subscription: {
                    ...subscription.toObject(),
                    stripePriceId: null,
                    stripeError: error.message
                }
            });
        }

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
                validity : validity ? validity.toUpperCase() : undefined, // Ensure validity is stored in uppercase
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
            message: 'Subscription updated successfully',
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

