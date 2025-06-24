const express = require('express');
const subscriptionController = require('../../controllers/Dashboard/Subscription.controller');
const { adminOrSuperadmin, auth } = require('../../middleware/auth');

const router = express.Router();


// Create new subscription
router.post('/create', auth, adminOrSuperadmin, subscriptionController.createSubscription);    

// Get all subscriptions
router.get('/get-all',auth, adminOrSuperadmin, subscriptionController.getAllSubscriptions);

// Get subscription by ID
router.get('/get/:id',auth, adminOrSuperadmin, subscriptionController.getSubscriptionById);

// Update subscription
router.put('/update/:id',auth, adminOrSuperadmin, subscriptionController.updateSubscription);

// Delete subscription
router.delete('/delete/:id',auth, adminOrSuperadmin, subscriptionController.deleteSubscription);

module.exports = router;
