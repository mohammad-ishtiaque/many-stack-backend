const express = require('express');
const router = express.Router();
const { getHomePageData } = require('../controllers/HomePage.controller');
const { auth } = require('../middleware/auth');

router.get('/dashboard', auth, getHomePageData);

module.exports = router;