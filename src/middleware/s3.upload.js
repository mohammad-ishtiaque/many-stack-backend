
const { S3Client } = require('@aws-sdk/client-s3');
const multer = require('multer');
const multerS3 = require('multer-s3');
const path = require('path');
const dotenv = require('dotenv');
dotenv.config();

// Configure AWS S3 v3 client
const s3 = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    }
});

// File filter to allow only images (do not throw to avoid crashing server)
const fileFilter = (req, file, cb) => {
    const allowed = [
        'image/jpeg', 'image/png', 'image/gif', 'image/jpg',
        'image/webp', 'image/svg+xml', 'image/bmp'
    ];
    if (allowed.includes(file.mimetype)) {
        return cb(null, true);
    }
    // Reject file without throwing; route should handle missing file case
    return cb(null, false);
};

const upload = multer({
    fileFilter,
    storage: multerS3({
        s3: s3,
        bucket: process.env.S3_BUCKET || process.env.AWS_BUCKET_NAME,
        // Ensure correct content-type so browsers can render images
        contentType: multerS3.AUTO_CONTENT_TYPE,
        // Force inline display in browser instead of download
        contentDisposition: 'inline',
        metadata: function (req, file, cb) {
            cb(null, { fieldName: file.fieldname });
        },
        key: function (req, file, cb) {
            // Generate a unique file name
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
            const userId = (req.user && (req.user.id || req.user._id)) || 'anon';
            cb(null, 'user-profile-' + userId + '-' + uniqueSuffix + path.extname(file.originalname));
        }
    })
});

module.exports = upload;