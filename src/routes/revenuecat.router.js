const express = require('express');
const router = express.Router();
const revenueCatController = require('../controllers/RevenueCat.controller');

router.post('/webhook', revenueCatController.handleWebhook);

module.exports = router;
