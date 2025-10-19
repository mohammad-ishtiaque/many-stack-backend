const express = require('express');
const router = express.Router();
const { getHomePageData, getDebugData } = require('../controllers/HomePage.controller');
const { userAuth } = require('../middleware/auth');

router.get('/dashboard', userAuth, getHomePageData);
// router.get('/debug', userAuth, getDebugData);

module.exports = router;