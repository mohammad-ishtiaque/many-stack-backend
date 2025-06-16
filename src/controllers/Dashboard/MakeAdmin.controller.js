const User = require('../../models/User');
const Admin = require('../../models/Admin');
const bcrypt = require('bcryptjs');


exports.createAdmin = async (req, res) => {
    try {
        const { name, email, password, userType } = req.body;

        // Check if user already exists
        let admin = await Admin.findOne({ email });
        if (admin) {
            return res.status(400).json({
                success: false,
                message: 'User with this email already exists'
            });
        }

        // Create new user with admin role
        admin = new Admin({
            name: name,
            email,
            password,
            role: userType.toUpperCase(), // Ensure role is uppercase
            permissions: {
                userManagement: true,
                subscriptionManagement: true,
                categoryManagement: true,
                adminManagement: false,
                settingsManagement: true
            }
        });

        // Hash password before saving
        const salt = await bcrypt.genSalt(10);
        admin.password = await bcrypt.hash(password, salt);
        
        await admin.save();

        // Create admin permissions
        // const admin = new Admin({
        //     user: user._id,
        //     permissions: {
        //         userManagement: true,
        //         subscriptionManagement: true,
        //         categoryManagement: true,
        //         adminManagement: true,
        //         settingsManagement: true
        //     }
        // });

        // await admin.save();

        res.status(201).json({
            success: true,
            message: 'Admin created successfully',
            data: {
                admin: {
                    id: admin._id,
                    name: admin.firstName,
                    email: admin.email,
                    role: admin.role
                },
                permissions: admin.permissions
            }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

exports.getAllAdmins = async (req, res) => {
    try {
        const admins = await Admin.find({ role: 'ADMIN' && 'SUPERADMIN' })
            .select('name email role');

        res.status(200).json({
            success: true,
            data: admins
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

exports.deleteAdmin = async (req, res) => {
    try {
        const { id } = req.params;


        const adminExists = await Admin.findById(id);
        if (!adminExists) {
            return res.status(404).json({
                success: false,
                message: 'Admin not found'
            });
        }

        // Delete admin permissions first
        await Admin.findOneAndDelete({ admin: id });
        
        // Then delete user
        await Admin.findByIdAndDelete(id);

        res.status(200).json({
            success: true,
            message: 'Admin deleted successfully'
        });

    } catch (error) {
        res.status(500).json({
            success: false, 
            message: error.message
        });
    }
};



exports.createSuperAdmin = async (req, res) => {
    try {
        const { name, email, password, userType } = req.body;

        // Check if user already exists
        let admin = await Admin.findOne({ email });
        if (admin) {
            return res.status(400).json({
                success: false,
                message: 'User with this email already exists'
            });
        }

        // Create new user with admin role
        admin = new Admin({
            name: name,
            email,
            password,
            role: userType.toUpperCase(), // Ensure role is uppercase
            permissions: {
                userManagement: true,
                subscriptionManagement: true,
                categoryManagement: true,
                adminManagement: true,
                settingsManagement: true
            }
        });

        // Hash password before saving
        const salt = await bcrypt.genSalt(10);
        admin.password = await bcrypt.hash(password, salt);
        
        await admin.save();

        // Create admin permissions
        // const admin = new Admin({
        //     user: user._id,
        //     permissions: {
        //         userManagement: true,
        //         subscriptionManagement: true,
        //         categoryManagement: true,
        //         adminManagement: true,
        //         settingsManagement: true
        //     }
        // });

        // await admin.save();

        res.status(201).json({
            success: true,
            message: 'Admin created successfully',
            data: {
                admin: {
                    id: admin._id,
                    name: admin.firstName,
                    email: admin.email,
                    role: admin.role
                },
                permissions: admin.permissions
            }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};