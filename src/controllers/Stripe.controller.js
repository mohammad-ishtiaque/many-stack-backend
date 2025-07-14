const { stripe, stripeConfig, getOrCreateCustomer, getStripePrice } = require('../config/stripe');
const User = require('../models/User');
const Subscription = require('../models/Dashboard/Subscription');
const UserSubscription = require('../models/Dashboard/UserSubscription');
const mongoose = require('mongoose');

// Create checkout session
exports.createCheckoutSession = async (req, res) => {
    try {
        // Check if Stripe is configured
        if (!stripe) {
            return res.status(503).json({
                success: false,
                message: 'Stripe is not configured. Please add STRIPE_SECRET_KEY to your environment variables.'
            });
        }

        const { subscriptionId } = req.body;
        const userId = req.user.id; // From auth middleware

        // Validate subscription exists
        const subscription = await Subscription.findById(subscriptionId);
        if (!subscription || !subscription.isActive) {
            return res.status(404).json({
                success: false,
                message: 'Subscription not found or inactive'
            });
        }

        // Get user
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Get or create Stripe customer
        const customerId = await getOrCreateCustomer(user);

        // Update user with Stripe customer ID if not exists
        if (!user.stripeCustomerId) {
            await User.findByIdAndUpdate(userId, { stripeCustomerId: customerId });
        }

        // Get or create Stripe price
        const price = await getStripePrice(subscription);

        // Create checkout session
        const session = await stripe.checkout.sessions.create({
            customer: customerId,
            payment_method_types: stripeConfig.paymentMethodTypes,
            mode: stripeConfig.mode,
            line_items: [
                {
                    price: price.id,
                    quantity: 1,
                },
            ],
            success_url: `${stripeConfig.successUrl}?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: stripeConfig.cancelUrl,
            metadata: {
                userId: userId,
                subscriptionId: subscriptionId,
                subscriptionName: subscription.name,
                validity: subscription.validity
            },
            subscription_data: {
                metadata: {
                    userId: userId,
                    subscriptionId: subscriptionId,
                    subscriptionName: subscription.name,
                    validity: subscription.validity
                }
            }
        });

        res.status(200).json({
            success: true,
            sessionId: session.id,
            url: session.url,
            message: 'Checkout session created successfully'
        });

    } catch (error) {
        console.error('Error creating checkout session:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating checkout session',
            error: error.message
        });
    }
};

// Handle webhook events
exports.handleWebhook = async (req, res) => {
    // Check if Stripe is configured
    // if (!stripe) {
    //     return res.status(503).json({
    //         success: false,
    //         message: 'Stripe is not configured. Please add STRIPE_SECRET_KEY to your environment variables.'
    //     });
    // }
    // const sig = req.headers['stripe-signature'];
    let event;

    // console.log('Received webhook event:', req.body);
    // console.log(req.headers);
    // console.log("Request Body:=====================================", req.body);
    const sig = req.headers["stripe-signature"];
    // console.log(
    //     "Content-Type:=====================================",
    //     req.headers["content-type"]
    // );
    // console.log("Signature:=====================================", sig);



    // let event;

    try {
        event = stripe.webhooks.constructEvent(
            req.body,
            sig, process.env.STRIPE_WEBHOOK_SECRET
        );
    } catch (err) {
        console.error('Webhook signature verification failed:', err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    try {
        console.log('Received event data object:', event.data.object);
        console.log('Received event type:', event.type);
        switch (event.type) {
            case 'checkout.session.completed':
                await handleCheckoutSessionCompleted(event.data.object);
                break;
            case 'customer.subscription.created':
                await handleSubscriptionCreated(event.data.object);
                break;
            case 'customer.subscription.updated':
                await handleSubscriptionUpdated(event.data.object);
                break;
            case 'customer.subscription.deleted':
                await handleSubscriptionDeleted(event.data.object);
                break;
            case 'invoice.payment_succeeded':
                await handlePaymentSucceeded(event.data.object);
                break;
            case 'invoice.payment_failed':
                await handlePaymentFailed(event.data.object);
                break;
            default:
                console.log(`Unhandled event type: ${event.type}`);
        }

        res.json({ received: true });
    } catch (error) {
        console.error('Error handling webhook:', error);
        res.status(500).json({ error: 'Webhook handler failed' });
    }
}

// Webhook handlers
const handleCheckoutSessionCompleted = async (session) => {
    try {
        const {
            userId,
            subscriptionId
        } = session.metadata;
        console.log('Webhook session object:', session);

        // Defensive: check for required fields
        if (!userId || !subscriptionId || !session.customer || !session.subscription) {
            console.error('checkout.session.completed: Missing required metadata or session fields.', {
                metadata: session.metadata,
                customer: session.customer,
                subscription: session.subscription
            });
            return;
        }

        // Convert to ObjectId
        const userObjectId = new mongoose.Types.ObjectId(userId);
        const subscriptionObjectId = new mongoose.Types.ObjectId(subscriptionId);

        // Upsert UserSubscription
        const result = await UserSubscription.findOneAndUpdate(
            { stripeSubscriptionId: session.subscription }, // Use the subscription ID as the unique key
            { // Use $set to avoid overwriting the whole document
                user: userObjectId,
                subscription: subscriptionObjectId,
                stripeCustomerId: session.customer,
                stripeSubscriptionId: session.subscription,
                status: 'active',
                isActive: true,
                amount: session.amount_total ? session.amount_total / 100 : 0,
                currency: session.currency || 'usd',
                interval: session.metadata.validity === 'ANNUALLY' ? 'year' : 'month',
                metadata: session.metadata,
                currentPeriodStart: new Date(session.created * 1000), // Convert to Date
                currentPeriodEnd: new Date(
                    (session.created + (session.metadata.validity === 'ANNUALLY' ? 31536000 : 2592000)) * 1000
                ), // Add 1 year or 1 month in seconds
                cancelAtPeriodEnd: false,
                canceledAt: null,
                trialStart: null,
                trialEnd: null,
                trialPeriodDays: 0
            },
            { upsert: true, new: true }
        );
        console.log('UserSubscription upsert result:', result);

        // Update user subscription status
        const subscription = await Subscription.findById(subscriptionObjectId);
        const endDate = new Date();
        if (subscription && subscription.validity === 'ANNUALLY') {
            endDate.setFullYear(endDate.getFullYear() + 1);
        } else {
            endDate.setMonth(endDate.getMonth() + 1);
        }

        await User.findByIdAndUpdate(userObjectId, {
            'subscription.plan': subscriptionObjectId,
            'subscription.startDate': new Date(),
            'subscription.endDate': endDate,
            'subscription.isActive': true
        });

        console.log(`Subscription activated for user: ${userId}`);
    } catch (error) {
        console.error('Error handling checkout session completed:', error);
    }
};

const handleSubscriptionCreated = async (subscription) => {
    try {
        // The 'checkout.session.completed' event is the primary source of truth for creation.
        // This handler serves as a fallback and for subscriptions created outside of checkout.
        // We use the stripeSubscriptionId as the unique key to find and update the record.

        const updateData = {
            status: subscription.status,
            // A subscription is considered active if it's 'trialing' or 'active'.
            isActive: ['trialing', 'active'].includes(subscription.status),
            currentPeriodStart: new Date(subscription.current_period_start * 1000),
            currentPeriodEnd: new Date(subscription.current_period_end * 1000),
            cancelAtPeriodEnd: subscription.cancel_at_period_end,
            trialStart: subscription.trial_start ? new Date(subscription.trial_start * 1000) : null,
            trialEnd: subscription.trial_end ? new Date(subscription.trial_end * 1000) : null,
            stripeCustomerId: subscription.customer,
            metadata: subscription.metadata
        };

        // Use $set to only update specified fields, preventing overwrites from race conditions.
        await UserSubscription.findOneAndUpdate({ stripeSubscriptionId: subscription.id }, { $set: updateData }, { upsert: true, new: true });
        console.log(`Subscription created/updated in DB: ${subscription.id} with status: ${subscription.status}`);
    } catch (error) {
        console.error('Error handling subscription created:', error);
    }
};

const handleSubscriptionUpdated = async (subscription) => {
    try {
        const { userId } = subscription.metadata;

        await UserSubscription.findOneAndUpdate(
            { user: userId, stripeSubscriptionId: subscription.id },
            {
                status: subscription.status,
                currentPeriodStart: new Date(subscription.current_period_start * 1000),
                currentPeriodEnd: new Date(subscription.current_period_end * 1000),
                cancelAtPeriodEnd: subscription.cancel_at_period_end,
                canceledAt: subscription.canceled_at ? new Date(subscription.canceled_at * 1000) : null
            }
        );

        // Update user subscription status
        if (subscription.status === 'canceled') {
            await User.findByIdAndUpdate(userId, {
                'subscription.isActive': false
            });
        }
    } catch (error) {
        console.error('Error handling subscription updated:', error);
    }
};

const handleSubscriptionDeleted = async (subscription) => {
    try {
        const { userId } = subscription.metadata;

        await UserSubscription.findOneAndUpdate(
            { user: userId, stripeSubscriptionId: subscription.id },
            {
                status: 'canceled',
                isActive: false
            }
        );

        // Update user subscription status
        await User.findByIdAndUpdate(userId, {
            'subscription.isActive': false
        });
    } catch (error) {
        console.error('Error handling subscription deleted:', error);
    }
};

const handlePaymentSucceeded = async (invoice) => {
    try {
        if (invoice.subscription) {
            const subscription = await stripe.subscriptions.retrieve(invoice.subscription);
            console.log("handlePaymentSucceeded", subscription)
            const { userId } = subscription.metadata;


            // Update subscription period
            await UserSubscription.findOneAndUpdate(
                { user: userId, stripeSubscriptionId: subscription.id },
                {
                    currentPeriodStart: new Date(subscription.current_period_start * 1000),
                    currentPeriodEnd: new Date(subscription.current_period_end * 1000)
                }
            );
        }
    } catch (error) {
        console.error('Error handling payment succeeded:', error);
    }
};

const handlePaymentFailed = async (invoice) => {
    try {
        if (invoice.subscription) {
            const subscription = await stripe.subscriptions.retrieve(invoice.subscription);
            const { userId } = subscription.metadata;

            // Update subscription status
            await UserSubscription.findOneAndUpdate(
                { user: userId, stripeSubscriptionId: subscription.id },
                { status: subscription.status }
            );
        }
    } catch (error) {
        console.error('Error handling payment failed:', error);
    }
};

// Get user's current subscription
exports.getUserSubscription = async (req, res) => {
    try {
        const userId = req.user.id;

        const userSubscription = await UserSubscription.findOne({
            user: userId,
            isActive: true
        }).populate('subscription');

        if (!userSubscription) {
            return res.status(404).json({
                success: false,
                message: 'No active subscription found'
            });
        }

        res.status(200).json({
            success: true,
            subscription: userSubscription
        });

    } catch (error) {
        console.error('Error getting user subscription:', error);
        res.status(500).json({
            success: false,
            message: 'Error retrieving subscription',
            error: error.message
        });
    }
};

// Cancel subscription
exports.cancelSubscription = async (req, res) => {
    try {
        const userId = req.user.id;

        const userSubscription = await UserSubscription.findOne({
            user: userId,
            isActive: true
        });

        if (!userSubscription) {
            return res.status(404).json({
                success: false,
                message: 'No active subscription found'
            });
        }

        // Cancel subscription in Stripe
        await stripe.subscriptions.update(userSubscription.stripeSubscriptionId, {
            cancel_at_period_end: true
        });

        // Update local record
        await UserSubscription.findByIdAndUpdate(userSubscription._id, {
            cancelAtPeriodEnd: true
        });

        res.status(200).json({
            success: true,
            message: 'Subscription will be canceled at the end of the current period'
        });

    } catch (error) {
        console.error('Error canceling subscription:', error);
        res.status(500).json({
            success: false,
            message: 'Error canceling subscription',
            error: error.message
        });
    }
};

// Get all user subscriptions (admin)
exports.getAllUserSubscriptions = async (req, res) => {
    try {
        const userSubscriptions = await UserSubscription.find({ isActive: true })
            .populate('user', 'firstName lastName email')
            .populate('subscription', 'name price validity features')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            subscriptions: userSubscriptions
        });

    } catch (error) {
        console.error('Error getting all user subscriptions:', error);
        res.status(500).json({
            success: false,
            message: 'Error retrieving subscriptions',
            error: error.message
        });
    }
};

exports.assignFreePlanFromSubscriptionList = async (user, allPlans) => {
    const now = new Date();
    const end = new Date(now);
    end.setDate(end.getDate() + 7); // 7-day free trial


    const freePlan = allPlans.find(plan => plan.validity === 'FREE');
    if (!freePlan) throw new Error('Free subscription plan not found');
    // console.log('Assigning free plan:', freePlan);
    console.log('Assigning free plan:', freePlan._id);


    try {
        user.subscription = {
            plan: freePlan._id,
            isActive: true,
            startDate: now,
            endDate: end,
            isTrial: true
        };
        await user.save();

    } catch (error) {
        console.error('Error assigning free trial subscription:', error);
        throw error;
    }
};
