const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;
require('dotenv').config();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configure Cloudinary storage
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    let folder;
    let resource_type = 'image'; // Default

    // Determine folder and resource type based on file
    if (req.originalUrl.includes('profile-pic')) {
      folder = 'BidCycle/Profile';
    } else if (req.originalUrl.includes('items')) {
      folder = 'BidCycle/Item_Images';
    } else if (req.originalUrl.includes('chat')) {
      folder = 'BidCycle/Chat_Files';
      // Auto-detect type for chat (could be video or raw file)
      if (file.mimetype.startsWith('video/')) resource_type = 'video';
      else if (!file.mimetype.startsWith('image/')) resource_type = 'raw';
    } else {
      folder = 'BidCycle/misc';
    }

    return {
      folder: folder,
      resource_type: resource_type, // Important for videos/docs
      // Remove allowed_formats to accept all (or specify list: ['jpg', 'png', 'mp4', 'pdf', ...])
      public_id: `${file.fieldname}-${Date.now()}`
    };
  }
});

// Updated File filter
const fileFilter = (req, file, cb) => {
  // Allow Images, Videos, and specific Documents
  const allowedTypes = [
    'image/jpeg', 'image/png', 'image/webp', 'image/jpg',
    'video/mp4', 'video/mkv', 'video/webm',
    'application/pdf', 
    'application/msword', // .doc
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document' // .docx
  ];

  if (allowedTypes.includes(file.mimetype) || file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only images, videos, and docs are allowed!'), false);
  }
};

// Configure multer
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // Increased to 10MB for videos/docs
  },
  fileFilter: fileFilter
});

module.exports = upload;