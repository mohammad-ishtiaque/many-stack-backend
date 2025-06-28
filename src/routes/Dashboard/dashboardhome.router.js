const express = require('express');
const { getDashboardStats, getDashboardCharts } = require('../../controllers/Dashboard/DashboardHome.controller');
const { superOrAdminAuth } = require('../../middleware/auth');
const router = express.Router();

// router.get('/stats', superOrAdminAuth, getDashboardStats);
// router.get('/charts', superOrAdminAuth, getDashboardCharts);

module.exports = router;