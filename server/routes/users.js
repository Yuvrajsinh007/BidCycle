const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { 
    toggleWatchlist, 
    getWatchlist,
    addReview, 
    editReview,
    deleteReview,
    getSellerProfile,
} = require('../controllers/userController');

// All routes are protected
router.post('/watchlist', protect, toggleWatchlist);
router.get('/watchlist', protect, getWatchlist);

// Reviews & Profile
router.post('/reviews', protect, addReview);
router.put('/reviews/:id', protect, editReview);
router.delete('/reviews/:id', protect, deleteReview);
router.get('/profile/:id', getSellerProfile);

module.exports = router;