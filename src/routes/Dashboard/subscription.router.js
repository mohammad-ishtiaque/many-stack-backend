const express = require('express');
const subscriptionController = require('../../controllers/Dashboard/Subscription.controller');
const { adminOrSuperAdminAuth, } = require('../../middleware/auth');

const router = express.Router();


// Create new subscription
router.post('/create',  adminOrSuperAdminAuth, subscriptionController.createSubscription);    

// Get all subscriptions
router.get('/get-all', subscriptionController.getAllSubscriptions);

// Get all subscriptions with Stripe price information
router.get('/get-all-with-stripe', subscriptionController.getAllSubscriptionsWithStripe);

// Get subscription by ID
router.get('/get/:id', subscriptionController.getSubscriptionById);

// Get subscription by ID with Stripe price information
router.get('/get-with-stripe/:id', subscriptionController.getSubscriptionByIdWithStripe);

// Update subscription
router.put('/update/:id', adminOrSuperAdminAuth, subscriptionController.updateSubscription);

// Delete subscription
router.delete('/delete/:id', adminOrSuperAdminAuth, subscriptionController.deleteSubscription);

module.exports = router;
