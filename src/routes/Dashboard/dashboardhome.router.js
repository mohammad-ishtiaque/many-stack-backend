const express = require('express');
const { getDashboardStats, getDashboardCharts } = require('../../controllers/Dashboard/DashboardHome.controller');
const { adminOrSuperAdminAuth } = require('../../middleware/auth');
const router = express.Router();

router.get('/stats', adminOrSuperAdminAuth, getDashboardStats);
router.get('/charts', adminOrSuperAdminAuth, getDashboardCharts);

module.exports = router;