const User = require('../models/User');
const Item = require('../models/Item');
const Review = require('../models/Review');

// Toggle Watchlist (Add/Remove)
exports.toggleWatchlist = async (req, res) => {
  try {
    const { itemId } = req.body;
    const user = await User.findById(req.user._id);
    
    // Check if item exists
    const item = await Item.findById(itemId);
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    const index = user.watchlist.indexOf(itemId);

    if (index === -1) {
      // Add to watchlist
      user.watchlist.push(itemId);
      await user.save();
      res.json({ message: 'Added to watchlist', watchlist: user.watchlist, isAdded: true });
    } else {
      // Remove from watchlist
      user.watchlist.splice(index, 1);
      await user.save();
      res.json({ message: 'Removed from watchlist', watchlist: user.watchlist, isAdded: false });
    }
  } catch (error) {
    console.error('Toggle watchlist error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get User's Watchlist
exports.getWatchlist = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate({
      path: 'watchlist',
      populate: { path: 'seller', select: 'name' } // Populate seller info inside items
    });

    res.json(user.watchlist);
  } catch (error) {
    console.error('Get watchlist error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.addReview = async (req, res) => {
  try {
    const { targetUserId, rating, comment } = req.body;
    
    if (targetUserId === req.user._id.toString()) {
      return res.status(400).json({ message: 'You cannot review yourself.' });
    }

    const review = await Review.create({
      targetUser: targetUserId,
      author: req.user._id,
      rating,
      comment
    });

    await review.populate('author', 'name profilePic');

    res.status(201).json(review);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'You have already reviewed this seller.' });
    }
    console.error('Add review error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get Seller Profile (Items + Reviews + Avg Rating)
exports.getSellerProfile = async (req, res) => {
  try {
    const sellerId = req.params.id;
    const seller = await User.findById(sellerId).select('name email profilePic createdAt');
    
    if (!seller) return res.status(404).json({ message: 'Seller not found' });

    // Get Active Items
    const items = await Item.find({ seller: sellerId, status: 'active' });

    // Get Reviews
    const reviews = await Review.find({ targetUser: sellerId })
      .populate('author', 'name profilePic')
      .sort({ createdAt: -1 });

    // Calculate Average Rating
    const avgRating = reviews.length > 0 
      ? (reviews.reduce((acc, item) => acc + item.rating, 0) / reviews.length).toFixed(1)
      : 0;

    res.json({
      seller,
      items,
      reviews,
      stats: {
        totalReviews: reviews.length,
        avgRating,
        totalItems: items.length
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};