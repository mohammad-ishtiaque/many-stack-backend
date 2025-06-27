const express = require('express');
const subscriptionController = require('../../controllers/Dashboard/Subscription.controller');
const { adminOrSuperAdminAuth, } = require('../../middleware/auth');

const router = express.Router();


// Create new subscription
router.post('/create',  adminOrSuperAdminAuth, subscriptionController.createSubscription);    

// Get all subscriptions
router.get('/get-all', subscriptionController.getAllSubscriptions);

// Get subscription by ID
router.get('/get/:id', subscriptionController.getSubscriptionById);

// Update subscription
router.put('/update/:id', adminOrSuperAdminAuth, subscriptionController.updateSubscription);

// Delete subscription
router.delete('/delete/:id', adminOrSuperAdminAuth, subscriptionController.deleteSubscription);

module.exports = router;
