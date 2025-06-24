const Intervention = require('../models/Intervention');
const { deleteFile } = require('../utils/unLinkFiles');
const { getLocationName } = require('../utils/geocoder');
const Category = require('../models/Category');
const singleDocToPDF = require('../utils/downloadpdf');

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
        await intervention.populate('category', 'name');
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
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        // console.log(req.query)
        const seaarch = req.query.search || '';
        // console.log('Search query:', seaarch);


        // Get date filters from params or query
        const fromDate = req.query.fromDate ? new Date(req.query.fromDate) : new Date(0);
        const toDate = req.query.toDate ? new Date(req.query.toDate) : new Date();

        // Build query object
        let query = { user: userId };

        // Add date range to query if dates are provided
        if (fromDate || toDate) {
            query.createdAt = {};
            if (fromDate) {
                fromDate.setHours(0, 0, 0, 0); // Start of day
                query.createdAt.$gte = fromDate;
            }
            if (toDate) {
                toDate.setHours(23, 59, 59, 999); // End of day
                query.createdAt.$lte = toDate;
            }
        }


        // Search filter by category
        if (seaarch) {
            // Find matching categories by name
            const categories = await Category.find({ name: { $regex: seaarch, $options: 'i' } }).select('_id');
            console.log('Categories found:', categories);
            const categoryIds = categories.map(cat => cat._id);
            query.category = { $in: categoryIds };
        }

        // Get total count with applied filters
        const totalCount = await Intervention.countDocuments(query);

        // Get filtered and paginated interventions
        const interventions = await Intervention.find(query)
            .populate('category', 'name')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .exec();

        if (interventions.length === 0) {
            return res.status(200).json({
                success: true,
                interventions: [],
                message: 'No interventions found for the given filters.',
                pagination: {
                    currentPage: page,
                    totalPages: 0,
                    totalItems: 0,
                    itemsPerPage: limit,
                    hasMore: false,
                    dateFilter: {
                        fromDate: fromDate?.toISOString(),
                        toDate: toDate?.toISOString()
                    }
                }
            });
        }

        res.status(200).json({
            success: true,
            interventions,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(totalCount / limit),
                totalItems: totalCount,
                itemsPerPage: limit,
                hasMore: totalCount > (skip + interventions.length),
                dateFilter: {
                    fromDate: fromDate?.toISOString(),
                    toDate: toDate?.toISOString()
                }
            }
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
        const intervention = await Intervention.findById(id)
        .populate('category', 'name');

        console.log('Intervention found:', intervention);
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

exports.downloadSingleInterventionPDF = async (req, res) => {
    try {
        const { id } = req.params;
        const intervention = await Intervention.findById(id)
            .populate('category', 'name');


        if (!intervention) {
            return res.status(404).json({
                success: false,
                message: 'intervention not found'
            });
        }

        singleDocToPDF({
            docData: intervention,
            fields: ['interventionId', 'price', 'note', 'status', 'category.name', 'createdAt'],
            labels: ['Id', 'Price', 'Note', 'Status', 'Category', 'Date', ],
            filename: `intervention_${id}.pdf`,
            res,
            title: 'intervention Details'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};





