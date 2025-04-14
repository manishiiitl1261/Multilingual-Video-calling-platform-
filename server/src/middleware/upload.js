const multer = require('multer');
const path = require('path');

// Set storage engine
const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function(req, file, cb) {
        cb(null, `user-${req.user.id}-${Date.now()}${path.extname(file.originalname)}`);
    }
});

// Check file type
const fileFilter = (req, file, cb) => {
    // Allowed file extensions
    const allowedFileTypes = ['.jpg', '.jpeg', '.png', '.gif', '.svg'];
    const ext = path.extname(file.originalname).toLowerCase();
    
    // Allow images only
    if (file.mimetype.startsWith('image') && allowedFileTypes.includes(ext)) {
        cb(null, true);
    } else {
        cb(new Error(`Please upload a valid image file. Allowed formats: ${allowedFileTypes.join(', ')}`), false);
    }
};

// Initialize upload with limits
const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: fileFilter
});

// Error handling middleware
const handleUploadErrors = (req, res, next) => {
    const multerUpload = upload.single('profilePicture');
    
    multerUpload(req, res, function(err) {
        if (err instanceof multer.MulterError) {
            // A Multer error occurred during upload
            if (err.code === 'LIMIT_FILE_SIZE') {
                return res.status(400).json({
                    success: false,
                    message: 'File size too large. Maximum size is 5MB'
                });
            }
            return res.status(400).json({
                success: false,
                message: `Upload error: ${err.message}`
            });
        } else if (err) {
            // An unknown error occurred
            return res.status(400).json({
                success: false,
                message: err.message
            });
        }
        
        // No errors, continue
        next();
    });
};

module.exports = {
    upload,
    handleUploadErrors
}; 