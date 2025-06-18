const Intervention = require('../models/Intervention');
const { deleteFile } = require('../utils/unLinkFiles');
const { getLocationName } = require('../utils/geocoder');


exports.createIntervention = async (req, res) => {
    try {
        const userId = req.user.id || req.user._id;
        const { category, price, note, status, latitude, longitude } = req.body;

        // Get location name once for all images
        let location = 'Unknown Location';
        if (latitude && longitude) {
            location = await getLocationName(latitude, longitude);
        }

        // Process all images with the same location
        const imagePromises = req.files ? req.files.map(async (file) => {
            return {
                url: file.path,
                location: location,
                createdAt: new Date()
            };
        }) : [];

        const images = await Promise.all(imagePromises);

        const intervention = await Intervention.create({
            category,
            price,
            note,
            status: status.toUpperCase(),
            images,
            user: userId
        });

        res.status(201).json({
            success: true,
            intervention
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
}


exports.getAllInterventions = async (req, res) => {
    try {
        const userId = req.user.id || req.user._id;
        const interventions = await Intervention.find({ user: userId });
        res.status(200).json({
            success: true,
            interventions
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
}

exports.getInterventionById = async (req, res) => {
    try {
        const { id } = req.params;
        const intervention = await Intervention.findById(id);
        res.status(200).json({
            success: true,
            intervention
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
}

exports.updateIntervention = async (req, res) => {
    try {
        const { id } = req.params;
        const { category, price, note, status, latitude, longitude } = req.body;
        
        const existingIntervention = await Intervention.findById(id);
        if (!existingIntervention) {
            return res.status(404).json({
                success: false,
                message: 'Intervention not found'
            });
        }

        // Get location name once if new images are being added
        let location = 'Unknown Location';
        if (req.files && req.files.length > 0 && latitude && longitude) {
            location = await getLocationName(latitude, longitude);
        }

        // Process new images with the same location
        const newImages = req.files ? req.files.map(file => ({
            url: file.path,
            location: location,
            createdAt: new Date()
        })) : [];

        const updateData = {
            category,
            price,
            note,
            status: status ? status.toUpperCase() : existingIntervention.status,
        };

        // If new images were uploaded, combine them with existing images
        if (newImages.length > 0) {
            updateData.images = [...(existingIntervention.images || []), ...newImages];
        }

        const intervention = await Intervention.findByIdAndUpdate(
            id,
            updateData,
            { new: true }
        );

        res.status(200).json({
            success: true,
            intervention
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

exports.deleteIntervention = async (req, res) => {
    try {
        const { id } = req.params;
        const existingIntervention = await Intervention.findById(id);

        const userId = req.user.id || req.user._id;
        if (existingIntervention.user.toString() !== userId) {
            return res.status(403).json({ 
                message: 'Not authorized to delete this intervention' 
            });
        }

        // Delete all associated image files
        if (existingIntervention.images && existingIntervention.images.length > 0) {
            for (const image of existingIntervention.images) {
                try {
                    await deleteFile(image.url);
                } catch (deleteError) {
                    console.error(`Error deleting file ${image.url}:`, deleteError);
                }
            }
        }

        await Intervention.findByIdAndDelete(id);
        res.status(200).json({
            success: true,
            message: 'Intervention deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

exports.deleteImage = async (req, res) => {
    try {
        const { id } = req.params;
        const { imageUrl } = req.body;

        const intervention = await Intervention.findById(id);
        if (!intervention) {
            return res.status(404).json({
                success: false,
                message: 'Intervention not found'
            });
        }

        // Check if user owns this intervention
        const userId = req.user.id || req.user._id;
        if (intervention.user.toString() !== userId) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to modify this intervention'
            });
        }

        // Find the image in the images array
        const imageIndex = intervention.images.findIndex(img => img.url === imageUrl);
        if (imageIndex === -1) {
            return res.status(404).json({
                success: false,
                message: 'Image not found in this intervention'
            });
        }

        // Remove the image from the array
        intervention.images.splice(imageIndex, 1);
        await intervention.save();

        // Delete the actual file
        try {
            await deleteFile(imageUrl);
        } catch (deleteError) {
            console.error(`Error deleting file ${imageUrl}:`, deleteError);
        }

        res.status(200).json({
            success: true,
            message: 'Image deleted successfully',
            intervention
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

exports.addImages = async (req, res) => {
    try {
        const { id } = req.params;
        const { latitude, longitude } = req.body;
        
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No images provided'
            });
        }

        const intervention = await Intervention.findById(id);
        if (!intervention) {
            return res.status(404).json({
                success: false,
                message: 'Intervention not found'
            });
        }

        // Get location name once
        let location = 'Unknown Location';
        if (latitude && longitude) {
            location = await getLocationName(latitude, longitude);
        }

        // Create new image objects with the same location
        const newImages = req.files.map(file => ({
            url: file.path,
            location: location,
            createdAt: new Date()
        }));
        
        // Add new images to existing ones
        intervention.images = [...intervention.images, ...newImages];
        await intervention.save();

        res.status(200).json({
            success: true,
            message: 'Images added successfully',
            intervention
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};




