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

// File filter to allow only images
const fileFilter = (req, file, cb) => {
    if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png' || file.mimetype === 'image/gif' || file.mimetype === 'image/jpg' || file.mimetype === 'image/webp' || file.mimetype === 'image/svg+xml' || file.mimetype === 'image/bmp') {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type, only JPEG, PNG, GIF, JPG, WEBP, SVG, and BMP is allowed!'), false);
    }
};

const upload = multer({
    fileFilter,
    storage: multerS3({
        s3: s3,
        bucket: process.env.AWS_BUCKET_NAME,
        contentType: multerS3.AUTO_CONTENT_TYPE,
        metadata: function (req, file, cb) {
            cb(null, { fieldName: file.fieldname });
        },
        key: function (req, file, cb) {
            // Generate a unique file name
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
            cb(null, 'user-profile-' + req.user.id + '-' + uniqueSuffix + path.extname(file.originalname));
        }
    })
});

module.exports = upload;
