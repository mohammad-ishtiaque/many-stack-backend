const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { deleteFile } = require('../utils/unLinkFiles');

// Get user profile using token
exports.getUser = async (req, res) => {
    try {
        // Get token from header
        const token = req.header('Authorization')?.replace('Bearer ', '');
        // console.log(token)
        
        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'No token, authorization denied'
            });
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        // console.log(decoded.user.id)
        
        // Get user from database
        let id = decoded.user.id;
        const user = await User.findById(id).select('-password');
        // console.log(user)
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.status(200).json({
            success: true,
            data: user
        });
    } catch (err) {
        if (err.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                message: 'Invalid token'
            });
        }
        res.status(500).json({
            success: false,
            message: err.message
        });
    }
};

// Update user profile
exports.updateUser = async (req, res) => {
    try {
        // Get token from header
        const token = req.header('Authorization')?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'No token, authorization denied'
            });
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        let id = decoded.user.id;
        // Update user
        const user = await User.findByIdAndUpdate(
            id,
            {
                $set: {
                    firstName: req.body.firstName,
                    lastName: req.body.lastName,
                    contact: req.body.contact,
                    siren: req.body.siren,
                    address: {
                        streetNo: req.body.streetNo,
                        streetName: req.body.streetName,
                        city: req.body.city,
                        postalCode: req.body.postalCode,
                        country: req.body.country
                    },
                    gender: req.body.gender
                }
            },
            { new: true, runValidators: true }
        ).select('-password');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.status(200).json({
            success: true,
            data: user,
            message: 'Profile updated successfully'
        });
    } catch (err) {
        if (err.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                message: 'Invalid token'
            });
        }
        res.status(500).json({
            success: false,
            message: err.message
        });
    }
};

// Change password
exports.changePassword = async (req, res) => {
    try {
        // Get user with password
        const user = await User.findById(req.user.id);

        // Check required fields
        const { currentPassword, newPassword, confirmPassword } = req.body;
        
        if (!currentPassword || !newPassword || !confirmPassword) {
            return res.status(400).json({
                success: false,
                message: 'Please provide all required fields'
            });
        }

        // Check if new password matches confirm password
        if (newPassword !== confirmPassword) {
            return res.status(400).json({
                success: false,
                message: 'New password and confirm password do not match'
            });
        }

        // Check if new password is same as current password
        if (currentPassword === newPassword) {
            return res.status(400).json({
                success: false,
                message: 'New password must be different from current password'
            });
        }

        // Validate password strength
        if (newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'Password must be at least 6 characters long'
            });
        }

        // Check if current password is correct
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Current password is incorrect'
            });
        }

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        // Update password
        user.password = hashedPassword;
        await user.save();

        res.status(200).json({
            success: true,
            message: 'Password updated successfully'
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: err.message
        });
    }
};

exports.uploadBusinessLogo = async (req, res) => {
    try {

        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No file uploaded'
            });
        }

        const user = await User.findById(req.user.id);

        // Delete old logo if exists
        if (user.businessLogo) {
            await deleteFile(`uploads/${user.businessLogo}`);
        }

        // Update user with new logo
        user.businessLogo = req.file.filename;
        await user.save();

        res.status(200).json({
            success: true,
            data: {
                businessLogo: user.businessLogo
            },
            message: 'Business logo uploaded successfully'
        });
    } catch (err) {
        // Delete uploaded file if error occurs
        if (req.file) {
            await deleteFile(req.file.path);
        }
        
        res.status(500).json({
            success: false,
            message: err.message
        });
    }
};