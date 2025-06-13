const express = require('express');
const subscriptionController = require('../../controllers/Dashboard/Subscription.controller');
const { adminAuth } = require('../../middleware/auth');

const router = express.Router();


// Create new subscription
router.post('/create', adminAuth, subscriptionController.createSubscription);    

// Get all subscriptions
router.get('/get-all', adminAuth, subscriptionController.getAllSubscriptions);

// Get subscription by ID
router.get('/get/:id', adminAuth, subscriptionController.getSubscriptionById);

// Update subscription
router.put('/update/:id', adminAuth, subscriptionController.updateSubscription);

// Delete subscription
router.delete('/delete/:id', adminAuth, subscriptionController.deleteSubscription);

module.exports = router;
