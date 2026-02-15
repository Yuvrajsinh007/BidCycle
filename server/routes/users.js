const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { 
    toggleWatchlist, 
    getWatchlist,
    addReview, 
    getSellerProfile
} = require('../controllers/userController');

// All routes are protected
router.post('/watchlist', protect, toggleWatchlist);
router.get('/watchlist', protect, getWatchlist);

// Reviews & Profile
router.post('/reviews', protect, addReview);
router.get('/profile/:id', getSellerProfile);

module.exports = router;