const Support = require('../models/Support');


exports.createSupport = async (req, res) => {
    try {
        const { subject, message } = req.body;
        const userId = req.user.id || req.user._id;

        const support = await Support.create({ subject, message, user: userId });

        res.status(201).json({
            success: true,
            message: 'Support created successfully',
            support
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
}

exports.getAllSupports = async (req, res) => {
    try {
        const supports = await Support.find();
        res.status(200).json({
            success: true,
            message: 'Supports retrieved successfully',
            supports
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
}

exports.getSupportById = async (req, res) => {
    try {
        const { id } = req.params;
        const support = await Support.findById(id);
        res.status(200).json({
            success: true,
            message: 'Support retrieved successfully',
            support
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
}

exports.updateSupport = async (req, res) => {
    try {
        const { id } = req.params;
        const { subject, message } = req.body;
        const userId = req.user.id || req.user._id;

        const support = await Support.findByIdAndUpdate(id, { subject, message }, { new: true });

        res.status(200).json({
            success: true,
            message: 'Support updated successfully',
            support
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
}


exports.deleteSupport = async (req, res) => {
    try {
        const { id } = req.params;
        const support = await Support.findByIdAndDelete(id);
        if (!support) {
            return res.status(404).json({
                success: false,
                message: 'Support not found'
            });
        }
        res.status(200).json({
            success: true,
            message: 'Support deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
}

