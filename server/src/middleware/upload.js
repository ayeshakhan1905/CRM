const multer = require('multer');
const imagekit = require('../config/imagekit');

// Configure multer for memory storage (since we're uploading to cloud)
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  // Accept only image files
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  }
});

// Middleware to upload to ImageKit
const uploadToImageKit = async (req, res, next) => {
  try {
    if (!req.file) {
      return next();
    }

    // Upload to ImageKit
    const result = await imagekit.upload({
      file: req.file.buffer,
      fileName: `profile_${Date.now()}_${req.user._id}`,
      folder: '/crm_profiles'
    });

    // Add the URL to the request
    req.imageUrl = result.url;
    req.imageId = result.fileId;

    next();
  } catch (error) {
    console.error('ImageKit upload error:', error);
    return res.status(500).json({ message: 'Failed to upload image' });
  }
};

module.exports = {
  upload,
  uploadToImageKit
};