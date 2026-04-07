const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  targetUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, maxlength: 500 },
  createdAt: { type: Date, default: Date.now }
});

reviewSchema.index({ author: 1, targetUser: 1 }, { unique: true });

reviewSchema.statics.calculateAverageRating = async function(targetUserId) {
  const obj = await this.aggregate([
    { $match: { targetUser: targetUserId } },
    { $group: { _id: '$targetUser', averageRating: { $avg: '$rating' }, totalReviews: { $sum: 1 } } }
  ]);
  
  try {
    await mongoose.model('User').findByIdAndUpdate(targetUserId, {
      averageRating: obj.length > 0 ? Math.round(obj[0].averageRating * 10) / 10 : 0,
      totalReviews: obj.length > 0 ? obj[0].totalReviews : 0
    });
  } catch (err) {
    console.error('Error calculating average rating:', err);
  }
};

reviewSchema.post('save', function() {
  this.constructor.calculateAverageRating(this.targetUser);
});

reviewSchema.post('remove', function() {
  this.constructor.calculateAverageRating(this.targetUser);
});

module.exports = mongoose.model('Review', reviewSchema);