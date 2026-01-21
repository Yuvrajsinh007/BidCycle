const express = require('express');
const router = express.Router();
const { 
  register, 
  login, 
  getMe, 
  updateProfile, 
  changePassword, 
  uploadProfilePic, 
  deleteAccount,
  forgotPassword, 
  resetPassword 
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Public routes
router.post('/register', register);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);

// ✅ FIX: Changed from POST to PUT to match frontend update logic
router.put('/reset-password', resetPassword);

// Protected routes
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);
router.put('/change-password', protect, changePassword);
router.post('/profile-pic', protect, upload.single('profilePic'), uploadProfilePic);
router.delete('/account', protect, deleteAccount);

module.exports = router;