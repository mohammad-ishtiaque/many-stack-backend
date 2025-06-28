const Admin = require('../../models/Admin');
const bcrypt = require('bcryptjs');
const emailService = require('../../utils/emailService');
const jwt = require('jsonwebtoken');




exports.updatePassword = async (req, res) => {
    try {
        const id = req.user.id;
        const admin = await Admin.findById(id);
        if (!admin) {
            return res.status(404).json({
                success: false,
                message: 'Admin not found'
            });
        }
        const { oldPassword, newPassword, confirmNewPassword } = req.body;
        if (!oldPassword || !newPassword || !confirmNewPassword) {
            return res.status(400).json({
                success: false,
                message: 'Please provide all required fields'
            });
        }
        const isMatch = await bcrypt.compare(oldPassword, admin.password);
        if (!isMatch) {
            return res.status(400).json({
                success: false,
                message: 'Old password is incorrect'
            });
        }
        if (newPassword !== confirmNewPassword) {
            return res.status(400).json({
                success: false,
                message: 'New password and confirm password do not match'
            });
        }
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);
        admin.password = hashedPassword;
        await admin.save();
        res.status(200).json({
            success: true,
            message: 'Password updated successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


// exports.adminLogin = async (req, res) => {
//     try {
//         const { email, password } = req.body;
//         if (!email || !password) {
//             return res.status(400).json({
//                 success: false,
//                 message: 'Please provide all required fields'
//             });
//         }
//         const admin = await Admin.findOne({ email });
//         if (!admin) {
//             return res.status(404).json({
//                 success: false,
//                 message: 'Admin not found'
//             });
//         }
//         const isMatch = await bcrypt.compare(password, admin.password);
//         if (!isMatch) {
//             return res.status(400).json({
//                 success: false,
//                 message: 'Password is incorrect'
//             });
//         }
//         const token = jwt.sign({ user: admin }, process.env.JWT_SECRET, { expiresIn: '400h' });
//         res.status(200).json({
//             success: true,
//             token,
//             admin,
//             user: {
//                 id: admin.id,
//                 name: admin.name,
//                 email: admin.email,
//                 role: admin.role,
//                 permissions: admin.permissions
//             },
//             message: 'Login successful'
//         });
//     } catch (error) {
//         res.status(500).json({
//             success: false, 
//             message: error.message
//         });
//     }
// };


exports.resetAdminPassword = async (req, res) => {
    const { email, newPassword, confirmPassword } = req.body;

    try {
        // 1. Validate password match
        if (newPassword !== confirmPassword) {
            return res.status(400).json({ message: 'Passwords do not match' });
        }

        // 2. Find user
        const admin = await Admin.findOne({ email });
        if (!admin) {
            return res.status(404).json({ message: 'Admin not found' });
        }

        // 3. Hash new password
        const salt = await bcrypt.genSalt(10);
        admin.password = await bcrypt.hash(newPassword, salt);

        // 4. Clear reset code fields
        admin.resetCode = undefined;
        admin.resetCodeExpires = undefined;

        // 5. Save user
        await admin.save();

        res.json({
            success: true,
            message: 'Password updated successfully'
        });

    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Server error' });
    }
};


exports.adminForgetPassword = async (req, res) => {
    try {
        const { email } = req.body;

        // 1. Find admin
        const admin = await Admin.findOne({ email });
        if (!admin) {
            return res.status(404).json({ message: 'Admin not found' });
        }

        // 2. Generate 6-digit verification code
        const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

        // 3. Save code to admin with expiry (15 minutes)
        admin.resetCode = verificationCode;
        admin.resetCodeExpires = new Date(Date.now() + 15 * 60 * 1000);
        await admin.save();

        // 4. Send verification code via email
        try {
            await emailService.sendOTP(
                email,
                verificationCode,
                admin.name
            );

            res.json({
                success: true,
                message: 'Verification code sent to your email'
            });
        } catch (emailError) {
            // If email fails, reset the admin's verification code
            admin.resetCode = undefined;
            admin.resetCodeExpires = undefined;
            await admin.save();

            throw new Error('Failed to send verification email');
        }
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.adminVerifyCode = async (req, res) => {
    try {
        const { code } = req.body;

        const admin = await Admin.findOne({
            resetCode: code,
            resetCodeExpires: { $gt: Date.now() }
        });

        if (!admin) {
            return res.status(400).json({ message: 'Invalid or expired verification code' });
        }

        res.json({
            success: true,
            message: 'Code verified successfully',
            email: admin.email
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.adminResendCode = async (req, res) => {
    try {
        const { email } = req.body;

        // 1. Find admin
        const admin = await Admin.findOne({ email });
        if (!admin) {
            return res.status(404).json({ message: 'Admin not found' });
        }

        // 2. Generate new 6-digit verification code
        const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

        // 3. Update code and expiry
        admin.resetCode = verificationCode;
        admin.resetCodeExpires = new Date(Date.now() + 15 * 60 * 1000);
        await admin.save();

        // 4. Send verification code via email
        try {
            await emailService.sendOTP(
                email,
                verificationCode,
                admin.name
            );

            res.json({
                success: true,
                message: 'Verification code resent to your email'
            });
        } catch (emailError) {
            // If email fails, reset the admin's verification code
            admin.resetCode = undefined;
            admin.resetCodeExpires = undefined;
            await admin.save();

            throw new Error('Failed to resend verification email');
        }
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.updateAdmin = async (req, res) => {
    try {
        const id = req.user.id;

        // Prepare update data
        const updateData = {
            name: req.body.name,
            contact: req.body.contact,
            address: req.body.address
        };

        // If there's an uploaded file, add it to the update data
        if (req.file) {
            updateData.image = req.file.path.replace(/\\/g, '/').replace('public', '');
        }

        // Find and update the admin
        const admin = await Admin.findByIdAndUpdate(
            id,
            { $set: updateData },
            { new: true, runValidators: true }
        ).select('-password');

        if (!admin) {
            return res.status(404).json({
                success: false,
                message: 'Admin not found'
            });
        }


        res.status(200).json({
            success: true,
            data: admin,
            message: 'Profile updated successfully'
        });
    } catch (error) {
        console.error('Error updating admin:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Server error while updating admin profile'
        });
    }
};

exports.getAdminProfile = async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'No token provided'
            });
        }
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const id = decoded.user._id || decoded.user.id;
        if (!id) {
            return res.status(401).json({
                success: false,
                message: 'Invalid token'
            });
        }

        const admin = await Admin.findById(id).select('-password');
        if (!admin) {
            return res.status(404).json({
                success: false,
                message: 'Admin not found'
            });
        }
        res.status(200).json({
            success: true,
            data: admin
        });
    } catch (error) {
        console.error('Error fetching admin profile:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Server error while fetching admin profile'
        });
    }
};
