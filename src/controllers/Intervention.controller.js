const Intervention = require('../models/Intervention');
const { deleteFile } = require('../utils/unLinkFiles');
exports.createIntervention = async (req, res) => {
    try {

        const images = req.files ? req.files.map(file => file.path) : [];
        const userId = req.user.id || req.user._id;

        const { category, price, note, status } = req.body;

        const intervention = await Intervention.create({
            category,
            price,
            note,
            status,
            images: images,
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
        
        // First get the existing intervention
        const existingIntervention = await Intervention.findById(id);
        if (!existingIntervention) {
            return res.status(404).json({
                success: false,
                message: 'Intervention not found'
            });
        }

        // Get new images if any were uploaded
        const newImages = req.files ? req.files.map(file => file.path) : [];
        
        // Prepare update data
        const { category, price, note, status } = req.body;
        const updateData = {
            category,
            price,
            note,
            status
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
}

exports.deleteIntervention = async (req, res) => {
    try {
        const { id } = req.params;
        const existingIntervention = await Intervention.findById(id);


        const userId = req.user.id || req.user._id;
        // Check if the user owns this intervention
        if (existingIntervention.user.toString() !== userId) {
            return res.status(403).json({ message: 'Not authorized to delete this intervention' });
        }

        if (existingIntervention.images && existingIntervention.images.length > 0) {
            for (const imagesPath of existingIntervention.images) {
                try {
                    await deleteFile(imagesPath);
                    console.log(imagesPath);
                } catch (deleteError) {
                    console.error(`Error deleting file ${imagesPath}:`, deleteError);
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
}

exports.deleteImage = async (req, res) => {
    try {
        const { id } = req.params;
        const { imageUrl } = req.body;

        // Find the intervention
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

        // Check if the image exists in the intervention
        if (!intervention.images.includes(imageUrl)) {
            return res.status(404).json({
                success: false,
                message: 'Image not found in this intervention'
            });
        }

        // Remove the image from the array
        intervention.images = intervention.images.filter(img => img !== imageUrl);
    
       

        await intervention.save();
        

        // Delete the actual file
        try {
            await deleteFile(imageUrl);
        } catch (deleteError) {
            console.error(`Error deleting file ${imageUrl}:`, deleteError);
            // Continue execution even if file deletion fails
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
        
        // Check if files were uploaded
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No images provided'
            });
        }

        // Find the intervention
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

        // Add new images to the existing ones
        const newImages = req.files.map(file => file.path);
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




