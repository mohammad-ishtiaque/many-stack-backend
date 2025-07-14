const dotenv = require('dotenv');


dotenv.config();

// Check if Stripe secret key is available
if (!process.env.STRIPE_SECRET_KEY) {
    console.warn('⚠️  STRIPE_SECRET_KEY not found in environment variables. Stripe functionality will be disabled.');
    console.warn('Please add STRIPE_SECRET_KEY to your .env file to enable Stripe integration.');
}

const stripe = process.env.STRIPE_SECRET_KEY
    ? require('stripe')(process.env.STRIPE_SECRET_KEY)
    : null;

// Stripe configuration
const stripeConfig = {
    currency: 'usd',
    paymentMethodTypes: ['card'],
    mode: 'subscription',
    successUrl: process.env.STRIPE_SUCCESS_URL || 'http://13.39.251.121:5000/success',
    cancelUrl: process.env.STRIPE_CANCEL_URL || 'http://13.39.251.121:5000/cancel',
};

// console.log('STRIPE_SECRET_KEY:', process.env.STRIPE_SECRET_KEY);

// Helper function to create or retrieve Stripe customer
const getOrCreateCustomer = async (user) => {
    if (!stripe) {
        throw new Error('Stripe is not configured. Please add STRIPE_SECRET_KEY to your environment variables.');
    }

    try {
        // Check if user already has a Stripe customer ID
        if (user.stripeCustomerId) {
            return user.stripeCustomerId;
        }

        // Create new Stripe customer
        const customer = await stripe.customers.create({
            email: user.email,
            name: `${user.firstName} ${user.lastName}`,
            metadata: {
                userId: user._id.toString(),
                userEmail: user.email
            }
        });

        return customer.id;
    } catch (error) {
        console.error('Error creating Stripe customer:', error);
        throw error;
    }
};

// Helper function to create Stripe price
const createStripePrice = async (subscription) => {
    if (!stripe) {
        throw new Error('Stripe is not configured. Please add STRIPE_SECRET_KEY to your environment variables.');
    }

    try {
        const interval = subscription.validity === 'ANNUALLY' ? 'year' : 'month';

        const price = await stripe.prices.create({
            unit_amount: subscription.price * 100, // Convert to cents
            currency: stripeConfig.currency,
            recurring: {
                interval: interval,
                interval_count: 1
            },
            product_data: {
                name: subscription.name,
                // description: subscription.features.join(', '),
                metadata: {
                    subscriptionId: subscription._id.toString(),
                    validity: subscription.validity
                }
            }
        });

        return price;
    } catch (error) {
        console.error('Error creating Stripe price:', error);
        throw error;
    }
};

// Helper function to get Stripe price by subscription
const getStripePrice = async (subscription) => {
    if (!stripe) {
        throw new Error('Stripe is not configured. Please add STRIPE_SECRET_KEY to your environment variables.');
    }

    try {
        const interval = subscription.validity === 'ANNUALLY' ? 'year' : 'month';

        // Try to find existing price
        const prices = await stripe.prices.list({
            active: true,
            currency: stripeConfig.currency,
            recurring: {
                interval: interval
            }
        });

        // Find price with matching amount and metadata
        const existingPrice = prices.data.find(price =>
            price.unit_amount === subscription.price * 100 &&
            price.product_data?.metadata?.subscriptionId === subscription._id.toString()
        );

        if (existingPrice) {
            return existingPrice;
        }

        // Create new price if not found
        return await createStripePrice(subscription);
    } catch (error) {
        console.error('Error getting Stripe price:', error);
        throw error;
    }
};




module.exports = {
    stripe,
    stripeConfig,
    getOrCreateCustomer,
    createStripePrice,
    getStripePrice
}; 