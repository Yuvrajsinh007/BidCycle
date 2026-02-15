const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  targetUser: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  }, // The Seller being reviewed
  author: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  }, // The Buyer leaving the review
  rating: { 
    type: Number, 
    required: true, 
    min: 1, 
    max: 5 
  },
  comment: { 
    type: String, 
    required: true 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

// Prevent user from reviewing the same seller twice
reviewSchema.index({ targetUser: 1, author: 1 }, { unique: true });

module.exports = mongoose.model('Review', reviewSchema);