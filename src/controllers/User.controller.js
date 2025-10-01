const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { deleteFile } = require('../utils/unLinkFiles');
const emailService = require('../utils/emailService');
const Subscription = require('../models/Dashboard/Subscription');

// Get user profile using token
exports.getUser = async (req, res) => {
    try {
        // Get token from header
        const token = req.header('Authorization')?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'non autorisé' //unauthorized
            });
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        // console.log(decoded)
        
        // Get user from database
        let id = decoded.user.id;
        // console.log(id)
        const userDoc = await User.findById(id).select('-password')
        if (!userDoc) {
            return res.status(404).json({ 
                success: false,
                message: 'Utilisateur non trouvé' //User not found
            });
        }
        // Ensure countryCode is surfaced even if stored under address in older data
        const user = userDoc.toObject();
        if (!user.countryCode && user.address && user.address.countryCode) {
            user.countryCode = user.address.countryCode;
        }

        res.status(200).json({
            success: true,
            data: user,
            showSubscription: true,
            message: 'Profil récupéré avec succès' //Profile retrieved successfully
        });
    } catch (err) {
        if (err.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                message: 'Invalid token' //Invalid token
            });
        }
        res.status(500).json({
            success: false,
            message: err.message
        });
    }
};

// Update user profile - only allowed fields, no password
exports.updateUser = async (req, res) => {
    try {
        const userId = req.user && req.user.id;
        if (!userId) return res.status(401).json({ success: false, message: 'non autorisé' });

        const allowedFields = [
            'firstName', 'lastName', 'contact', 'nSiren', 'address', 
            'currency', 'gender', 'profilePicture', 'businessLogo'
        ];

        // Filter only allowed fields
        const updateData = {};
        Object.keys(req.body || {}).forEach(key => {
            if (allowedFields.includes(key)) {
                updateData[key] = req.body[key];
            }
        });

        // Handle gender enum validation - convert to uppercase
        if (updateData.gender) {
            updateData.gender = updateData.gender.toUpperCase();
            if (!['MALE', 'FEMALE', 'OTHER'].includes(updateData.gender)) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Gender must be MALE, FEMALE, or OTHER' 
                });
            }
        }

        if (Object.keys(updateData).length === 0) {
            const user = await User.findById(userId).select('-password');
            return res.status(200).json({ success: true, data: user, message: 'Aucun champ valide à mettre à jour' });
        }

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { $set: updateData },
            { new: true, runValidators: true }
        ).select('-password');

        if (!updatedUser) return res.status(404).json({ success: false, message: 'Utilisateur non trouvé' });

        res.status(200).json({ success: true, data: updatedUser, message: 'Profil mis à jour avec succès' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
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
                message: 'Veuillez fournir tous les champs obligatoires'
            });
        }

        // Check if new password matches confirm password
        if (newPassword !== confirmPassword) {
            return res.status(400).json({
                success: false,
                message: 'Le nouveau mot de passe et le mot de passe de confirmation ne correspondent pas' //The new password and confirmation password do not match
            });
        }

        // Check if new password is same as current password
        if (currentPassword === newPassword) {
            return res.status(400).json({
                success: false,
                message: 'Le nouveau mot de passe doit être différent du mot de passe actuel' //New password must be different from current password
            });
        }

        // Validate password strength
        if (newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'Le mot de passe doit contenir au moins 6 caractères' //Password must be at least 6 characters long
            });
        }

        // Check if current password is correct
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Le mot de passe actuel est incorrect' //Current password is incorrect
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
            message: 'Mot de passe mis à jour avec succès' //Password updated successfully
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
                message: 'Aucun fichier téléchargé' //No file uploaded
            });
        }

        const user = await User.findById(req.user.id);

        // Delete old logo if exists
        if (user.businessLogo) {
            await deleteFile(user.businessLogo);
        }

        // Update user with new logo
        user.businessLogo = req.file.location;
        await user.save();

        res.status(200).json({
            success: true,
            data: {
                businessLogo: user.businessLogo
            },
            message: 'Logo de l\'entreprise téléchargé avec succès' //Business logo uploaded successfully
        });
    } catch (err) {
        // Delete uploaded file if error occurs
        if (req.file) {
            await deleteFile(req.file.location);
        }
        
        res.status(500).json({
            success: false,
            message: err.message
        });
    }
};


exports.uploadProfilePicture = async (req, res) => {
    try {

        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'Aucun fichier téléchargé' //No file uploaded
            });
        }

        const user = await User.findById(req.user.id);

        // Update user with new S3 image URL
        user.profilePicture = req.file.location;
        await user.save();

        res.status(200).json({
            success: true,
            data: {
                profilePicture: user.profilePicture
            },
            message: 'Photo de profil téléchargée avec succès' //Profile picture uploaded successfully
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: err.message
        });
    }
};


exports.updateProfilePicture = async (req, res) => {
    try {

        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'Aucun fichier téléchargé' //No file uploaded
            });
        }

        const user = await User.findById(req.user.id);

        // Delete old logo if exists
        if (user.profilePicture) {
            await deleteFile(user.profilePicture);
        }

        // Update user with new logo
        user.profilePicture = req.file.location;
        await user.save();

        res.status(200).json({
            success: true,
            data: {
                profilePicture: user.profilePicture
            },
            message: 'Photo de profil mise à jour avec succès' //Profile picture updated successfully
        });
    } catch (err) {
        // Delete uploaded file if error occurs
        if (req.file) {
            await deleteFile(req.file.location);
        }       
        
        res.status(500).json({
            success: false,
            message: err.message
        });
    }
};

exports.getTheSubscription = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).populate('subscription');
        // console.log(plan);
        // console.log(user.subscription.plan);


        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Utilisateur non trouvé' //User not found
            });
        }

        const plan = await Subscription.findById(user.subscription.plan);

        const fullSubscription = {
            ...user.subscription.toObject(),
            planDetails: plan ? plan.toObject() : null
        };


        res.status(200).json({
            success: true,
            message: 'Abonnement récupéré avec succès', //Subscription retrieved successfully
            subscription: fullSubscription

        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: err.message
        });
    }
};

exports.deleteUser = async (req, res) => {
    try {
        const user = await User.findByIdAndDelete(req.user.id);
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Utilisateur non trouvé' //User not found
            });
        }

        // Get email subject and body from request body or use defaults
        const emailSubject = req.body.emailSubject || 'Confirmation de suppression du compte';
        const emailBody = req.body.emailBody || 
            `Hello ${user.firstName} ${user.lastName},\n\nVotre compte a été supprimé avec succès.`;

        // Send email to user using email service
        await emailService.sendEmail(user.email, {
            subject: emailSubject,
            html: emailBody
        });

        res.status(200).json({
            success: true,
            message: 'Utilisateur supprimé avec succès', //User deleted successfully
            emailSent: true
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: err.message,
            emailSent: false
        });
    }
};
