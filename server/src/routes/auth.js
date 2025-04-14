const express = require('express');
const router = express.Router();
const { 
    register, 
    login, 
    verifyOTP, 
    sendLoginOTP, 
    getMe, 
    updateProfile, 
    logout,
    forgotPassword,
    resetPassword
} = require('../controllers/auth');
const { protect } = require('../middleware/auth');
const { handleUploadErrors } = require('../middleware/upload');

// Public routes
router.post('/register', register);
router.post('/login', login);
router.post('/verify-otp', verifyOTP);
router.post('/send-login-otp', sendLoginOTP);
router.post('/forgot-password', forgotPassword);
router.put('/reset-password/:resettoken', resetPassword);

// Protected routes
router.get('/me', protect, getMe);
router.put('/update-profile', protect, handleUploadErrors, updateProfile);
router.get('/logout', protect, logout);

module.exports = router;