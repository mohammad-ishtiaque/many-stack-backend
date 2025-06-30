const express = require('express');
const stripeController = require('../controllers/Stripe.controller');
const { auth, adminOrSuperAdminAuth } = require('../middleware/auth');

const router = express.Router();

// Create checkout session (requires user authentication)
router.post('/create-checkout-session', auth, stripeController.createCheckoutSession);

// Handle Stripe webhooks (no auth required - Stripe handles verification)
router.post('/webhook', (req, res, next) => {
    console.log('Webhook endpoint hit!');
    next();
  }, stripeController.handleWebhook);
// Get user's current subscription (requires user authentication)
router.get('/user-subscription', auth, stripeController.getUserSubscription);

// Cancel subscription (requires user authentication)
router.post('/cancel-subscription', auth, stripeController.cancelSubscription);

// Get all user subscriptions (admin only)
router.get('/all-user-subscriptions', adminOrSuperAdminAuth, stripeController.getAllUserSubscriptions);

module.exports = router; 