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
exports.getDashboardCharts = async (req, res) => {
    try {
        // This is sample data - replace with actual data aggregation
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        
        // User growth data (example)
        const userGrowth = Array(12).fill(0).map(() => Math.floor(Math.random() * 100));
        
        // Subscription growth data (example)
        const subscriptionGrowth = Array(12).fill(0).map(() => 
            (Math.random() * 10 + 1).toFixed(2)
        );
        
        // Earning growth data (example)
        const earningGrowth = Array(12).fill(0).map(() => 
            (Math.random() * 30 + 10).toFixed(2)
        );

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
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};