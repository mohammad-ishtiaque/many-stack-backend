const express = require('express');
const router = express.Router();
const { getHomePageData } = require('../controllers/HomePage.controller');
const { userAuth } = require('../middleware/auth');

router.get('/dashboard', userAuth, getHomePageData);

module.exports = router;