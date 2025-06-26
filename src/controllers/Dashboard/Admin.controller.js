const Admin = require('../../models/Admin');
const bcrypt = require('bcryptjs');


exports.updateAdmin = async (req, res) => {
    try {
        const id = req.user.id;
        
        const admin = await Admin.findById(id);
        if (!admin) {
            return res.status(404).json({
                success: false,
                message: 'Admin not found'
            });
        }
        admin.name = req.body.name;
        // admin.email = req.body.email;
        admin.contact = req.body.contact;
        admin.address = req.body.address;
        
        await admin.save();
        res.status(200).json({
            success: true,
            admin,
            message: 'Admin updated successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false, 
            message: error.message
        });
    }
};


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
