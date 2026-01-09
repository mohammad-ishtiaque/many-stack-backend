const User = require('../../models/User');
const Admin = require('../../models/Admin');
// Get dashboard stats


exports.getDashboardStats = async (req, res) => {
    try {
        // Get total earnings (example - adjust based on your business logic)
        const totalEarnings = 7200; // This should be calculated from your payments/transactions

        // Get total technicians
        const totalTechnicians = await User.countDocuments({});

        // Get blocked accounts
        const blockedAccounts = await User.countDocuments({ isBlocked: true });

        res.status(200).json({
            success: true,
            data: {
                totalEarnings,
                totalTechnicians,
                blockedAccounts
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Get charts data
const UserSubscription = require('../../models/Dashboard/UserSubscription');
const Invoice = require('../../models/Invoice');

// Get charts data
exports.getDashboardCharts = async (req, res) => {
    try {
        const year = parseInt(req.query.year) || new Date().getFullYear();
        const startDate = new Date(`${year}-01-01`);
        const endDate = new Date(`${year}-12-31`);

        // Common chart data structure
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

        // 1. User Growth Data
        const userGrowthData = await User.aggregate([
            {
                $match: {
                    createdAt: { $gte: startDate, $lte: endDate },
                    role: 'user' // Only count regular users
                }
            },
            {
                $group: {
                    _id: { $month: "$createdAt" },
                    count: { $sum: 1 }
                }
            }
        ]);

        const userGrowth = Array(12).fill(0);
        userGrowthData.forEach(item => {
            userGrowth[item._id - 1] = item.count;
        });

        // 2. Subscription Growth Data (New Subscriptions)
        const subscriptionGrowthData = await UserSubscription.aggregate([
            {
                $match: {
                    createdAt: { $gte: startDate, $lte: endDate }
                }
            },
            {
                $group: {
                    _id: { $month: "$createdAt" },
                    count: { $sum: 1 }
                }
            }
        ]);

        const subscriptionGrowth = Array(12).fill(0);
        subscriptionGrowthData.forEach(item => {
            subscriptionGrowth[item._id - 1] = item.count;
        });

        // 3. Earning Growth Data from Invoices
        // Needs to sum service prices * quantities
        const earningGrowthData = await Invoice.aggregate([
            {
                $match: {
                    data: { $gte: startDate, $lte: endDate },
                    status: 'PAID'
                }
            },
            {
                $addFields: {
                    invoiceTotal: {
                        $sum: {
                            $map: {
                                input: "$services",
                                as: "service",
                                in: { $multiply: ["$$service.price", "$$service.quantity"] }
                            }
                        }
                    }
                }
            },
            {
                $group: {
                    _id: { $month: "$data" },
                    total: { $sum: "$invoiceTotal" }
                }
            }
        ]);

        const earningGrowth = Array(12).fill(0);
        earningGrowthData.forEach(item => {
            earningGrowth[item._id - 1] = parseFloat(item.total.toFixed(2));
        });

        res.status(200).json({
            success: true,
            data: {
                months,
                userGrowth,
                subscriptionGrowth,
                earningGrowth
            }
        });
    } catch (error) {
        console.error("Dashboard Chart Error:", error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};