const User = require('../../models/User'); // adjust path as needed

/**
 * Controller to list all registered users.
 */
exports.getAllUsers = async (req, res) => {
    try {
        const users = await User.find(); // Retrieves all user documents from the database.
        res.status(200).json({
            success: true,
            message: 'Users fetched successfully!',
            data: users
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch users.',
            error: error.message
        });
    }
};


/**
 * Controller to get details of a specific user.
 */
exports.getUserDetails = async (req, res) => {
    try {
        const userId = req.params.id;
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        res.status(200).json({
            success: true,
            message: 'User details fetched successfully!',
            data: user
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch user details.',
            error: error.message
        });
    }
};


exports.blockUser = async (req, res) => {
    try {
    
        const userId = req.params.id;
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        user.isBlocked = true;
        await user.save();

        res.status(200).json({
            success: true,
            message: 'User blocked successfully!',
            data: user
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to block user.',
            error: error.message
        });
    }
};

exports.unblockUser = async (req, res) => {
    try {
        const userId = req.params.id;
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        
        user.isBlocked = false;
        await user.save();
        
        res.status(200).json({
            success: true,
            message: 'User unblocked successfully!',
            data: user
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to unblock user.',
            error: error.message
        });
    }
};
