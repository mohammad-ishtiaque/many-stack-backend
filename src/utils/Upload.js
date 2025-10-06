const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;

// Ensure uploads directory exists
async function ensureUploadsDirectory() {
  try {
    await fs.access('uploads');
  } catch {
    await fs.mkdir('uploads', { recursive: true });
  }
}

// Ensure directory exists when the module is loaded
ensureUploadsDirectory();

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads')
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname)
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = [ 'image/jpeg', 'image/png', 'image/jpg', 'image/gif', 'image/webp'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, JPG, GIF and WEBP are allowed!'), false);
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

module.exports = upload;