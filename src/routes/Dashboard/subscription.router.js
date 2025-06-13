const express = require('express');
const subscriptionController = require('../../controllers/Dashboard/Subscription.controller');
const { adminAuth, auth } = require('../../middleware/auth');

const router = express.Router();


// Create new subscription
router.post('/create', auth, adminAuth, subscriptionController.createSubscription);    

// Get all subscriptions
router.get('/get-all',auth, adminAuth, subscriptionController.getAllSubscriptions);

// Get subscription by ID
router.get('/get/:id',auth, adminAuth, subscriptionController.getSubscriptionById);

// Update subscription
router.put('/update/:id',auth, adminAuth, subscriptionController.updateSubscription);

// Delete subscription
router.delete('/delete/:id',auth, adminAuth, subscriptionController.deleteSubscription);

module.exports = router;
